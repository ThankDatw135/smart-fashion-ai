import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnread?: boolean;
}

export function ChatBubble({ isOpen, onClick, hasUnread = true }: ChatBubbleProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
        isOpen ? "scale-100 bg-muted-foreground/90" : "hover:scale-110 active:scale-95"
      )}
    >
      <div className="relative">
        <div className={cn("transition-transform duration-300 absolute inset-0 flex items-center justify-center", isOpen ? "rotate-90 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100")}>
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className={cn("transition-transform duration-300 flex items-center justify-center", isOpen ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-50")}>
          <X className="h-6 w-6" />
        </div>
      </div>

      {/* Notification dot */}
      {!isOpen && hasUnread && (
        <div className="absolute top-0 right-0 w-4 h-4 bg-destructive border-2 border-background rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
          1
        </div>
      )}

      {/* Tooltip */}
      {!isOpen && (
        <div className="absolute right-full mr-4 bg-foreground text-background px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-x-1 whitespace-nowrap pointer-events-none text-xs font-medium">
          Trò chuyện với AI Stylist
          {/* Arrow */}
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-foreground rotate-45 rounded-sm" />
        </div>
      )}
    </button>
  );
}
