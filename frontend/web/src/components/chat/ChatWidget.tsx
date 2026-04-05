"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatBubble } from "./ChatBubble";
import { ChatWindow } from "./ChatWindow";
import { Message } from "./ChatMessage";
import { MOCK_PRODUCTS } from "@/mocks/products.mock";

// Mocking useChat since Vercel AI SDK isn't fully integrated yet
function useMockChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      role: "assistant",
      content: "Xin chào! 👋 Mình là AI Stylist của Smart Fashion.\nBạn đang tìm phong cách trang phục thế nào hôm nay?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Mock bot reply
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Dưới đây là một số gợi ý trang phục cực chuẩn cho bạn nhé!",
        data: {
           products: MOCK_PRODUCTS.slice(0, 3).map(p => ({
             id: p.id,
             name: p.name,
             price: p.price,
             originalPrice: p.originalPrice,
             image: p.thumbnail || p.images?.[0] || "/images/placeholder.svg",
             slug: p.slug
           }))
        }
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const clearChat = () => {
    setMessages([{
      id: "msg-new",
      role: "assistant",
      content: "Đã xoá lịch sử trò chuyện. Mình có thể giúp gì thêm cho bạn?"
    }]);
  };

  return { messages, input, handleInputChange, handleSubmit, isLoading, clearChat };
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const chatState = useMockChat();

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            onClose={() => setIsOpen(false)}
            messages={chatState.messages}
            input={chatState.input}
            handleInputChange={chatState.handleInputChange}
            handleSubmit={chatState.handleSubmit}
            isLoading={chatState.isLoading}
            clearChat={chatState.clearChat}
          />
        )}
      </AnimatePresence>

      <ChatBubble isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} hasUnread={chatState.messages.length <= 1} />
    </div>
  );
}
