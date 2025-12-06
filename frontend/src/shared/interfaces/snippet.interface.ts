export interface Snippet {
    id: number;
    title: string;
    description?: string;
    code: string;
    language: string;
    user_id: number;
    is_public: boolean;
    is_favorite: boolean;
    tags?: any;
    created_at: string;
    updated_at: string;
  }
  
  export interface SnippetRequest {
    title: string;
    description?: string;
    code: string;
    language: string;
    is_public?: boolean;
    is_favorite?: boolean;
    tags?: any;
  }
  
  export interface SnippetsResponse {
    items: Snippet[];
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  }