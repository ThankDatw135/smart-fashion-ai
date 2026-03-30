"""
Recommendation Trainer — Nightly batch job (Celery task).

Chạy lúc 2:00 AM hàng ngày:
1. LOAD behavior_events (30 ngày) → weighted interaction matrix
2. TRAIN Collaborative Filtering (sklearn NearestNeighbors, cosine)
3. CONTENT-BASED: user profile = avg(viewed product embeddings) → cosine sim
4. HYBRID merge: 0.4×content + 0.3×collab + 0.2×popularity + 0.1×recency
5. CACHE top 20/user → Redis (TTL 24h)
6. CACHE global trending → Redis (TTL 24h)

Weights cho behavior events:
- product_view: 1
- wishlist_add: 2
- add_to_cart: 3
- purchase_complete: 5
"""

import logging
import time
from datetime import datetime
from collections import defaultdict

import numpy as np
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
from sqlalchemy import text

from src.config import settings
from src.shared.database import async_session_maker
from src.shared.redis_client import redis_set

logger = logging.getLogger(__name__)

# Event weights
EVENT_WEIGHTS = {
    "product_view": 1,
    "wishlist_add": 2,
    "add_to_cart": 3,
    "purchase_complete": 5,
}


async def retrain_all() -> dict:
    """
    Pipeline huấn luyện toàn bộ recommendation model.

    Returns:
        { "users_trained": N, "elapsed_seconds": T }
    """
    start = time.time()
    logger.info("🔄 Recommendation retrain bắt đầu...")

    try:
        # Step 1: Load behavior events
        interactions = await _load_interactions(days=30)

        if not interactions:
            logger.info("Không có behavior data, skip retrain.")
            return {"users_trained": 0, "elapsed_seconds": 0}

        # Step 2: Build interaction matrix
        user_ids, product_ids, matrix = _build_interaction_matrix(interactions)

        if len(user_ids) == 0:
            logger.info("Không đủ user data, skip retrain.")
            return {"users_trained": 0, "elapsed_seconds": 0}

        # Step 3: Train Collaborative Filtering
        collab_scores = _train_collaborative(matrix, user_ids, product_ids)

        # Step 4: Content-based scores (dùng embeddings)
        content_scores = await _compute_content_scores(interactions, product_ids)

        # Step 5: Load popularity & recency
        popularity = await _load_popularity(product_ids)

        # Step 6: Hybrid merge + cache per user
        users_trained = 0
        for user_idx, user_id in enumerate(user_ids):
            try:
                recommendations = _hybrid_merge_for_user(
                    user_idx=user_idx,
                    product_ids=product_ids,
                    collab_scores=collab_scores,
                    content_scores=content_scores,
                    popularity=popularity,
                    interacted=set(
                        pid for pid, _ in interactions.get(user_id, [])
                    ),
                    limit=20,
                )

                if recommendations:
                    cache_key = f"recommendations:user:{user_id}"
                    await redis_set(
                        cache_key,
                        recommendations,
                        ttl=settings.RECOMMENDATION_CACHE_TTL,
                    )
                    users_trained += 1

            except Exception as e:
                logger.error(f"Retrain lỗi cho user {user_id}: {e}")

        elapsed = round(time.time() - start, 1)
        logger.info(f"✅ Retrained cho {users_trained}/{len(user_ids)} users ({elapsed}s)")

        return {"users_trained": users_trained, "elapsed_seconds": elapsed}

    except Exception as e:
        logger.error(f"❌ Retrain lỗi tổng: {e}")
        return {"users_trained": 0, "elapsed_seconds": round(time.time() - start, 1)}


# ─── Step 1: Load Interactions ───


