import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Chính sách & Quy định | Antigravity Store",
  description: "Các chính sách, quy định đổi trả, bảo mật thông tin và điều khoản sử dụng của Antigravity Store.",
};

const policyData: Record<string, { title: string; content: string; lastUpdated: string }> = {
  "privacy": {
    title: "Chính sách Bảo mật Thông tin",
    lastUpdated: "Cập nhật: 01/01/2026",
    content: `
      <h2>1. Mục đích thu thập dữ liệu</h2>
      <p>Antigravity thu thập thông tin cá nhân của bạn (như tên, email, số điện thoại, và lịch sử mua hàng) nhằm mục đích cải thiện trải nghiệm mua sắm, đề xuất sản phẩm phù hợp qua AI Stylist, và xử lý đơn hàng.</p>
      
      <h2>2. Chia sẻ thông tin với bên thứ 3</h2>
      <p>Chúng tôi cam kết <strong>KHÔNG</strong> bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại, ngoại trừ các đơn vị vận chuyển đối tác để giao hàng hoặc cổng thanh toán an toàn.</p>

      <h2>3. Bảo mật thanh toán</h2>
      <p>Mọi giao dịch thanh toán trực tuyến tại Antigravity Store đều được mã hóa bảo mật SSL/TLS theo chuẩn quốc tế (PCI-DSS).</p>
      
      <h2>4. Quyền của khách hàng</h2>
      <p>Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân bất kỳ lúc nào bằng cách truy cập mục "Cài đặt tài khoản" hoặc gửi email về support@antigravity.store.</p>
    `
  },
  "return": {
    title: "Chính sách Đổi trả và Hoàn tiền",
    lastUpdated: "Cập nhật: 15/02/2026",
    content: `
      <h2>1. Thời gian áp dụng</h2>
      <p>Bạn có thể yêu cầu đổi/trả sản phẩm trong vòng <strong>30 ngày</strong> kể từ ngày nhận hàng (ngày trên hệ thống đơn vị vận chuyển).</p>
      
      <h2>2. Điều kiện đổi trả</h2>
      <ul>
        <li>Sản phẩm còn nguyên vẹn, thẻ mác, hộp đựng.</li>
        <li>Sản phẩm chưa qua giặt ủi, không ám mùi mồ hôi, nước hoa hoặc hóa chất lạ.</li>
        <li>Hàng Sale (Flash Sale, xả kho) không hỗ trợ hoàn tiền mà chỉ đổi size nếu có sẵn.</li>
      </ul>

      <h2>3. Quy trình thực hiện</h2>
      <p>Bước 1: Truy cập mục "Đơn hàng của tôi", chọn đơn cần hoàn/trả.<br/>Bước 2: Điền lý do và cung cấp hình ảnh minh chứng.<br/>Bước 3: Gửi lại hàng cho chúng tôi theo mã vận đơn được cung cấp.</p>
    `
  },
  "shipping": {
    title: "Chính sách Vận chuyển",
    lastUpdated: "Cập nhật: 01/03/2026",
    content: `
      <h2>1. Thời gian giao hàng</h2>
      <p>Đơn hàng sẽ được xử lý và giao đến tay bạn trong vòng <strong>2–5 ngày làm việc</strong> tùy thuộc vào khu vực.</p>
      <ul>
        <li><strong>Nội thành HN / HCM:</strong> 1–2 ngày làm việc.</li>
        <li><strong>Tỉnh thành khác:</strong> 3–5 ngày làm việc.</li>
        <li><strong>Vùng sâu, vùng xa:</strong> 5–7 ngày làm việc.</li>
      </ul>

      <h2>2. Phí vận chuyển</h2>
      <ul>
        <li>Nội thành Hà Nội &amp; TP.HCM: <strong>25.000đ</strong></li>
        <li>Tỉnh thành gần: <strong>35.000đ</strong></li>
        <li>Tỉnh thành xa / vùng sâu: <strong>50.000đ</strong></li>
      </ul>
      <p>Miễn phí vận chuyển cho đơn hàng từ <strong>500.000đ</strong> trở lên.</p>

      <h2>3. Theo dõi đơn hàng</h2>
      <p>Sau khi đơn hàng được giao cho đơn vị vận chuyển, bạn sẽ nhận được SMS và email kèm mã vận đơn để theo dõi trạng thái giao hàng.</p>
    `
  },
  "terms": {
    title: "Điều khoản và Dịch vụ Sử dụng",
    lastUpdated: "Cập nhật: 10/10/2025",
    content: `
      <h2>1. Chấp nhận điều khoản</h2>
      <p>Việc bạn truy cập và sử dụng website Antigravity Store đồng nghĩa với việc bạn đọc, hiểu và đồng ý tuân thủ toàn bộ các điều khoản được quy định tại đây.</p>
      
      <h2>2. Quyền sở hữu trí tuệ</h2>
      <p>Toàn bộ nội dung, hình ảnh thiết kế, logo và ý tưởng (bao gồm cả thuật toán gợi ý AI) thuộc bản quyền của Antigravity. Nghiêm cấm sao chép, phân phối khi chưa được sự cho phép bằng văn bản.</p>

      <h2>3. Thay đổi điều khoản</h2>
      <p>Chúng tôi có quyền bổ sung hoặc điều chỉnh điều khoản vào bất kỳ lúc nào mà không cần báo trước. Tuy nhiên, mọi thay đổi lớn sẽ được thông báo qua website hoặc email cho khách hàng thành viên.</p>
    `
  }
};

// Alias map: footer slugs → policyData keys
const slugAliasMap: Record<string, string> = {
  "doi-tra": "return",
  "van-chuyen": "shipping",
  "bao-mat": "privacy",
  "dieu-khoan": "terms",
};

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Resolve alias if needed (e.g. "doi-tra" → "return")
  const resolvedSlug = slugAliasMap[slug] ?? slug;
  const policy = policyData[resolvedSlug];

  if (!policy) {
    notFound();
  }

  return (
    <div className="bg-muted/10 min-h-[calc(100vh-80px)] py-12">
      <div className="container max-w-4xl">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-8 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại trang chủ
          </Button>
        </Link>
        
        <div className="bg-background rounded-3xl p-8 md:p-12 shadow-sm border relative overflow-hidden">
          <ShieldCheck className="absolute top-10 right-10 w-40 h-40 text-primary/5 -z-10" />
          
          <header className="mb-12 border-b pb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">{policy.title}</h1>
            <p className="text-muted-foreground text-sm font-medium">{policy.lastUpdated}</p>
          </header>

          <div 
            className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-heading prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-p:leading-relaxed prose-li:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />

          <div className="mt-16 bg-primary/5 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/20">
            <div>
              <h3 className="font-semibold mb-1">Cần hỗ trợ thêm về chính sách?</h3>
              <p className="text-sm text-muted-foreground">Đội ngũ luật sư và chăm sóc khách hàng của chúng tôi luôn sẵn sàng giải đáp.</p>
            </div>
            <Link href="/contact">
              <Button>Liên hệ CSKH</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
