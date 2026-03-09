import api from "./client";

export interface EquipmentOut {
  id: string;
  equipment_name: string;
  equipment_type: string;
  serial_number: string;
  calibration_certificate_path?: string | null;
  calibration_date?: string | null;
  calibration_expiry_date?: string | null;
  calibration_number?: string | null;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentCreateRequest {
  equipment_name: string;
  equipment_type: string;
  serial_number: string;
  calibration_certificate_path?: string;
  calibration_date?: string;
  calibration_expiry_date?: string;
  calibration_number?: string;
  company_id: number;
}

export interface EquipmentUpdateRequest {
  equipment_name?: string;
  equipment_type?: string;
  serial_number?: string;
  calibration_certificate_path?: string;
  calibration_date?: string;
  calibration_expiry_date?: string;
  calibration_number?: string;
}

export const EquipmentApi = {
  async list(params?: {
    company_id?: number;
    equipment_type?: string;
    limit?: number;
    offset?: number;
  }) {
    const qs = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return api.get<EquipmentOut[]>(`/equipment/${qs}`);
  },

  async get(id: string) {
    return api.get<EquipmentOut>(`/equipment/${id}`);
  },

  async create(request: EquipmentCreateRequest) {
    return api.post<EquipmentOut>("/equipment/", request);
  },

  async update(id: string, request: EquipmentUpdateRequest) {
    return api.patch<EquipmentOut>(`/equipment/${id}`, request);
  },

  async delete(id: string) {
    return api.del<{ ok: boolean }>(`/equipment/${id}`);
  },

  async uploadCertificate(id: string, file: { uri: string; name: string; type?: string }) {
    return api.upload<EquipmentOut>(`/equipment/${id}/upload_certificate`, file);
  },
};

export default EquipmentApi;