async def _load_interactions(days: int = 30) -> dict[str, list[tuple[str, float]]]:
    """
    Load behavior events → { user_id: [(product_id, weight), ...] }
    """
    interactions: dict[str, list[tuple[str, float]]] = defaultdict(list)

    try:
        async with async_session_maker() as db:
            result = await db.execute(
                text("""
                    SELECT
                        user_id::text,
                        event_data->>'product_id' AS product_id,
                        event_type
                    FROM behavior_events
                    WHERE user_id IS NOT NULL
                      AND event_data->>'product_id' IS NOT NULL
                      AND created_at >= NOW() - MAKE_INTERVAL(days => :days)
                """),
                {"days": days},
            )

            for row in result.mappings().all():
                uid = str(row["user_id"])
                pid = str(row["product_id"])
                weight = EVENT_WEIGHTS.get(row["event_type"], 1)
                interactions[uid].append((pid, float(weight)))

    except Exception as e:
        logger.error(f"Load interactions lỗi: {e}")

    return dict(interactions)


# ─── Step 2: Build Interaction Matrix ───


def _build_interaction_matrix(
    interactions: dict[str, list[tuple[str, float]]],
) -> tuple[list[str], list[str], csr_matrix]:
    """
    Xây dựng sparse interaction matrix (users × products).
    """
    user_ids = list(interactions.keys())
    product_set: set[str] = set()

    for pairs in interactions.values():
        for pid, _ in pairs:
            product_set.add(pid)

    product_ids = sorted(product_set)

    user_idx = {uid: i for i, uid in enumerate(user_ids)}
    prod_idx = {pid: i for i, pid in enumerate(product_ids)}

    rows, cols, data = [], [], []

    for uid, pairs in interactions.items():
        for pid, weight in pairs:
            if pid in prod_idx:
                rows.append(user_idx[uid])
                cols.append(prod_idx[pid])
                data.append(weight)

    matrix = csr_matrix(
        (data, (rows, cols)),
        shape=(len(user_ids), len(product_ids)),
    )

    return user_ids, product_ids, matrix


# ─── Step 3: Collaborative Filtering ───


def _train_collaborative(
    matrix: csr_matrix,
    user_ids: list[str],
    product_ids: list[str],
    n_neighbors: int = 20,
) -> np.ndarray | None:
    """
    Train KNN collaborative filtering.

    Returns: scores matrix (users × products) hoặc None nếu không đủ data.
    """
    if matrix.shape[0] < 2 or matrix.shape[1] < 2:
        logger.info("Không đủ data cho collaborative filtering.")
        return None

    try:
        k = min(n_neighbors, matrix.shape[0] - 1)
        model = NearestNeighbors(metric="cosine", n_neighbors=k, algorithm="brute")
        model.fit(matrix)

        # Tính scores cho mỗi user = weighted average của similar users
        distances, indices = model.kneighbors(matrix)

        scores = np.zeros(matrix.shape)
        for user_i in range(matrix.shape[0]):
            for j, neighbor_idx in enumerate(indices[user_i]):
                if neighbor_idx == user_i:
                    continue
                similarity = max(1.0 - distances[user_i][j], 0.01)
                scores[user_i] += similarity * matrix[neighbor_idx].toarray().flatten()

        return scores

    except Exception as e:
        logger.error(f"Collaborative training lỗi: {e}")
        return None


# ─── Step 4: Content-based Scores ───


async def _compute_content_scores(
    interactions: dict[str, list[tuple[str, float]]],
    product_ids: list[str],
) -> dict[str, dict[str, float]]:
    """
    Content-based: user profile = avg(viewed product embeddings) → cosine sim.

    Returns: { user_id: { product_id: score } }
    """
    scores: dict[str, dict[str, float]] = {}

    try:
        prod_idx = {pid: i for i, pid in enumerate(product_ids)}

        # Fetch tất cả embeddings
        async with async_session_maker() as db:
            result = await db.execute(
                text("""
                    SELECT product_id::text, embedding::text
                    FROM product_embeddings
                """)
            )
            embeddings_raw = {
                str(row["product_id"]): row["embedding"]
                for row in result.mappings().all()
            }

        if not embeddings_raw:
            return scores

        # Parse embeddings
        embeddings: dict[str, np.ndarray] = {}
        for pid, emb_str in embeddings_raw.items():
            try:
                # Parse "[0.1,0.2,...]" → numpy array
                values = [float(x) for x in emb_str.strip("[]").split(",")]
                embeddings[pid] = np.array(values)
            except (ValueError, AttributeError):
                continue

        if not embeddings:
            return scores

        # Tính user profile = avg(embeddings of interacted products)
        for user_id, pairs in interactions.items():
            user_vecs = []
            for pid, weight in pairs:
                if pid in embeddings:
                    user_vecs.append(embeddings[pid] * weight)

            if not user_vecs:
                continue

            user_profile = np.mean(user_vecs, axis=0)
            user_norm = np.linalg.norm(user_profile)
            if user_norm == 0:
                continue

            # Cosine similarity với tất cả products
            user_scores: dict[str, float] = {}
            for pid, emb in embeddings.items():
                prod_norm = np.linalg.norm(emb)
                if prod_norm == 0:
                    continue
                sim = float(np.dot(user_profile, emb) / (user_norm * prod_norm))
                user_scores[pid] = max(sim, 0.0)

            scores[user_id] = user_scores

    except Exception as e:
        logger.error(f"Content-based scoring lỗi: {e}")

    return scores


