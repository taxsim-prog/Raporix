import StorageService from "../utils/StorageService";
import { authEventEmitter } from "../utils/AuthEventEmitter";

const BASE_URL = "https://api.raptortr.com";
//const BASE_URL = "http://192.168.1.103:8000"; // eski local IP - kullanılmıyor

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

// Token expired veya unauthorized hatalarını kontrol et
// Login/register endpoint'lerinden gelen 401'leri hariç tut
function isAuthError(status: number, message: string, path: string): boolean {
  // Login veya register endpoint'lerinden gelen 401'ler normal hata, token expiration değil
  const authEndpoints = ['/auth/login', '/auth/login_json', '/auth/register', '/auth/register_company', '/auth/register_user'];
  if (authEndpoints.some(endpoint => path.includes(endpoint))) {
    return false;
  }

  // Diğer endpoint'lerden gelen 401'ler token expiration
  if (status === 401) return true;

  // Token ile ilgili mesajları kontrol et
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('token') &&
    (lowerMessage.includes('expired') || lowerMessage.includes('invalid') || lowerMessage.includes('süresi dolmuş'))
  );
}

async function request<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    isForm?: boolean;
  } = {}
): Promise<T> {
  const token = (await StorageService.getItem<string>("userToken")) || "";
  const method = options.method || "GET";
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    ...(options.isForm ? {} : { "Content-Type": "application/json; charset=utf-8" }),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // FormData için Content-Type header'ını kaldır (browser/RN otomatik ekler)
  if (options.isForm && headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  console.log(`[API] ${method} ${path}`);
  console.log(`[API] URL: ${url}`);
  console.log(`[API] Token:`, token ? `${token.substring(0, 20)}...` : "NO TOKEN");
  console.log(`[API] Headers:`, headers);
  console.log(`[API] Body:`, options.isForm ? 'FormData' : options.body);

  let res: Response;
  try {
    // 30 saniye timeout ekle
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    res = await fetch(url, {
      method,
      headers,
      body: options.body
        ? options.isForm
          ? options.body // FormData ise olduğu gibi
          : JSON.stringify(options.body, null, 0)
        : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err: any) {
    console.error(`[API] Network error in ${method} ${path}:`, err);

    // Timeout hatası kontrolü
    if (err.name === 'AbortError') {
      throw new Error("İstek zaman aşımına uğradı. Lütfen tekrar deneyin.");
    }

    // RN'de HTTP bloklandığında çoğunlukla buraya düşer
    throw new Error("Sunucuya bağlanılamadı. İnternet bağlantınızı veya güvenlik ayarlarını kontrol edin.");
  }

  const text = await res.text();
  console.log(`[API] Response text:`, text);

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text as any; // JSON değilse raw text döndür
  }

  if (!res.ok) {
    const message = (data && (data.detail || data.message)) || `HTTP ${res.status}`;
    const errorMessage = typeof message === "string" ? message : JSON.stringify(message);

    // 401 veya token expired hatası kontrolü
    if (isAuthError(res.status, errorMessage, path)) {
      console.log('[API] Token expired veya unauthorized hatası algılandı, logout tetikleniyor...');

      // Storage'ı temizle
      await StorageService.removeItem('userToken');
      await StorageService.removeItem('currentUser');
      await StorageService.removeItem('userEmail');

      // Logout event'i tetikle
      authEventEmitter.emitLogout();

      // Kullanıcı dostu mesaj
      throw new Error("Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın.");
    }

    throw new Error(errorMessage);
  }

  console.log(`[API] Success:`, data);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: any) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: any) => request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, file: { uri: string; name: string; type?: string }) => {
    const form = new FormData();
    // React Native FormData için doğru format
    form.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type || "application/pdf",
    } as any);
    
    console.log('[API] Upload file:', { uri: file.uri, name: file.name, type: file.type });
    
    return request<T>(path, { method: "POST", body: form, isForm: true });
  },
};

export default api;
