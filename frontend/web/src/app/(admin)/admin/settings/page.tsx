"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Cài đặt Cửa hàng</h1>
        <p className="text-muted-foreground mt-1">
          Thiết lập thông tin cơ bản liên hệ, SEO, và quy định vận chuyển.
        </p>
      </div>

      <div className="space-y-8">
         <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
           <h3 className="text-lg font-semibold border-b pb-2">Thông tin chung</h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2 col-span-2">
               <label className="text-sm font-medium">Tên Cửa Hàng</label>
               <Input defaultValue="Smart Fashion AI" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Email liên hệ</label>
               <Input defaultValue="contact@smartfashion.vn" type="email" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Số điện thoại Hotline</label>
               <Input defaultValue="1900 1234" />
             </div>
             <div className="space-y-2 col-span-2">
               <label className="text-sm font-medium">Điạ chỉ trụ sở</label>
               <Input defaultValue="123 Nguyễn Văn Linh, Quận 7, TP.HCM" />
             </div>
           </div>
         </div>

         <div className="p-6 rounded-3xl border bg-card shadow-sm space-y-4">
           <h3 className="text-lg font-semibold border-b pb-2">Cấu hình Vận chuyển</h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Phí ship Mặc định (Nội thành)</label>
               <Input defaultValue="25000" type="number" />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Phí ship Ngoại thành</label>
               <Input defaultValue="35000" type="number" />
             </div>
             <div className="space-y-2 col-span-2">
               <label className="text-sm font-medium">Ngưỡng Freeship (VNĐ)</label>
               <Input defaultValue="500000" type="number" />
               <p className="text-xs text-muted-foreground">Đơn hàng đạt ngưỡng này sẽ được miễn phí vận chuyển.</p>
             </div>
           </div>
         </div>

         <div className="flex justify-end gap-3">
            <Button>Lưu Thiết Lập</Button>
         </div>
      </div>
    </div>
  );
}