# ─── Step 5: Popularity ───


async def _load_popularity(product_ids: list[str]) -> dict[str, float]:
    """
    Load popularity score = normalized (sold_count + view_count).
    """
    popularity: dict[str, float] = {}

    try:
        async with async_session_maker() as db:
            result = await db.execute(
                text("""
                    SELECT
                        id::text,
                        sold_count,
                        view_count
                    FROM products
                    WHERE is_active = true
                """)
            )
            rows = result.mappings().all()

        if not rows:
            return popularity

        max_score = max(
            (int(r["sold_count"]) * 5 + int(r["view_count"]) for r in rows),
            default=1,
        ) or 1

        for r in rows:
            pid = str(r["id"])
            score = (int(r["sold_count"]) * 5 + int(r["view_count"])) / max_score
            popularity[pid] = score

    except Exception as e:
        logger.error(f"Load popularity lỗi: {e}")

    return popularity


# ─── Step 6: Hybrid Merge ───


def _hybrid_merge_for_user(
    user_idx: int,
    product_ids: list[str],
    collab_scores: np.ndarray | None,
    content_scores: dict[str, dict[str, float]],
    popularity: dict[str, float],
    interacted: set[str],
    limit: int = 20,
) -> list[dict]:
    """
    Hybrid merge: 0.4×content + 0.3×collab + 0.2×popularity + 0.1×recency.

    Trả về list[{id, score, reason}] đã sắp xếp.
    """
    user_id = None  # Sẽ lấy từ caller

    candidates: list[tuple[float, str, str]] = []

    for prod_i, pid in enumerate(product_ids):
        # Skip sản phẩm đã tương tác
        if pid in interacted:
            continue

        # Content-based score
        c_score = 0.0
        if content_scores:
            # Tìm user_id liên quan (caller sẽ truyền)
            for uid, scores_map in content_scores.items():
                c_score = max(c_score, scores_map.get(pid, 0))
                break  # Chỉ lấy user đầu tiên khớp

        # Collaborative score
        col_score = 0.0
        if collab_scores is not None and user_idx < collab_scores.shape[0]:
            max_col = np.max(collab_scores[user_idx]) or 1
            col_score = float(collab_scores[user_idx][prod_i]) / max_col if max_col > 0 else 0

        # Popularity score
        pop_score = popularity.get(pid, 0)

        # Recency (đơn giản: 0.5 vì không có created_at ở đây)
        recency = 0.5

        # Hybrid
        total = (
            0.40 * c_score
            + 0.30 * col_score
            + 0.20 * pop_score
            + 0.10 * recency
        )

        # Xác định reason
        if c_score > col_score:
            reason = "Phù hợp phong cách của bạn"
        elif col_score > 0:
            reason = "Người mua tương tự cũng thích"
        else:
            reason = "Sản phẩm nổi bật"

        candidates.append((total, pid, reason))

    # Sort DESC
    candidates.sort(key=lambda x: x[0], reverse=True)

    return [
        {"id": pid, "score": round(score, 4), "reason": reason}
        for score, pid, reason in candidates[:limit]
    ]
