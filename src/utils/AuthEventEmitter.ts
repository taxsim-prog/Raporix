/**
 * Auth Event Emitter
 * Token süresi dolduğunda veya 401 hatası alındığında global logout işlemi tetiklemek için kullanılır.
 */

type AuthEventCallback = () => void;

class AuthEventEmitter {
  private listeners: AuthEventCallback[] = [];
  private isProcessingLogout: boolean = false;

  /**
   * Logout event'i için listener ekle
   */
  addLogoutListener(callback: AuthEventCallback): () => void {
    this.listeners.push(callback);
    
    // Unsubscribe fonksiyonu döndür
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Logout event'i tetikle
   * Tüm listener'ları çağırır
   */
  emitLogout(): void {
    // Aynı anda birden fazla logout işlemini önle
    if (this.isProcessingLogout) {
      console.log('[AuthEventEmitter] Logout zaten işleniyor, atlandi');
      return;
    }

    this.isProcessingLogout = true;
    console.log('[AuthEventEmitter] Logout event tetiklendi');

    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[AuthEventEmitter] Listener hatası:', error);
      }
    });

    // 2 saniye sonra flag'i sıfırla (yeni logout'lar için)
    setTimeout(() => {
      this.isProcessingLogout = false;
    }, 2000);
  }

  /**
   * Tüm listener'ları temizle
   */
  removeAllListeners(): void {
    this.listeners = [];
  }
}

// Singleton instance
export const authEventEmitter = new AuthEventEmitter();
export default authEventEmitter;
