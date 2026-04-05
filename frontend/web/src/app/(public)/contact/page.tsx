"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactInfo = [
    { icon: MapPin, title: "Trụ sở chính", detail: "123 Cầu Giấy, Hà Nội, Việt Nam" },
    { icon: Phone, title: "Hotline CSKH", detail: "1900 1234 (8:00 - 22:00)" },
    { icon: Mail, title: "Email hỗ trợ", detail: "support@antigravity.store" },
    { icon: Clock, title: "Giờ làm việc", detail: "T2 - CN: 8:00 am - 10:00 pm" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData.entries());

      // Validate required fields
      if (!data.fullName || !data.email || !data.message) {
        toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
        return;
      }

      // TODO: Gửi tới backend khi API được hoàn thiện (VD: await api.post("/contact", data);)
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate fake network request

      toast.success("Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất có thể.");
      e.currentTarget.reset();
    } catch {
      toast.error("Gửi không thành công. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-16 lg:py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Liên hệ với chúng tôi</h1>
        <p className="text-lg text-muted-foreground">
          Bạn có thắc mắc về đơn hàng, sản phẩm hay chương trình khuyến mãi? Hãy để lại lời nhắn, đội ngũ tư vấn sẽ hỗ trợ bạn sớm nhất.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
        {/* Contact Info */}
        <div className="space-y-10">
          <h2 className="text-2xl font-bold font-heading">Thông tin liên lạc trực tiếp</h2>
          
          <div className="flex flex-col gap-8">
            {contactInfo.map((info, idx) => {
              const Icon = info.icon;
              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{info.title}</h3>
                    <p className="text-muted-foreground">{info.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-muted/50 p-6 rounded-2xl border">
            <h3 className="font-bold mb-2">Hợp tác kinh doanh (B2B)</h3>
            <p className="text-sm text-muted-foreground mb-4">Nếu bạn muốn trở thành đại lý hoặc hợp tác phát triển thương hiệu.</p>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = "mailto:partner@antigravity.store"}
            >
              partner@antigravity.store
            </Button>
          </div>
        </div>

        {/* Contact Form — H4 fix: functional form with onSubmit, validation, state */}
        <div className="bg-background border rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold font-heading mb-6">Gửi tin nhắn trực tuyến</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="contact-fullname" className="text-sm font-medium">Họ và tên *</label>
                <Input id="contact-fullname" name="fullName" placeholder="Nguyễn Văn A" className="h-11" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-phone" className="text-sm font-medium">Số điện thoại</label>
                <Input id="contact-phone" name="phone" placeholder="0912345678" className="h-11" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="contact-email" className="text-sm font-medium">Email liên hệ *</label>
              <Input id="contact-email" name="email" type="email" placeholder="example@email.com" className="h-11" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="contact-subject" className="text-sm font-medium">Chủ đề cần hỗ trợ</label>
              <Input id="contact-subject" name="subject" placeholder="VD: Hỏi về đơn hàng #1234" className="h-11" />
            </div>

            <div className="space-y-2">
              <label htmlFor="contact-message" className="text-sm font-medium">Nội dung chi tiết *</label>
              <Textarea id="contact-message" name="message" placeholder="Viết nội dung phản hồi của bạn tại đây..." className="min-h-[120px] resize-none" required />
            </div>

            <Button type="submit" size="lg" className="w-full mt-4 h-12 text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi yêu cầu hỗ trợ"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Bằng việc gửi phản hồi, bạn đồng ý với Chính sách bảo mật thông tin của chúng tôi.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
