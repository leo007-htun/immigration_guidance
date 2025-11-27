const API_BASE_URL = 'http://localhost:3001/api';

export interface ChatMessage {
  message: string;
  conversation_id?: string;
}

export interface SourceDocument {
  document_id: number;
  text_preview: string;
  metadata: string;
  relevance_score: number;
}

export interface ChatResponse {
  response: string;
  sources: SourceDocument[];
  conversation_id?: string;
}

class ChatApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Always read fresh token from localStorage to handle signup/login updates
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
      }),
    });
  }

  async getHistory(): Promise<any> {
    return this.request('/chat/history');
  }

  async deleteConversation(conversationId: string): Promise<any> {
    return this.request(`/chat/conversation/${conversationId}`, {
      method: 'DELETE',
    });
  }
}

export const chatApi = new ChatApiService();
