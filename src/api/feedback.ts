import api from "./client";

export interface FeedbackOut {
  id: string;
  user_id: string;
  category: "bug" | "feature" | "improvement" | "general";
  rating: number;
  title: string;
  description: string;
  status: "pending" | "reviewed" | "resolved";
  admin_response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackCreateRequest {
  category: "bug" | "feature" | "improvement" | "general";
  rating: number;
  title: string;
  description: string;
}

export interface FeedbackUpdateRequest {
  status?: "pending" | "reviewed" | "resolved";
  admin_response?: string;
}

export const FeedbackApi = {
  create: (request: FeedbackCreateRequest) => 
    api.post<FeedbackOut>("/feedbacks/", request),
  
  list: (params?: { status?: string; category?: string; limit?: number; offset?: number }) => {
    const qs = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return api.get<FeedbackOut[]>(`/feedbacks/${qs}`);
  },
  
  get: (id: string) => api.get<FeedbackOut>(`/feedbacks/${id}`),
  
  update: (id: string, request: FeedbackUpdateRequest) => 
    api.patch<FeedbackOut>(`/feedbacks/${id}`, request),
  
  delete: (id: string) => api.del<{ ok: boolean; message: string }>(`/feedbacks/${id}`),
};

export default FeedbackApi;
