"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge, StatusType } from "@/components/admin/StatusBadge";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { format } from "date-fns";

import { TrainingJob } from "@/services/ai.api";
import { useAITrainingJobs } from "@/hooks/useAITraining";

export default function AdminAITrainingPage() {
  const columns = useMemo<ColumnDef<TrainingJob>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Job ID",
        cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.id}</span>
      },
      {
        accessorKey: "type",
        header: "Loại Tác vụ",
        cell: ({ row }) => (
           <span className="text-sm">
             {row.original.type === "vector_sync" && "Đồng bộ Vector (Sản phẩm mới)"}
             {row.original.type === "intent_update" && "Huấn luyện Intent Khách hàng"}
           </span>
        )
      },
      {
        accessorKey: "trigger",
        header: "Nguồn kích hoạt",
        cell: ({ row }) => <span className="text-sm capitalize">{row.original.trigger}</span>,
      },
      {
        accessorKey: "recordsProcessed",
        header: "Số lượng Bản ghi",
        cell: ({ row }) => <span className="font-medium text-center block w-full">{row.original.recordsProcessed}</span>,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          let badgeStatus: StatusType = "active";
          if (row.original.status === "processing") badgeStatus = "pending";
          if (row.original.status === "failed") badgeStatus = "error";
          
          return (
            <StatusBadge status={badgeStatus} />
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Thời gian bắt đầu",
        cell: ({ row }) => {
          try {
            return <span className="text-xs text-muted-foreground">{format(new Date(row.original.createdAt), "dd/MM/yyyy HH:mm:ss")}</span>;
          } catch (e) {
            return <span className="text-xs text-muted-foreground">{row.original.createdAt}</span>;
          }
        },
      },
    ],
    []
  );

  const { data: res } = useAITrainingJobs();
  const jobs = res?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">AI Training & Đồng bộ</h1>
          <p className="text-muted-foreground mt-1">
             Quản lý tiến trình nhúng dữ liệu (Embedding) lên cơ sở dữ liệu Vector.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
             <RefreshCw className="w-4 h-4 mr-2" /> Sync Product Vectors
          </Button>
          <Button>
             <CloudUpload className="w-4 h-4 mr-2" /> Upload Dataset (JSON)
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-3xl border bg-primary/5 text-primary flex items-center justify-between mb-2">
         <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-medium text-sm">Trạng thái Qdrant Database: Hoạt động bình thường (942 Vectors)</p>
         </div>
      </div>

      <DataTable columns={columns} data={jobs} pageCount={res?.meta?.totalPages || 1} />
    </div>
  );
}
