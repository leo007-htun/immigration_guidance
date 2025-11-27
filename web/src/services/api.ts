// API Service for authentication and user management

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  displayName?: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle token expiration
      if (response.status === 403 || response.status === 401) {
        // Try to refresh token
        if (this.refreshToken && endpoint !== '/auth/refresh') {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry original request with new token
            headers['Authorization'] = `Bearer ${this.accessToken}`;
            const retryResponse = await fetch(url, { ...config, headers });

            if (!retryResponse.ok) {
              const error = await retryResponse.json();
              throw new Error(error.error || 'Request failed');
            }

            return await retryResponse.json();
          } else {
            // Refresh failed, logout user
            this.logout();
            throw new Error('Session expired. Please login again.');
          }
        }
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  /**
   * Sign up a new user
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store tokens
    this.accessToken = response.accessToken;
    this.refreshToken = response.refreshToken;
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!this.refreshToken) return false;

      const response = await this.request<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      this.accessToken = response.accessToken;
      localStorage.setItem('accessToken', response.accessToken);
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    return response.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const api = new ApiService();
