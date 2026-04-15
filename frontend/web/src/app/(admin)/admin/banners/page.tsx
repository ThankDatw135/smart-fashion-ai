"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, LayoutTemplate, X, Loader2, AlertTriangle, ToggleLeft, ToggleRight } from "lucide-react";
import { Banner } from "@/types/banner";
import { useBanners } from "@/hooks/useBanners";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BannersAPI } from "@/services/banners.api";
import { toast } from "sonner";
import Image from "next/image";

const POSITION_LABELS: Record<string, string> = {
  homepage_hero: "Trang Chủ — Hero",
  category_top: "Danh Mục — Top",
  popup: "Popup Toàn Trang",
  sidebar: "Sidebar",
  HERO: "Trang Chủ — Hero",
};

// ---- Banner Modal ----
function BannerModal({
  open,
  onClose,
  editData,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editData?: Banner | null;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(editData?.title || "");
  const [link, setLink] = useState(editData?.link || "");
  const [imageUrl, setImageUrl] = useState(editData?.imageUrl || "");
  const [position, setPosition] = useState(editData?.position || "homepage_hero");
  const [isActive, setIsActive] = useState(editData?.isActive ?? true);

  const createMutation = useMutation({
    mutationFn: (data: Partial<Banner>) => BannersAPI.createBanner(data),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Banner> }) =>
      BannersAPI.updateBanner(id, data),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error("Vui lòng nhập tiêu đề và URL hình ảnh");
      return;
    }
    try {
      const payload = { title: title.trim(), link: link.trim(), imageUrl: imageUrl.trim(), position, isActive };
      if (editData) {
        await updateMutation.mutateAsync({ id: editData.id, data: payload });
        toast.success("Đã cập nhật banner!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo banner mới!");
      }
      onSuccess();
      onClose();
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold">
            {editData ? "Chỉnh sửa Banner" : "Tạo Banner mới"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tiêu đề *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Sale Mùa Hè 2026" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">URL Hình ảnh *</label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            {imageUrl && (
              <div className="relative h-24 rounded-lg overflow-hidden border bg-muted mt-2">
                <Image src={imageUrl} alt="Preview" fill className="object-cover" onError={() => {}} />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Đường dẫn khi click</label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/category/summer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Vị trí hiển thị</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="homepage_hero">Trang Chủ — Hero</option>
                <option value="category_top">Danh Mục — Top</option>
                <option value="popup">Popup Toàn Trang</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Trạng thái</label>
              <select
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
              >
                <option value="active">Đang hiển thị</option>
                <option value="inactive">Đã ẩn</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Hủy</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</> : (editData ? "Cập nhật" : "Tạo mới")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Confirm Delete ----
function ConfirmDeleteDialog({
  open,
  bannerTitle,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  bannerTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-destructive/10 text-destructive shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Xóa banner?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Xác nhận xóa banner <span className="font-semibold text-foreground">&ldquo;{bannerTitle}&rdquo;</span>?
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>Hủy</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xóa"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  // NOTE: BannersAPI chưa có deleteBanner — thêm inline toggle qua updateBanner (isActive = false)
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      BannersAPI.updateBanner(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success(isActive ? "Đã bật banner!" : "Đã ẩn banner!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Không thể thay đổi trạng thái banner."),
  });

  const columns = useMemo<ColumnDef<Banner>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tên Banner",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
              <Image
                src={row.original.imageUrl || "/placeholder.jpg"}
                alt={row.original.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-sm">{row.original.title}</p>
              {row.original.link && (
                <p className="text-xs text-muted-foreground font-mono">{row.original.link}</p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "position",
        header: "Vị trí",
        cell: ({ row }) => (
          <span className="text-sm">{POSITION_LABELS[row.original.position] || row.original.position}</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => {
          const badgeStatus: StatusType = row.original.isActive ? "active" : "error";
          return <StatusBadge status={badgeStatus} />;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {/* Toggle */}
            <Button
              variant="ghost"
              size="icon"
              title={row.original.isActive ? "Ẩn banner" : "Bật banner"}
              onClick={() =>
                toggleMutation.mutate({ id: row.original.id, isActive: !row.original.isActive })
              }
            >
              {row.original.isActive ? (
                <ToggleRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditTarget(row.original);
                setModalOpen(true);
              }}
            >
              <Edit className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
            {/* Delete (ẩn hoàn toàn) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="w-4 h-4 text-destructive opacity-75 hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        ),
      },
    ],
    [toggleMutation]
  );

  const { data: res } = useBanners();
  const banners = (res?.data || []) as Banner[];

  return (
    <div className="space-y-6">
      <BannerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        editData={editTarget}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["banners"] })}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        bannerTitle={deleteTarget?.title || ""}
        onConfirm={() => deleteTarget && toggleMutation.mutate({ id: deleteTarget.id, isActive: false })}
        onCancel={() => setDeleteTarget(null)}
        isPending={toggleMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Bảng Biển & Landing Page</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý Banner quảng cáo, Popup, và Carousel hình ảnh ({banners.length} banners).
          </p>
        </div>
        <Button onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Tạo Banner
        </Button>
      </div>

      <DataTable columns={columns} data={banners} />
    </div>
  );
}
