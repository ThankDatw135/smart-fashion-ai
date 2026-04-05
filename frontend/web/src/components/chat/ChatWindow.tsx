"use client";

import { motion } from "framer-motion";
import { X, Bot, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage, Message } from "./ChatMessage";

interface ChatWindowProps {
  onClose: () => void;
  // Giả lập state thay cho useChat của Vercel AI SDK
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  clearChat?: () => void;
}

export function ChatWindow({ 
  onClose, 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading,
  clearChat
}: ChatWindowProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="absolute bottom-20 right-0 w-[340px] sm:w-[380px] bg-card rounded-2xl shadow-2xl border overflow-hidden flex flex-col h-[500px]"
    >
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">AI Stylist</p>
            <p className="text-xs opacity-80 mt-0.5" suppressHydrationWarning>Luôn sẵn sàng tư vấn</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {clearChat && (
             <Button
             variant="ghost"
             size="icon"
             className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
             onClick={clearChat}
             title="Xoá lịch sử hội thoại"
           >
             <Trash2 className="h-4 w-4" />
           </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex gap-2 w-full">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div className="bg-card border rounded-2xl rounded-tl-sm p-3.5 shadow-sm max-w-[85%] flex items-center gap-1.5 h-[42px]">
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
              <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick Replies (Optional) */}
      {messages.length === 1 && (
        <div className="flex overflow-x-auto gap-2 p-3 bg-muted/30 pt-0 snap-x hide-scrollbar">
          {["Gợi ý outfit đi làm", "Tìm áo theo phong cách", "Sale hôm nay"].map((text) => (
            <button
              key={text}
              className="snap-start shrink-0 px-3 py-1.5 rounded-full border bg-background text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
               onClick={() => {
                const fakeEvent = {
                  target: { value: text },
                  currentTarget: { value: text }
                } as any;
                handleInputChange(fakeEvent);
              }}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2 bg-card shrink-0">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Hỏi AI Stylist về thời trang..."
          className="rounded-full bg-muted/50 text-sm h-10 px-4 focus-visible:ring-1"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          size="icon" 
          className="rounded-full shrink-0 h-10 w-10 shadow-sm"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4 ml-0.5" />
        </Button>
      </form>
    </motion.div>
  );
}
