import { USE_MOCK } from "./api";

// Chatbot sử dụng Vercel AI SDK (useChat) — chỉ cần endpoint URL
// Service này cung cấp các hàm phụ trợ ngoài streaming chính

export const CHAT_API_URL = USE_MOCK
  ? "/api/chat/mock"
  : (process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000") + "/api/v1/chat";

export const ChatAPI = {
  // Lấy lịch sử chat (nếu user đã đăng nhập)
  getChatHistory: async (): Promise<any[]> => {
    if (USE_MOCK) {
      return new Promise((resolve) =>
        setTimeout(() => resolve([
          { role: "assistant", content: "Xin chào! Tôi là Smart Fashion AI. Bạn cần tìm gì hôm nay?" },
        ]), 300)
      );
    }
    // TODO: Gọi API thật khi có Backend
    return [];
  },
};
