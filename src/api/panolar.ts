import api from "./client";

export interface PanoData {
  name: string;
  description?: string;
  location?: string;
  lastInspection?: string;
  // Diğer pano özellikleri buraya eklenebilir
}

export interface PanoCreateRequest {
  data: PanoData;
}

export interface PanoOut {
  id: string;
  gozle_control_form_id: string;
  data: PanoData;
  created_at: string;
  updated_at: string;
}

export const PanolarApi = {
  /**
   * Belirli bir form'a ait tüm panoları listele
   */
  async list(formId: string) {
    return api.get<PanoOut[]>(`/forms/${formId}/panolar`);
  },

  /**
   * Yeni pano oluştur
   */
  async create(formId: string, request: PanoCreateRequest) {
    return api.post<PanoOut>(`/forms/${formId}/panolar`, request);
  },

  /**
   * Tek bir panoyu getir
   */
  async get(panoId: string) {
    return api.get<PanoOut>(`/panolar/${panoId}`);
  },

  /**
   * Pano güncelle
   */
  async update(panoId: string, request: PanoCreateRequest) {
    return api.patch<PanoOut>(`/panolar/${panoId}`, request);
  },

  /**
   * Pano sil
   */
  async delete(panoId: string) {
    return api.del<{ ok: boolean; message: string }>(`/panolar/${panoId}`);
  },
};

export default PanolarApi;
