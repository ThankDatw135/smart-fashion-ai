import { Category } from "@/types/product";

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat_clothes", name: "Quần Áo Nam", slug: "nam", image: "/images/cats/nam.jpg", parentId: null },
  { id: "cat_clothes_nu", name: "Quần Áo Nữ", slug: "nu", image: "/images/cats/nu.jpg", parentId: null },
  { id: "cat_phukien", name: "Phụ Kiện", slug: "phu-kien", image: "/images/cats/phukien.jpg", parentId: null },
  { id: "cat_aothun", name: "Áo Thun", slug: "ao-thun", parentId: "cat_clothes" },
  { id: "cat_quanjean", name: "Quần Jean", slug: "quan-jean", parentId: "cat_clothes" },
  { id: "cat_aokhoac", name: "Áo Khoác", slug: "ao-khoac", parentId: "cat_clothes" },
  { id: "cat_dam", name: "Váy Đầm", slug: "vay-dam", parentId: "cat_clothes_nu" },
];
