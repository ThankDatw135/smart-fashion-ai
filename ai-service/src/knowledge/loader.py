"""
Knowledge Base Loader — Singleton.

Load 6 files JSON kiến thức thời trang khi startup,
cache trong bộ nhớ để truy xuất nhanh (O(1)).

Các hàm tiện ích:
- get_fashion_styles(): Lấy danh sách phong cách
- get_size_guide(height, weight, gender): Gợi ý size
- get_skin_tone_advice(skin_tone): Gợi ý màu theo da
- get_style_combos(occasion): Gợi ý outfit theo dịp
- get_faq(topic): Trả lời FAQ
- get_synonyms(query): Mở rộng từ khóa tìm kiếm
"""

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Thư mục chứa các file JSON knowledge
_KNOWLEDGE_DIR = Path(__file__).parent

# Ánh xạ tên file → attribute name
_KNOWLEDGE_FILES = {
    "fashion_knowledge": "fashion_knowledge.json",
    "size_guides": "size_guides.json",
    "skin_tone_guide": "skin_tone_guide.json",
    "style_combinations": "style_combinations.json",
    "faq": "faq.json",
    "product_vocabulary": "product_vocabulary.json",
}


class KnowledgeBase:
    """
    Singleton quản lý toàn bộ knowledge base.

    Gọi load_all() 1 lần khi startup, sau đó truy xuất qua
    các phương thức tiện ích.
    """

    _instance: "KnowledgeBase | None" = None
    _loaded: bool = False

    def __new__(cls) -> "KnowledgeBase":
        """Đảm bảo chỉ có 1 instance duy nhất (Singleton)."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Khởi tạo dict rỗng cho mỗi knowledge file
        if not hasattr(self, "_data"):
            self._data: dict[str, Any] = {}

    def load_all(self):
        """
        Load toàn bộ 6 files JSON vào bộ nhớ.

        Gọi 1 lần khi startup. Nếu file nào bị thiếu,
        log warning nhưng không crash — service vẫn hoạt động.
        """
        loaded_count = 0
        for key, filename in _KNOWLEDGE_FILES.items():
            filepath = _KNOWLEDGE_DIR / filename
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    self._data[key] = json.load(f)
                loaded_count += 1
                logger.info(f"✅ Đã load knowledge: {filename}")
            except FileNotFoundError:
                logger.warning(f"⚠️ Không tìm thấy file knowledge: {filepath}")
                self._data[key] = {}
            except json.JSONDecodeError as e:
                logger.error(f"❌ Lỗi parse JSON file {filename}: {e}")
                self._data[key] = {}

        self._loaded = True
        logger.info(f"Knowledge Base đã load: {loaded_count}/{len(_KNOWLEDGE_FILES)} files.")

    @property
    def is_loaded(self) -> bool:
        """Kiểm tra đã load knowledge chưa."""
        return self._loaded

    @property
    def loaded_files_count(self) -> int:
        """Số lượng files đã load thành công."""
        return sum(1 for v in self._data.values() if v)

    # ─── Phong cách thời trang ───

    def get_fashion_styles(self) -> dict:
        """Lấy toàn bộ phong cách thời trang (streetwear, minimalist, office...)."""
        return self._data.get("fashion_knowledge", {}).get("styles", {})

    def get_occasions(self) -> dict:
        """Lấy danh sách dịp (date, party, office, travel, sport)."""
        return self._data.get("fashion_knowledge", {}).get("occasions", {})

    def get_season_tips(self) -> dict:
        """Lấy tips theo mùa (hè, đông, mưa)."""
        return self._data.get("fashion_knowledge", {}).get("season_tips", {})

    # ─── Gợi ý size ───

    def get_size_guide(self, height: int, weight: int, gender: str = "male") -> dict:
        """
        Gợi ý size dựa trên chiều cao (cm) và cân nặng (kg).

        Trả về: {
            "recommended_size": "L",
            "description": "Dáng vừa phải, cân đối",
            "tips": [...],
            "fit_preference": {...}
        }
        """
        guides = self._data.get("size_guides", {})
        gender_data = guides.get(gender, guides.get("male", {}))
        sizes = gender_data.get("sizes", {})

        recommended = None
        for size_name, size_info in sizes.items():
            h_range = size_info.get("height_range", [0, 0])
            w_range = size_info.get("weight_range", [0, 0])

            # Kiểm tra xem height và weight có nằm trong khoảng không
            if h_range[0] <= height <= h_range[1] and w_range[0] <= weight <= w_range[1]:
                recommended = {
                    "recommended_size": size_name,
                    "description": size_info.get("description", ""),
                    "details": size_info,
                }
                break

        # Nếu không tìm thấy chính xác, chọn size gần nhất dựa trên cân nặng
        if not recommended and sizes:
            closest_size = None
            min_diff = float("inf")
            for size_name, size_info in sizes.items():
                w_range = size_info.get("weight_range", [0, 0])
                mid_weight = (w_range[0] + w_range[1]) / 2
                diff = abs(weight - mid_weight)
                if diff < min_diff:
                    min_diff = diff
                    closest_size = {
                        "recommended_size": size_name,
                        "description": size_info.get("description", ""),
                        "details": size_info,
                        "note": "Size gợi ý gần nhất, có thể chưa chính xác 100%.",
                    }
            recommended = closest_size

        # Thêm tips chung
        tips = guides.get("tips", {})
        if recommended:
            recommended["tips"] = tips.get("general", [])
            recommended["fit_preference"] = tips.get("fit_preference", {})

        return recommended or {"error": "Không thể xác định size. Vui lòng liên hệ shop."}

    # ─── Tư vấn màu da ───

    def get_skin_tone_advice(self, skin_tone: str) -> dict:
        """
        Tư vấn màu phù hợp theo tông da.

        skin_tone: "fair" | "light_yellow" | "tan" | "dark"
        Hoặc tiếng Việt: "trắng" | "vàng" | "ngăm" | "ngăm đen"
        """
        guide = self._data.get("skin_tone_guide", {})
        skin_tones = guide.get("skin_tones", {})

        # Ánh xạ tên tiếng Việt → key
        vn_mapping = {
            "trắng": "fair",
            "da trắng": "fair",
            "sáng": "fair",
            "vàng": "light_yellow",
            "da vàng": "light_yellow",
            "vàng sáng": "light_yellow",
            "ngăm": "tan",
            "da ngăm": "tan",
            "nâu": "tan",
            "ngăm đen": "dark",
            "da đen": "dark",
            "đen": "dark",
        }

        key = vn_mapping.get(skin_tone.lower().strip(), skin_tone.lower().strip())
        result = skin_tones.get(key, {})

        if not result:
            return {"error": f"Không tìm thấy thông tin cho tông da '{skin_tone}'. Hỗ trợ: trắng, vàng, ngăm, ngăm đen."}

        # Thêm quy tắc phối màu chung
        result["color_harmony_rules"] = guide.get("color_harmony_rules", {})
        return result

    # ─── Gợi ý outfit ───

    def get_style_combos(self, occasion: str | None = None, gender: str | None = None) -> list[dict]:
        """
        Lấy danh sách outfit combinations, có thể lọc theo occasion và gender.
        """
        combos_data = self._data.get("style_combinations", {})
        combos = combos_data.get("combinations", [])

        results = combos
        if occasion:
            results = [c for c in results if occasion.lower() in [o.lower() for o in c.get("occasion", [])]]
        if gender:
            results = [c for c in results if c.get("gender", "unisex") in [gender, "unisex"]]

        return results

    def get_layering_rules(self) -> dict:
        """Lấy quy tắc phối lớp quần áo."""
        return self._data.get("style_combinations", {}).get("layering_rules", {})

    # ─── FAQ ───

    def get_faq(self, topic: str | None = None) -> list[dict]:
        """
        Tìm FAQ theo topic hoặc keyword.

        topic: "shipping", "payment", "return_policy", "vip", "warranty", "account"
        Hoặc từ khóa bất kỳ để tìm kiếm.
        """
        faq_data = self._data.get("faq", {})
        categories = faq_data.get("categories", {})

        # Tìm theo category trực tiếp
        if topic and topic.lower() in categories:
            return categories[topic.lower()]["questions"]

        # Tìm theo keyword trong tất cả categories
        if topic:
            results = []
            topic_lower = topic.lower()
            for cat_data in categories.values():
                for q in cat_data.get("questions", []):
                    keywords = q.get("keywords", [])
                    if any(topic_lower in kw.lower() for kw in keywords) or topic_lower in q["q"].lower():
                        results.append(q)
            return results

        # Không có topic → trả về tất cả FAQ
        all_faqs = []
        for cat_data in categories.values():
            all_faqs.extend(cat_data.get("questions", []))
        return all_faqs

    # ─── Từ đồng nghĩa & Mở rộng query ───

    def get_synonyms(self, query: str) -> list[str]:
        """
        Mở rộng query bằng từ đồng nghĩa.

        Ví dụ: "áo phông" → ["áo thun", "t-shirt", "tshirt", "tee"]
        """
        vocab = self._data.get("product_vocabulary", {})
        synonyms_map = vocab.get("synonyms", {})

        results = set()
        query_lower = query.lower().strip()

        # Tìm trong keys
        for main_word, aliases in synonyms_map.items():
            all_forms = [main_word.lower()] + [a.lower() for a in aliases]
            if query_lower in all_forms:
                results.update(all_forms)

        # Xóa chính query ra khỏi kết quả
        results.discard(query_lower)
        return list(results)

    def correct_typo(self, text: str) -> str:
        """Sửa lỗi chính tả phổ biến trong query."""
        vocab = self._data.get("product_vocabulary", {})
        corrections = vocab.get("typo_corrections", {})

        corrected = text.lower().strip()
        for wrong, right in corrections.items():
            corrected = corrected.replace(wrong, right)
        return corrected

    def map_style_keyword(self, keyword: str) -> str | None:
        """Ánh xạ từ khóa style tiếng Việt → tên style chuẩn."""
        vocab = self._data.get("product_vocabulary", {})
        mapping = vocab.get("style_keywords", {})
        return mapping.get(keyword.lower().strip())

    def get_size_alias(self, text: str) -> str | None:
        """Ánh xạ mô tả size tiếng Việt → ký hiệu size chuẩn."""
        vocab = self._data.get("product_vocabulary", {})
        aliases = vocab.get("size_aliases", {})
        return aliases.get(text.lower().strip())

    # ─── Tiện ích để truyền knowledge context cho LLM ───

    def get_context_summary(self) -> str:
        """
        Tạo bản tóm tắt knowledge để đưa vào LLM context.

        Dùng trong system prompt hoặc khi cần cung cấp
        thông tin nền cho chatbot.
        """
        styles = list(self.get_fashion_styles().keys())
        occasions = list(self.get_occasions().keys())

        return (
            f"Knowledge Base có sẵn:\n"
            f"- {len(styles)} phong cách thời trang: {', '.join(styles)}\n"
            f"- {len(occasions)} dịp: {', '.join(occasions)}\n"
            f"- Bảng size nam/nữ theo chiều cao + cân nặng\n"
            f"- Tư vấn màu theo 4 loại da VN (trắng, vàng, ngăm, ngăm đen)\n"
            f"- 10 outfit combinations phổ biến\n"
            f"- FAQ chính sách shop (ship, thanh toán, đổi trả, VIP)\n"
            f"- Từ điển đồng nghĩa thời trang VN\n"
        )


# ─── Module-level singleton ───
knowledge_base = KnowledgeBase()
