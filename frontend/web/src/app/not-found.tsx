"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Trang bạn tìm kiếm không tồn tại</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Có vẻ như đường dẫn đã bị thay đổi hoặc trang web không còn khả dụng.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Trở về trang chủ
      </Link>
    </div>
  );
}
