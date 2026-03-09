import api from "./client";
import StorageService from '../utils/StorageService';

export interface CompanyOut {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

export interface CompanyCreate {
  name: string;
  address?: string;
  phone?: string;
}

export interface CompanyEmployee {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  position: string;
  department: string;
  phone_number: string;
  avatar_url: string | null;
  pdf_path: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CompanyEmployeesResponse {
  company_id: string;
  company_name: string;
  employee_count: number;
  employees: CompanyEmployee[];
}

export const CompaniesApi = {
  list: async (params?: { q?: string; limit?: number; offset?: number }) => {
    try {
      const email = await StorageService.getItem<string>("userEmail")
      if (!email) {
        throw new Error("Kullanıcı e-postası bulunamadı")
      }
      return api.get<CompanyOut[]>(`/companies/by-email/${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('[CompaniesApi] List error:', error);
      throw error;
    }
  },
  create: (payload: CompanyCreate) => api.post<CompanyOut>("/companies/", payload),
  get: (id: string) => api.get<CompanyOut>(`/companies/${id}`),
  update: (id: string, payload: CompanyCreate) => api.patch<CompanyOut>(`/companies/${id}`, payload),
  getEmployees: async (companyId: number) => {
    return api.get<CompanyEmployeesResponse>(`/companies/${companyId}/employees`);
  },
};

export default CompaniesApi;
