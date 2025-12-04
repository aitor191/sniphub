import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Snippet, SnippetRequest, SnippetsResponse } from '../../../shared/interfaces/snippet.interface';

export interface SnippetFilters {
  page?: number;
  limit?: number;
  language?: string;
  is_favorite?: boolean;
  category_id?: number;
  q?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SnippetService {
  constructor(private api: ApiService) {}

  // Obtener todos los snippets del usuario con filtros
  getMySnippets(filters: SnippetFilters = {}): Observable<SnippetsResponse> {
    const params = this.buildQueryParams(filters);
    return this.api.get<SnippetsResponse>(`/snippets${params}`);
  }

  // Obtener un snippet por ID
  getSnippetById(id: number): Observable<Snippet> {
    return this.api.get<Snippet>(`/snippets/${id}`);
  }

  // Crear un nuevo snippet
  createSnippet(snippet: SnippetRequest): Observable<{ message: string; id: number }> {
    return this.api.post<{ message: string; id: number }>('/snippets', snippet);
  }

  // Actualizar un snippet
  updateSnippet(id: number, snippet: Partial<SnippetRequest>): Observable<{ message: string; snippet: Snippet }> {
    return this.api.put<{ message: string; snippet: Snippet }>(`/snippets/${id}`, snippet);
  }

  // Eliminar un snippet
  deleteSnippet(id: number): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/snippets/${id}`);
  }

  // Toggle favorito
  toggleFavorite(id: number, is_favorite: boolean): Observable<{ message: string; is_favorite: boolean }> {
    return this.api.patch<{ message: string; is_favorite: boolean }>(`/snippets/${id}/favorite`, { is_favorite });
  }

  // Obtener snippets públicos (no requiere autenticación)
  getPublicSnippets(filters: SnippetFilters = {}): Observable<SnippetsResponse> {
    const params = this.buildQueryParams(filters);
    return this.api.get<SnippetsResponse>(`/public/snippets${params}`);
  }

  // Obtener un snippet público por ID
  getPublicSnippetById(id: number): Observable<Snippet> {
    return this.api.get<Snippet>(`/public/snippets/${id}`);
  }

  // Helper para construir query params
  private buildQueryParams(filters: SnippetFilters): string {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.language) params.append('language', filters.language);
    if (filters.is_favorite !== undefined) params.append('is_favorite', filters.is_favorite.toString());
    if (filters.category_id) params.append('category_id', filters.category_id.toString());
    if (filters.q) params.append('q', filters.q);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }
}