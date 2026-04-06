import { api, USE_MOCK } from "./api";
import { PaginatedResponse } from "@/types/api";

export interface TrainingJob {
  id: string;
  type: "vector_sync" | "intent_update";
  trigger: "manual" | "auto" | "webhook";
  status: "success" | "processing" | "failed";
  recordsProcessed: number;
  createdAt: string; // ISO string back to Date on client
}

export const AIAdminAPI = {
  getTrainingJobs: async (params?: Record<string, any>): Promise<PaginatedResponse<TrainingJob>> => {
    if (USE_MOCK) {
       return new Promise((resolve) => setTimeout(() => resolve({
         data: [
            {
              id: "JOB-4522",
              type: "vector_sync",
              trigger: "webhook",
              status: "success",
              recordsProcessed: 125,
              createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            },
            {
              id: "JOB-4521",
              type: "intent_update",
              trigger: "manual",
              status: "processing",
              recordsProcessed: 45,
              createdAt: new Date().toISOString(),
            },
            {
              id: "JOB-4520",
              type: "vector_sync",
              trigger: "auto",
              status: "failed",
              recordsProcessed: 0,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
         ],
         meta: { total: 3, page: 1, limit: 10, totalPages: 1, hasNextPage: false, hasPrevPage: false }
       }), 400));
    }
    const res = await api.get<PaginatedResponse<TrainingJob>>("/admin/ai/training-jobs", { params });
    return res.data;
  }
};
