import fs from 'fs';
import path from 'path';

const basePath = 'e:/website_ban_quan_ao+AI/smart-fashion-ai/frontend/web/src/app/(admin)/admin';

const pages = [
  { path: 'products', title: 'Sản phẩm' },
  { path: 'products/new', title: 'Thêm Sản phẩm mới' },
  { path: 'products/[id]/edit', title: 'Sửa Sản phẩm', isClient: true },
  { path: 'categories', title: 'Danh mục' },
  { path: 'categories/new', title: 'Thêm Danh mục mới' },
  { path: 'orders', title: 'Đơn hàng' },
  { path: 'orders/[id]', title: 'Chi tiết Đơn hàng', isClient: true },
  { path: 'returns', title: 'Đổi trả' },
  { path: 'users', title: 'Khách hàng' },
  { path: 'users/new', title: 'Thêm Khách hàng mới' },
  { path: 'vouchers', title: 'Vouchers' },
  { path: 'blog', title: 'Bài viết (Blog)' },
  { path: 'banners', title: 'Banners' },
  { path: 'analytics', title: 'Thống kê & Báo cáo' },
  { path: 'settings', title: 'Cài đặt hệ thống' },
  { path: 'reviews', title: 'Đánh giá sản phẩm' },
  { path: 'inventory', title: 'Quản lý kho hàng' },
  { path: 'inbox', title: 'Hộp thư' },
  { path: 'ai/settings', title: 'Cài đặt AI & Chatbot' },
  { path: 'ai/training', title: 'Huấn luyện Dữ liệu AI' },
  { path: 'ai/logs', title: 'Lịch sử & Logs AI' },
];

pages.forEach(page => {
  const fullPath = path.join(basePath, page.path);
  fs.mkdirSync(fullPath, { recursive: true });
  
  const content = `${page.isClient ? '"use client";\n\nimport { useParams } from "next/navigation";\n' : ''}
export default function AdminPage() {
  ${page.isClient ? 'const params = useParams();' : ''}
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">${page.title}</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý ${page.title.toLowerCase()}. ${page.isClient ? 'Mã: {params.id}' : ''}
          </p>
        </div>
      </div>
      <div className="p-12 text-center rounded-3xl border border-dashed text-muted-foreground">
        Tính năng đang được xây dựng...
      </div>
    </div>
  );
}
`;
  
  fs.writeFileSync(path.join(fullPath, 'page.tsx'), content);
  console.log(`Created: ${page.path}`);
});
