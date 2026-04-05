import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductSuggestion } from "./ProductSuggestion";

// Mock AI SDK Message type
export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  data?: any; // Used to pass product suggestions or tool calls
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === "assistant" || message.role === "system";

  return (
    <div className={cn("flex gap-2 w-full", isBot ? "flex-row" : "flex-row-reverse")}>
      <div 
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1",
          isBot ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      
      <div className={cn("flex flex-col gap-1", isBot ? "items-start" : "items-end", "max-w-[85%]")}>
        <div 
          className={cn(
            "rounded-2xl p-3 text-sm shadow-sm",
            isBot 
              ? "bg-card border rounded-tl-sm text-card-foreground" 
              : "bg-primary text-primary-foreground rounded-tr-sm"
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {/* Cấu trúc mock: bot có thể trả về thông tin sản phẩm trong thuộc tính data */}
        {isBot && message.data?.products && (
          <div className="flex gap-2 overflow-x-auto pb-2 w-full snap-x">
            {message.data.products.map((product: any) => (
              <div className="snap-start" key={product.id}>
                 <ProductSuggestion product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
