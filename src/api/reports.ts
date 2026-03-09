import api from "./client";

export interface ReportOut {
  id: string;
  title: string;
  description?: string | null;
  company_id?: string | null;
  work_order_id?: string | null;
  type: string; // pdf
  status: string; // ready
  pdf_url?: string | null;
  pdf_filename?: string | null;
  is_converted_to_pdf?: boolean;
  created_at: string;
}

export interface ReportCreate {
  title: string;
  description?: string;
  company_id?: number;
  work_order_id?: number;
  type?: string;
}

export interface PDFResponse {
  success: boolean;
  pdf_path: string;
  pdf_filename: string;
  pdf_url: string;
  already_converted?: boolean;
  data?: PDFData;
}

export interface PDFData {
  report: {
    id: number;
    title: string;
    description?: string | null;
    type: string;
    status: string;
    created_at: string;
  };
  work_order: {
    id: number;
    title: string;
    description?: string | null;
    status: string;
    tasks: any[];
    assigned_to?: string | null;
    created_at: string;
    updated_at?: string | null;
    isg_katip_id?: string | null;
    customer_company_title?: string | null;
    customer_company_address?: string | null;
    customer_company_phone?: string | null;
    customer_authorized_person?: string | null;
    customer_periodic_control_address?: string | null;
    tax_number?: string | null;
    tax_office?: string | null;
  };
  company: any;
  equipment: any[];
  forms: {
    general_info: {
      id: number;
      data: any;
      created_at: string;
    } | null;
    main_panel_control: {
      id: number;
      data: any;
      created_at: string;
    } | null;
    control_navigators: Array<{
      id: number;
      data: any;
      created_at: string;
    }>;
  };
  panos: Array<{
    pano_id: number;
    form_id: number;
    form_data: any;
    pano_data: any;
    created_at: string;
    updated_at: string;
  }>;
}

export const ReportsApi = {
  list: () => api.get<ReportOut[]>("/reports/"),
  create: (payload: ReportCreate) => api.post<ReportOut>("/reports/", payload),
  get: (id: string) => api.get<ReportOut>(`/reports/${id}`),
  delete: (id: string) => api.del<{ ok: boolean }>(`/reports/${id}`),
  convertToPDF: (id: string) => api.post<PDFResponse>(`/reports/${id}/convert-to-pdf`, {}),
};

export default ReportsApi;
