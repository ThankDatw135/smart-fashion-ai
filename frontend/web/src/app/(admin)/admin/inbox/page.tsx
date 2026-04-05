"use client";

import { Search, Send, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminInboxPage() {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-heading font-bold tracking-tight">Hỗ Trợ Khách Hàng (Tư vấn trực tiếp)</h1>
        <p className="text-muted-foreground mt-1">
          Hộp thư tiếp nhận tư vấn khi AI chuyển giao quyền.
        </p>
      </div>

      <div className="flex-1 border rounded-3xl bg-card overflow-hidden flex shadow-sm">
         {/* Sidebar List */}
         <div className="w-1/3 border-r flex flex-col bg-muted/20">
            <div className="p-4 border-b">
               <div className="relative">
                 <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                 <Input placeholder="Tìm kiếm cuộc trò chuyện..." className="pl-9 bg-background" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto">
               <div className="p-4 border-b bg-background border-primary/20 cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                     <span className="font-semibold text-sm">Trần Văn C</span>
                     <span className="text-xs text-muted-foreground">10:30 AM</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Anh ơi cho em hỏi cái form áo này...</p>
               </div>
               <div className="p-4 border-b hover:bg-background cursor-pointer transition-colors">
                  <div className="flex justify-between items-center mb-1">
                     <span className="font-semibold text-sm">Lê K</span>
                     <span className="text-xs text-muted-foreground">Hôm qua</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Em muốn trả hàng vì hẹp vai</p>
               </div>
            </div>
         </div>

         {/* Chat Area */}
         <div className="w-2/3 flex flex-col bg-background">
            <div className="p-4 border-b flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                 <User className="w-5 h-5 text-primary" />
               </div>
               <div>
                  <h3 className="font-semibold text-sm">Trần Văn C</h3>
                  <p className="text-xs text-emerald-500">Đang trực tuyến</p>
               </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="max-w-[70%] bg-muted/50 rounded-2xl rounded-tl-sm p-3 text-sm">
                   Chào shop, mình muốn hỏi size áo sơ mi nam, mình cao 1m75 nặng 70kg! AI Bot bảo gặp nhân viên cho chắc ạ.
                </div>
                <div className="max-w-[70%] ml-auto bg-primary text-primary-foreground rounded-2xl rounded-tr-sm p-3 text-sm">
                   Dạ vâng chào anh C, với form 1m75 - 70kg anh lấy size L là vừa người, nếu thích mặc rộng thoải mái anh lấy XL nhé.
                </div>
            </div>
            <div className="p-4 border-t flex gap-2">
               <Input placeholder="Nhập tin nhắn hỗ trợ..." className="flex-1" />
               <Button size="icon" className="shrink-0"><Send className="w-4 h-4" /></Button>
            </div>
         </div>
      </div>
    </div>
  );
}
