import api from "./client";

export interface ReportHeaderTemplateOut {
  id: string | null;
  company_id: string;
  logo_path: string | null;
  qr_code_data: string | null;
  address_info: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportHeaderTemplateUpdate {
  logo_path?: string | null;
  qr_code_data?: string | null;
  address_info?: string | null;
}

export interface LogoUploadResponse {
  ok: boolean;
  logo_path: string;
  message: string;
}

export const ReportHeaderTemplateApi = {
  /**
   * Şirketin rapor başlık taslağını getir
   */
  get: async (companyId: number): Promise<ReportHeaderTemplateOut> => {
    return api.get<ReportHeaderTemplateOut>(`/report-header-template/${companyId}`);
  },

  /**
   * Şirketin rapor başlık taslağını oluştur veya güncelle
   */
  save: async (companyId: number, data: ReportHeaderTemplateUpdate): Promise<ReportHeaderTemplateOut> => {
    return api.post<ReportHeaderTemplateOut>(`/report-header-template/${companyId}`, data);
  },

  /**
   * Logo yükle
   */
  uploadLogo: async (companyId: number, file: { uri: string; name: string; type?: string }): Promise<LogoUploadResponse> => {
    return api.upload<LogoUploadResponse>(`/report-header-template/${companyId}/upload-logo`, file);
  },

  /**
   * Logo sil
   */
  deleteLogo: async (companyId: number): Promise<{ ok: boolean; message: string }> => {
    return api.del<{ ok: boolean; message: string }>(`/report-header-template/${companyId}/logo`);
  },
};

export default ReportHeaderTemplateApi;
