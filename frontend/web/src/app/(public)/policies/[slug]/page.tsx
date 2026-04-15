import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Chính sách & Quy định | Antigravity Store",
  description: "Các chính sách, quy định đổi trả, bảo mật thông tin và điều khoản sử dụng của Antigravity Store.",
};

import { getStaticContent } from "@/lib/content";

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
  const policyData = getStaticContent().policies || {};
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
