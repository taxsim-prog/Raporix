import api from "./client";

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name?: string | null;
    role: "employee" | "admin" | string;
  };
}

export interface RegisterUserRequest {
  email: string;
  full_name: string;
  password: string;
  role: "employee" | "admin";
  company_id?: number;
  phone_number?: string;
  department?: string;
  position?: string;
}

export interface MailVerificationStatus {
  email: string;
  is_email_verified: boolean;
}

export const AuthApi = {
  async loginJson(email: string, password: string) {
    // request<LoginResponse> döner, yani direkt LoginResponse
    return api.post<LoginResponse>("/auth/login_json", { email, password });
  },

  async register(payload: {
    companyName: string;
    companyAddress: string;
    authorizedPerson: string;
    companyPhone: string;
    website: string;
    sgkNumber: string;
    taxNumber: string;
    taxOffice: string;
    authorizedPhone: string;
    authorizedEmail: string;
    password: string;
  }) {
    return api.post("/auth/register_company", payload);
  },

  async registerUser(payload: RegisterUserRequest) {
    return api.post<LoginResponse>("/auth/register_user", payload);
  },

  // 🔥 Mail verification durumu - QUERY STRING ile
  async checkMailVerification(email: string) {
    const path = `/auth/mail_verification?email=${encodeURIComponent(email)}`;
    return api.get<MailVerificationStatus>(path);
  },

  // 🔥 Mail verification maili gönder
  async sendMailVerification(email: string) {
    return api.post("/auth/mail_verification", { email });
  },
};

export default AuthApi;
