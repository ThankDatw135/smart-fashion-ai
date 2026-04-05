"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: Gửi log lỗi lên monitoring service (Sentry, LogRocket...)
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <h2 className="text-2xl font-bold mb-4">Đã xảy ra lỗi không mong muốn!</h2>
      <p className="text-muted-foreground mb-6">
        Xin lỗi, hệ thống đang gặp sự cố. Vui lòng thử lại sau.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
      >
        Thử lại
      </button>
    </div>
  );
}
