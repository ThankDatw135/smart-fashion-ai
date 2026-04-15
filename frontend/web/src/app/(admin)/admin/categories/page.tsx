"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, FolderTree, Loader2, X, AlertTriangle } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Category } from "@/types/product";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductsAPI } from "@/services/products.api";
import { toast } from "sonner";

type TableCategory = {
  id: string;
  name: string;
  slug: string;
  parent: string | null;
  parentId: string | null;
  description: string | null;
};

// ---- Modal Tạo/Sửa Danh Mục ----
function CategoryModal({
  open,
  onClose,
  editData,
  categories,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editData?: TableCategory | null;
  categories: Category[];
  onSuccess: () => void;
}) {
  const [name, setName] = useState(editData?.name || "");
  const [slug, setSlug] = useState(editData?.slug || "");
  const [description, setDescription] = useState(editData?.description || "");
  const [parentId, setParentId] = useState(editData?.parentId || "");

  // Auto-generate slug từ name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!editData) {
      setSlug(
        value
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/[^a-z0-9\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
      );
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => ProductsAPI.createCategory(data),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      ProductsAPI.updateCategory(id, data),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }
    try {
      const payload = { name: name.trim(), slug: slug.trim(), description: description.trim() || undefined, parentId: parentId || undefined };
      if (editData) {
        await updateMutation.mutateAsync({ id: editData.id, data: payload });
        toast.success("Đã cập nhật danh mục!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Đã tạo danh mục mới!");
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
      <div className="bg-card border rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-heading font-bold">
            {editData ? "Chỉnh sửa Danh mục" : "Thêm Danh mục mới"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tên danh mục *</label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="VD: Áo Nam, Quần Nữ..."
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Slug (URL)</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ao-nam"
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Danh mục cha</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border bg-background text-sm"
            >
              <option value="">— Không có (Danh mục gốc) —</option>
              {categories
                .filter((c) => c.id !== editData?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mô tả</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về danh mục..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
              Hủy
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang lưu...</> : (editData ? "Cập nhật" : "Tạo mới")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Confirm Delete Dialog ----
function ConfirmDeleteDialog({
  open,
  categoryName,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  categoryName: string;
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
            <h2 className="text-base font-semibold">Xóa danh mục?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bạn chắc muốn xóa <span className="font-semibold text-foreground">&ldquo;{categoryName}&rdquo;</span>?
              Các sản phẩm trong danh mục này sẽ không bị ảnh hưởng.
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

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categoriesResponse } = useCategories();
  const rawCategories = (categoriesResponse?.data || []) as Category[];

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TableCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableCategory | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ProductsAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã xóa danh mục!");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Không thể xóa danh mục."),
  });

  const tableData = useMemo<TableCategory[]>(() => {
    return rawCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent: rawCategories.find((c) => c.id === cat.parentId)?.name || null,
      parentId: cat.parentId || null,
      description: (cat as any).description || null,
    }));
  }, [rawCategories]);

  const columns = useMemo<ColumnDef<TableCategory>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên Danh mục",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${row.original.parent ? "bg-muted" : "bg-primary/10 text-primary"}`}>
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground font-mono">/{row.original.slug}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "parent",
        header: "Danh mục cha",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.parent || "— (Gốc)"}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
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
    []
  );

  const handleModalClose = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div className="space-y-6">
      <CategoryModal
        open={modalOpen}
        onClose={handleModalClose}
        editData={editTarget}
        categories={rawCategories}
        onSuccess={handleModalSuccess}
      />
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        categoryName={deleteTarget?.name || ""}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        isPending={deleteMutation.isPending}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">Danh mục Sản phẩm</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý cấu trúc cây danh mục cho cửa hàng ({tableData.length} danh mục).
          </p>
        </div>
        <Button onClick={() => { setEditTarget(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Thêm Danh Mục
        </Button>
      </div>

      <DataTable columns={columns} data={tableData} />
    </div>
  );
}
