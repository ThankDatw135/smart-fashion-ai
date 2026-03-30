"""
Embedding Service — Singleton quản lý sentence-transformers model.

Chức năng:
1. Load model 1 lần khi startup (warmup ~30s, download ~120MB lần đầu)
2. Tạo embedding text từ dữ liệu sản phẩm
3. Generate vector embedding (384 dims)
4. Upsert vào bảng product_embeddings (pgvector)
5. Batch re-index toàn bộ sản phẩm

Model: paraphrase-multilingual-MiniLM-L12-v2
- Hỗ trợ tiếng Việt
- Output: 384 dimensions
- Nhanh (~50ms/text trên CPU)
"""

import logging
import time
from typing import Any

import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy import text

from src.config import settings
from src.shared.database import async_session_maker

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Singleton quản lý embedding model cho AI Search & Recommendation.

    Sử dụng:
        service = EmbeddingService()
        await service.warmup()
        vector = service.generate_embedding("áo thun nam basic")
        await service.upsert_embedding(product_id, vector)
    """

    _instance: "EmbeddingService | None" = None
    _model: SentenceTransformer | None = None
    _is_ready: bool = False

    def __new__(cls) -> "EmbeddingService":
        """Đảm bảo chỉ có 1 instance (Singleton)."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def is_ready(self) -> bool:
        """Model đã load xong chưa."""
        return self._is_ready

    async def warmup(self) -> None:
        """
        Load model khi startup.

        Lần đầu sẽ download từ HuggingFace (~120MB).
        Các lần sau load từ cache (~5s).
        """
        if self._is_ready:
            logger.info("Embedding model đã sẵn sàng, skip warmup.")
            return

        start = time.time()
        model_name = settings.EMBEDDING_MODEL

        try:
            logger.info(f"🔄 Đang load embedding model: {model_name}...")
            self._model = SentenceTransformer(model_name)

            # Test encode để verify model hoạt động
            test_vector = self._model.encode("test warmup")
            assert len(test_vector) == settings.EMBEDDING_DIM, (
                f"Embedding dim mismatch: expected {settings.EMBEDDING_DIM}, got {len(test_vector)}"
            )

            self._is_ready = True
            elapsed = round(time.time() - start, 1)
            logger.info(f"✅ Embedding model loaded: {model_name} ({elapsed}s, {settings.EMBEDDING_DIM} dims)")

        except Exception as e:
            logger.error(f"❌ Không thể load embedding model: {e}")
            self._is_ready = False

    # ─── Build Embedding Text ───

    def build_embedding_text(self, product_data: dict[str, Any]) -> str:
        """
        Ghép thông tin sản phẩm thành text để encode.

        Bao gồm: name, description, category, material, colors, tags, style.
        Giới hạn description 500 ký tự để tránh quá dài.
        """
        parts = []

        # Product name — quan trọng nhất
        if name := product_data.get("name"):
            parts.append(name)

        # Description — cắt 500 ký tự
        if desc := product_data.get("description"):
            parts.append(desc[:500])

        # Category name
        if category := product_data.get("category_name"):
            parts.append(f"Danh mục: {category}")

        # Material
        if material := product_data.get("material"):
            parts.append(f"Chất liệu: {material}")

        # Colors từ variants
        if colors := product_data.get("colors"):
            unique_colors = list(set(colors))
            parts.append(f"Màu sắc: {', '.join(unique_colors)}")

        # Tags
        if tags := product_data.get("tags"):
            parts.append(f"Tags: {', '.join(tags)}")

        # Brand
        if brand := product_data.get("brand"):
            parts.append(f"Thương hiệu: {brand}")

        return "\n".join(parts)

    # ─── Generate Embedding ───

    def generate_embedding(self, text: str) -> list[float]:
        """
        Encode text thành vector 384 dims.

        Raises:
            RuntimeError: Nếu model chưa được load.
        """
        if not self._is_ready or self._model is None:
            raise RuntimeError("Embedding model chưa được warmup. Gọi warmup() trước.")

        vector = self._model.encode(text, show_progress_bar=False)
        return vector.tolist()

    # ─── Upsert Embedding vào pgvector ───

    async def upsert_embedding(self, product_id: str, embedding: list[float]) -> None:
        """
        INSERT hoặc UPDATE embedding cho 1 sản phẩm vào bảng product_embeddings.

        Sử dụng ON CONFLICT (product_id) DO UPDATE để idempotent.
        """
        vector_str = f"[{','.join(str(x) for x in embedding)}]"

        try:
            async with async_session_maker() as db:
                await db.execute(
                    text("""
                        INSERT INTO product_embeddings (id, product_id, embedding, updated_at)
                        VALUES (gen_random_uuid(), :product_id, :embedding::vector, NOW())
                        ON CONFLICT (product_id)
                        DO UPDATE SET embedding = :embedding::vector, updated_at = NOW()
                    """),
                    {"product_id": product_id, "embedding": vector_str},
                )
                await db.commit()
            logger.debug(f"Upserted embedding cho product {product_id}")

        except Exception as e:
            logger.error(f"Lỗi upsert embedding cho product {product_id}: {e}")

    # ─── Fetch Product Data từ DB ───

    async def fetch_product_data(self, product_id: str) -> dict[str, Any] | None:
        """
        Lấy thông tin sản phẩm cần thiết để build embedding text.

        Query JOIN: products + categories + variants (lấy colors) + tags.
        """
        try:
            async with async_session_maker() as db:
                # Product + Category
                result = await db.execute(
                    text("""
                        SELECT
                            p.id, p.name, p.description, p.material, p.brand,
                            c.name AS category_name
                        FROM products p
                        LEFT JOIN categories c ON c.id = p.category_id
                        WHERE p.id = :pid AND p.is_active = true
                    """),
                    {"pid": product_id},
                )
                row = result.mappings().first()
                if not row:
                    return None

                product_data = dict(row)

                # Colors từ variants
                colors_result = await db.execute(
                    text("""
                        SELECT DISTINCT color FROM product_variants
                        WHERE product_id = :pid AND is_active = true
                    """),
                    {"pid": product_id},
                )
                product_data["colors"] = [r["color"] for r in colors_result.mappings().all()]

                # Tags
                tags_result = await db.execute(
                    text("""
                        SELECT pt.name
                        FROM product_tags pt
                        JOIN product_tag_map ptm ON ptm.tag_id = pt.id
                        WHERE ptm.product_id = :pid
                    """),
                    {"pid": product_id},
                )
                product_data["tags"] = [r["name"] for r in tags_result.mappings().all()]

                return product_data

        except Exception as e:
            logger.error(f"Lỗi fetch product data {product_id}: {e}")
            return None

    # ─── Generate + Upsert cho 1 sản phẩm ───

    async def index_product(self, product_id: str) -> bool:
        """
        Pipeline hoàn chỉnh: fetch data → build text → embed → upsert.

        Returns:
            True nếu thành công, False nếu lỗi.
        """
        product_data = await self.fetch_product_data(product_id)
        if not product_data:
            logger.warning(f"Product {product_id} không tìm thấy hoặc inactive.")
            return False

        embedding_text = self.build_embedding_text(product_data)
        if not embedding_text.strip():
            logger.warning(f"Product {product_id} không có text để embed.")
            return False

        embedding = self.generate_embedding(embedding_text)
        await self.upsert_embedding(product_id, embedding)

        logger.info(f"✅ Indexed product {product_id}: {product_data.get('name', 'N/A')}")
        return True

    # ─── Batch Re-index ───

    async def batch_reindex(self, limit: int = 0) -> dict:
        """
        Re-index toàn bộ (hoặc giới hạn) sản phẩm active.

        Dùng cho Celery nightly job (2:30 AM).

        Returns:
            { "total": N, "success": M, "failed": F, "elapsed_seconds": T }
        """
        start = time.time()
        success = 0
        failed = 0

        try:
            async with async_session_maker() as db:
                limit_clause = f"LIMIT {limit}" if limit > 0 else ""
                result = await db.execute(
                    text(f"""
                        SELECT id FROM products
                        WHERE is_active = true
                        ORDER BY updated_at DESC
                        {limit_clause}
                    """)
                )
                product_ids = [str(row["id"]) for row in result.mappings().all()]

        except Exception as e:
            logger.error(f"Lỗi fetch product IDs cho batch reindex: {e}")
            return {"total": 0, "success": 0, "failed": 0, "elapsed_seconds": 0}

        total = len(product_ids)
        logger.info(f"🔄 Batch reindex: {total} sản phẩm...")

        for pid in product_ids:
            try:
                ok = await self.index_product(pid)
                if ok:
                    success += 1
                else:
                    failed += 1
            except Exception as e:
                logger.error(f"Batch reindex lỗi product {pid}: {e}")
                failed += 1

        elapsed = round(time.time() - start, 1)
        logger.info(f"✅ Batch reindex hoàn tất: {success}/{total} OK, {failed} failed ({elapsed}s)")

        return {
            "total": total,
            "success": success,
            "failed": failed,
            "elapsed_seconds": elapsed,
        }


# Module-level singleton
embedding_service = EmbeddingService()
