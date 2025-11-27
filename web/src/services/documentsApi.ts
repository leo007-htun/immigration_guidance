const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

export interface DocumentListItem {
  filename: string;
  file_path: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface DocumentUploadResponse {
  success: boolean;
  filename: string;
  file_path: string;
  message: string;
}

export interface DocumentDeleteResponse {
  success: boolean;
  message: string;
}

export interface IndexRebuildResponse {
  success: boolean;
  message: string;
  documents_indexed: number;
}

class DocumentsApiService {
  private accessToken: string | null = null;

  constructor() {
    // Use regular access token
    this.accessToken = localStorage.getItem('accessToken');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.accessToken || localStorage.getItem('accessToken');

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

  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const token = this.accessToken || localStorage.getItem('accessToken');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async listDocuments(): Promise<DocumentListItem[]> {
    return this.request<DocumentListItem[]>('/documents/list');
  }

  async deleteDocument(filename: string): Promise<DocumentDeleteResponse> {
    return this.request<DocumentDeleteResponse>(`/documents/delete/${filename}`, {
      method: 'DELETE',
    });
  }

  async rebuildIndex(): Promise<IndexRebuildResponse> {
    return this.request<IndexRebuildResponse>('/documents/rebuild-index', {
      method: 'POST',
    });
  }
}

export const documentsApi = new DocumentsApiService();
