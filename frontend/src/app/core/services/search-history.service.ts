import { Injectable } from '@angular/core';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SearchHistoryService {
  private readonly STORAGE_KEY = 'sniphub-search-history';
  private readonly MAX_HISTORY = 10;

  getHistory(): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const history: SearchHistoryItem[] = JSON.parse(stored);
      // Ordenar por timestamp descendente (más recientes primero)
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error al leer historial de búsquedas:', error);
      return [];
    }
  }

  addSearch(query: string): void {
    if (!query || query.trim().length === 0) return;

    const trimmedQuery = query.trim();
    const history = this.getHistory();

    // Eliminar duplicados del mismo query
    const filtered = history.filter(item => item.query.toLowerCase() !== trimmedQuery.toLowerCase());

    // Agregar la nueva búsqueda al inicio
    const newItem: SearchHistoryItem = {
      query: trimmedQuery,
      timestamp: Date.now()
    };

    const updated = [newItem, ...filtered].slice(0, this.MAX_HISTORY);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error al guardar historial de búsquedas:', error);
    }
  }

  clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error al limpiar historial de búsquedas:', error);
    }
  }

  removeSearch(query: string): void {
    const history = this.getHistory();
    const filtered = history.filter(item => item.query !== query);

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error al eliminar búsqueda del historial:', error);
    }
  }
}