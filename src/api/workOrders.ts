import api from "./client";

export interface WorkOrderTask {
  task_name: string;
  quantity: number;
}

export interface WorkOrderCreateRequest {
  title: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  company_id: number;
  assigned_to: string;
  isg_katip_id: string;
  customer_company_title: string;
  customer_company_address: string;
  customer_company_phone: string;
  customer_authorized_person: string;
  customer_periodic_control_address: string;
  tax_number: string;
  tax_office: string;
  sgk_sicil_no?: string;
  service_contract_path?: string;
  tasks: WorkOrderTask[];
}

export interface WorkOrderUpdateRequest {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  company_id?: number;
  assigned_to?: string;
  isg_katip_id?: string;
  customer_company_title?: string;
  customer_company_address?: string;
  customer_company_phone?: string;
  customer_authorized_person?: string;
  customer_periodic_control_address?: string;
  tax_number?: string;
  tax_office?: string;
  sgk_sicil_no?: string;
  service_contract_path?: string;
  tasks?: WorkOrderTask[];
}

export interface WorkOrderOut {
  id: string;
  title: string;
  description?: string | null;
  company_id?: string | null;
  status: "pending" | "in_progress" | "completed" | string;
  assigned_to?: string | null;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  comments?: Array<{ user_id: string; text: string; created_at: string }>;
  isg_katip_id?: string;
  customer_company_title?: string;
  customer_company_address?: string;
  customer_company_phone?: string;
  customer_authorized_person?: string;
  customer_periodic_control_address?: string;
  tax_number?: string;
  tax_office?: string;
  sgk_sicil_no?: string;
  service_contract_path?: string;
  tasks?: WorkOrderTask[];
}

export const WorkOrdersApi = {
  async create(request: WorkOrderCreateRequest) {
    return api.post<WorkOrderOut>("/work_orders/", request);
  },
  async list(params?: {
    status?: string;
    company_id?: string;
    assigned_to?: string;
    limit?: number;
    offset?: number;
    sort_by?: "created_at" | "updated_at";
    sort_dir?: "asc" | "desc";
  }) {
    const qs = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return api.get<WorkOrderOut[]>(`/work_orders/${qs}`);
  },
  async get(id: string) {
    return api.get<WorkOrderOut>(`/work_orders/${id}`);
  },
  async assign(id: string, assigned_to: string) {
    return api.post<WorkOrderOut>(`/work_orders/${id}/assign`, { assigned_to });
  },
  async changeStatus(id: string, status: "pending" | "in_progress" | "completed") {
    return api.post<WorkOrderOut>(`/work_orders/${id}/status`, { status });
  },
  async getComments(id: string) {
    return api.get<Array<{ user_id: string; text: string; created_at: string }>>(`/work_orders/${id}/comments`);
  },
  async addComment(id: string, text: string) {
    return api.post<{ ok: boolean }>(`/work_orders/${id}/comments`, { text });
  },
  async update(id: string, request: WorkOrderUpdateRequest) {
    return api.patch<WorkOrderOut>(`/work_orders/${id}`, request);
  },
  async delete(id: string) {
    return api.del<{ ok: boolean }>(`/work_orders/${id}`);
  },
  async uploadServiceContract(workOrderId: string, file: { uri: string; name: string; type?: string }) {
    return api.upload<{ file_url: string }>(`/work_orders/${workOrderId}/service_contract`, file);
  },
};

export default WorkOrdersApi;
