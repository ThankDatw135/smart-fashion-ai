import { ClientOnly } from "@/components/helpers/ClientOnly";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientOnly>
      <div className="flex min-h-screen" suppressHydrationWarning>
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0" suppressHydrationWarning>
          <AdminHeader />
          <main className="flex-1 p-6 bg-muted/20">{children}</main>
        </div>
      </div>
    </ClientOnly>
  );
}
