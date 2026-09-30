export interface ApiError {
  success: false;
  code: string;
  message: string;
  current?: number;
  max?: number;
  errors?: any[];
}

class ApiClient {
  private baseUrl = '/api';

  getDeviceId(): string {
    let deviceId = localStorage.getItem('libr_device_id');
    if (!deviceId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        deviceId = crypto.randomUUID();
      } else {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
      localStorage.setItem('libr_device_id', deviceId);
    }
    return deviceId;
  }

  getToken(): string | null {
    return localStorage.getItem('libr_token');
  }

  setToken(token: string, expiresAt?: string | Date): void {
    localStorage.setItem('libr_token', token);
    if (expiresAt) {
      localStorage.setItem('libr_token_expiry', new Date(expiresAt).toISOString());
    } else {
      // Default to 7 days from now
      const fallbackExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      localStorage.setItem('libr_token_expiry', fallbackExpiry.toISOString());
    }
  }

  clearToken(): void {
    localStorage.removeItem('libr_token');
    localStorage.removeItem('libr_token_expiry');
  }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem('libr_token_expiry');
    if (!expiry) return false;
    return new Date() > new Date(expiry);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();

    // Check client-side expiration
    if (token && this.isTokenExpired() && !endpoint.includes('/auth/login')) {
      this.clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw {
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'Your 7-day session has expired. Please log in again.',
      };
    }

    const headers: Record<string, string> = {
      'X-Device-Id': this.getDeviceId(),
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (networkErr: any) {
      // Don't log out user on temporary network disconnections
      throw {
        success: false,
        code: 'NETWORK_ERROR',
        message: networkErr.message || 'Unable to reach the server. Please check your internet connection.',
      };
    }

    const data = await response.json().catch(() => ({
      success: false,
      code: 'PARSE_ERROR',
      message: 'Failed to parse response from server',
    }));

    if (!response.ok || data.success === false) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        this.clearToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw data;
    }

    return data as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async uploadFile(file: File): Promise<{ success: boolean; url: string; displayUrl?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ success: boolean; url: string; displayUrl?: string }>('/upload/image', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
