export interface Category {
    id: number;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    created_at: string;
  }
  
  export interface CategoriesResponse {
    categories: Category[];
  }