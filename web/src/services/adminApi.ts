// Admin API Service
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export interface AdminUser {
  id: string;
  email: string;
  display_name?: string;
  is_admin: boolean;
  created_at: string;
}

export interface AdminAuthResponse {
  message: string;
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
}

export interface MemoryStats {
  total_stm: number;
  users_with_stm: number;
  avg_importance: number | null;
}

export interface LongTermMemoryStats extends MemoryStats {
  total_ltm: number;
  users_with_ltm: number;
  user_context_count: number;
  preferences_count: number;
}

export interface ChatStats {
  total_conversations: number;
  users_with_chats: number;
  chats_today: number;
  chats_week: number;
  total_tokens: number;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  verified_users: number;
  new_users_week: number;
  new_users_month: number;
}

export interface MemoryCategory {
  category_primary: string;
  count: number;
}

export interface TopUser {
  email: string;
  chat_count: number;
  tokens_used: number;
  last_activity: string | null;
}

export interface DashboardStats {
  user_stats: UserStats;
  chat_stats: ChatStats;
  memory_stats: {
    short_term: MemoryStats;
    long_term: LongTermMemoryStats;
  };
  top_users: TopUser[];
  memory_categories: MemoryCategory[];
  // Legacy fields for compatibility
  total_users?: number;
  active_users?: number;
  inactive_users?: number;
  email_verified_users?: number;
  users_today?: number;
  users_this_week?: number;
  users_this_month?: number;
  uptime_seconds?: number;
  server_start_time?: string;
}

export interface UserListItem {
  id: string;
  email: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_admin: boolean;
  created_at: string;
  last_login_at?: string | null;
  chat_count: number;
  ltm_count: number;
  stm_count: number;
}

export interface UserDetails {
  user: {
    id: string;
    email: string;
    is_active: boolean;
    is_email_verified: boolean;
    is_admin: boolean;
    created_at: string;
    last_login_at?: string | null;
  };
  recent_chats: {
    chat_id: string;
    user_input_preview: string;
    ai_output_preview: string;
    tokens_used: number | null;
    created_at: string;
  }[];
  memory_info: {
    long_term: {
      ltm_count: number;
      avg_importance: number | null;
    };
    short_term: {
      stm_count: number;
      avg_importance: number | null;
    };
  };
}

export interface OpenAIUsageData {
  success: boolean;
  data?: any;
  error?: string;
}

export interface UsageCostData {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
  period_days: number;
  start_date: string;
  end_date: string;
}

class AdminApiService {
  private accessToken: string | null = null;

  constructor() {
    // Use regular auth tokens instead of separate admin tokens
    this.accessToken = localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  // No separate login - use regular auth system
  // Admin status is checked on the backend via is_admin field

  logout(): void {
    this.accessToken = null;
    // Clear regular auth tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async getStats(): Promise<DashboardStats> {
    return await this.request<DashboardStats>('/admin/stats');
  }

  async getUsers(): Promise<{ users: UserListItem[] }> {
    return await this.request<{ users: UserListItem[] }>('/admin/users');
  }

  async getUserDetails(userId: string): Promise<UserDetails> {
    return await this.request<UserDetails>(`/admin/user/${userId}/details`);
  }

  async getOpenAIUsage(): Promise<OpenAIUsageData> {
    // This endpoint may not exist yet, return mock data
    return { success: false, error: 'Not implemented' };
  }

  async getUsageCost(days: number = 7): Promise<UsageCostData> {
    return await this.request<UsageCostData>(`/admin/usage-cost?days=${days}`);
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.isAdmin === true;
  }
}

export const adminApi = new AdminApiService();
