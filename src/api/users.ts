import api from "./client";

export interface UserOut {
  id: string;
  email: string;
  full_name?: string | null;
  role: string;
  avatar_url?: string | null;
  department?: string | null;
  position?: string | null;
  phone_number?: string | null;
}

export const UsersApi = {
  me: (userId: string) => api.get<UserOut>(`/users/me?user_id=${encodeURIComponent(userId)}`),
  updateMe: async (patch: Partial<UserOut> & { password?: string; avatar_url?: string }) => {
    // Backend user_id'yi query parametresi olarak bekliyor (hatalı tasarım)
    // JWT'den zaten alıyor olması gerekir ama geçici çözüm olarak gönderiyoruz
    const StorageService = (await import("../utils/StorageService")).default;
    const currentUser = await StorageService.getItem<{ id: string }>('currentUser');
    const userId = currentUser?.id || '';
    return api.patch<UserOut>(`/users/me?user_id=${encodeURIComponent(userId)}`, patch);
  },
  list: (params?: { limit?: number; offset?: number }) => {
    const qs = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return api.get<UserOut[]>(`/users/${qs}`);
  },
  get: (id: string) => api.get<UserOut>(`/users/${id}`),
  changePassword: async (data: { current_password: string; new_password: string }) => {
    // Backend user_id'yi query parametresi olarak bekliyor
    const StorageService = (await import("../utils/StorageService")).default;
    const currentUser = await StorageService.getItem<{ id: string }>('currentUser');
    const userId = currentUser?.id || '';
    return api.patch<{ message: string }>(`/users/me/change-password?user_id=${encodeURIComponent(userId)}`, data);
  },
  delete: (userId: string) => api.del<{ detail: string }>(`/users/${userId}`),
  update: (userId: string, data: Partial<UserOut>) => api.patch<UserOut>(`/users/${userId}`, data),
};

export default UsersApi;
