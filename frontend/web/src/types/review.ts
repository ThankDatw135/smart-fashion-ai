export interface ReviewAuthor {
  id: string;
  name: string;
  avatar?: string;
}

export interface ReviewResponse {
  content: string;
  createdAt: string;
  userId?: string; // Admin User ID who replied
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  author: ReviewAuthor;
  rating: number; // 1-5
  content: string;
  images: string[];
  likes: number;
  isPurchased: boolean; // Verified buyer
  status: "PENDING" | "APPROVED" | "HIDDEN";
  adminResponse?: ReviewResponse;
  createdAt: string;
  updatedAt: string;
}
