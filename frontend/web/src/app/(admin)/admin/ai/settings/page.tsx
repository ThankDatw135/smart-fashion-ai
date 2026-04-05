"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminAISettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Cấu hình Hệ thống AI</h1>
        <p className="text-muted-foreground mt-1">
           Tinh chỉnh luồng xử lý và tham số của Fast API AI Service (Qdrant & Gemini).
        </p>
      </div>

      <div className="space-y-8">
         <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
           <h3 className="text-lg font-semibold border-b pb-2">Ngôn ngữ mô hình (LLM Config)</h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2 col-span-2">
               <label className="text-sm font-medium">System Prompt (Tính cách Nhâm viên tư vấn)</label>
               <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background text-sm text-foreground"
                  defaultValue="Bạn là một chuyên gia tư vấn thời trang AI của thương hiệu Smart Fashion AI. Bạn ăn nói lịch sự, chuyên nghiệp, luôn hỗ trợ khách hàng tìm đúng kích cỡ và gợi ý phối đồ hợp xu hướng."
               />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Temperature (0.0 - 1.0)</label>
               <Input defaultValue="0.7" type="number" step="0.1" />
               <p className="text-xs text-muted-foreground">0.7: Sáng tạo nhưng vẫn dựa trên sự thật.</p>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Giới hạn Context Token</label>
               <Input defaultValue="8192" type="number" />
             </div>
           </div>
         </div>

         <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
           <h3 className="text-lg font-semibold border-b pb-2">Vector Search (Qdrant Database)</h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Mức độ tương đồng tối thiểu (Similarity Score)</label>
               <Input defaultValue="0.75" type="number" step="0.05" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Số lượng sản phẩm trả về tối đa (Top-K)</label>
               <Input defaultValue="5" type="number" />
             </div>
           </div>
         </div>

         <div className="flex justify-end gap-3">
            <Button>Đồng bộ cấu hình sang AI Service</Button>
         </div>
      </div>
    </div>
  );
}
