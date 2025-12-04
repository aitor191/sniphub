import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category, CategoriesResponse } from '../../../shared/interfaces/category.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private api: ApiService) {}

  // Obtener todas las categorías
  getCategories(): Observable<CategoriesResponse> {
    return this.api.get<CategoriesResponse>('/categories');
  }

  // Obtener una categoría por ID
  getCategoryById(id: number): Observable<{ category: Category }> {
    return this.api.get<{ category: Category }>(`/categories/${id}`);
  }
}