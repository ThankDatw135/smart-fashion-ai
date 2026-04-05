import { Review } from "@/types/review";

export const MOCK_REVIEWS: Review[] = [
  {
    id: "rev_001",
    userId: "usr_002",
    productId: "prod_1",
    orderId: "ord_101",
    author: {
      id: "usr_002",
      name: "Trần Bình C",
      avatar: "https://i.pravatar.cc/150?u=binh",
    },
    rating: 5,
    content: "Áo rất mát, form rộng mặc thoải mái. Shop giao hàng nhanh.",
    images: ["/images/reviews/rev-1.jpg"],
    likes: 12,
    isPurchased: true,
    status: "APPROVED",
    adminResponse: {
      content: "Cảm ơn bạn đã tin tưởng Smart Fashion AI ạ! Rất mong được tiếp tục phục vụ bạn.",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "rev_002",
    userId: "usr_003",
    productId: "prod_1", // Same product to test list
    orderId: "ord_102",
    author: {
      id: "usr_003",
      name: "Nguyễn Lê D",
    },
    rating: 4,
    content: "Màu áo ở ngoài hơi khác ảnh một chút, nhưng chất lượng vẫn ok.",
    images: [],
    likes: 2,
    isPurchased: true,
    status: "APPROVED",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
