import api from "./client";

export interface CertificateOut {
  id: string;
  user_id: string;
  company_id: string;
  certificate_name: string;
  certificate_type?: string | null;
  certificate_path: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateCreateRequest {
  user_id: number;
  company_id: number;
  certificate_name: string;
  certificate_type?: string;
  expiry_date: string;
}

export interface CertificateUpdateRequest {
  certificate_name?: string;
  certificate_type?: string;
  expiry_date?: string;
}

export const CertificatesApi = {
  // Şirketteki tüm çalışanların belgelerini listele
  listByCompany: (companyId: number) => 
    api.get<CertificateOut[]>(`/certificates/company/${companyId}`),

  // Belirli bir kullanıcının belgelerini listele
  listByUser: (userId: number, companyId?: number) => {
    const qs = companyId ? `?company_id=${companyId}` : "";
    return api.get<CertificateOut[]>(`/certificates/user/${userId}${qs}`);
  },

  // Belirli bir belgeyi getir
  get: (id: string) => 
    api.get<CertificateOut>(`/certificates/${id}`),

  // Yeni belge oluştur
  create: (request: CertificateCreateRequest) => 
    api.post<CertificateOut>("/certificates/", request),

  // Belgeyi güncelle
  update: (id: string, request: CertificateUpdateRequest) => 
    api.patch<CertificateOut>(`/certificates/${id}`, request),

  // Belgeyi sil
  delete: (id: string) => 
    api.del<{ ok: boolean }>(`/certificates/${id}`),

  // PDF yükle
  uploadPdf: async (certificateId: string, file: { uri: string; name: string; type: string }) => {
    return api.upload<CertificateOut>(`/certificates/${certificateId}/upload_pdf`, file);
  },
};

export default CertificatesApi;
