import api from "./client";

export interface FormSubmissionOut {
  id: string;
  form_name: string;
  data: any;
  user_id: string;
  work_order_id?: string | null;
  created_at: string;
}

export interface FormSubmissionCreate {
  form_name: string;
  data: any;
  work_order_id?: number;
}

export const FormsApi = {
  list: (params?: { form_name?: string; work_order_id?: number; limit?: number; offset?: number }) => {
    const qs = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return api.get<FormSubmissionOut[]>(`/forms/${qs}`);
  },
  create: (payload: FormSubmissionCreate) => api.post<FormSubmissionOut>("/forms/", payload),
  get: (id: string) => api.get<FormSubmissionOut>(`/forms/${id}`),
  update: (id: string, payload: FormSubmissionCreate) => api.patch<FormSubmissionOut>(`/forms/${id}`, payload),
};

export default FormsApi;
