import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SnippetService } from '../../core/services/snippet.service';
import { Snippet, SnippetsResponse } from '../../../shared/interfaces/snippet.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-snippet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {
  snippets: Snippet[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Paginación
  currentPage = 1;
  limit = 12;
  total = 0;
  hasNext = false;
  
  // Filtros
  searchQuery = '';
  selectedLanguage = '';
  showFavoritesOnly = false;
  
  // Lenguajes disponibles
  languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'HTML', 
    'CSS', 'SQL', 'Shell', 'JSON', 'YAML', 'Markdown', 'Other'
  ];

  constructor(
    private snippetService: SnippetService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSnippets();
  }

  loadSnippets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters = {
      page: this.currentPage,
      limit: this.limit,
      q: this.searchQuery || undefined,
      language: this.selectedLanguage || undefined,
      is_favorite: this.showFavoritesOnly || undefined
    };

    this.snippetService.getMySnippets(filters).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: SnippetsResponse) => {
        this.snippets = (response.items || []).map(item => ({
          ...item,
          is_public: Boolean(item.is_public),
          is_favorite: Boolean(item.is_favorite)
        }));
        this.total = response.total || 0;
        this.hasNext = response.hasNext || false;
        this.currentPage = response.page || 1;
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error al cargar snippets:', error);
        
        // Manejo específico de errores
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Verifica que el servidor esté en funcionamiento.';
        } else if (error.status === 401) {
          this.errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
        } else if (error.status === 403) {
          this.errorMessage = 'No tienes permiso para ver estos snippets.';
        } else if (error.status === 404) {
          this.errorMessage = 'No se encontraron snippets.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Error del servidor. Intenta de nuevo más tarde.';
        } else {
          this.errorMessage = error.error?.error || 'Error al cargar los snippets. Intenta de nuevo.';
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadSnippets();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadSnippets();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSnippets();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleFavorite(snippet: Snippet): void {
    const newFavoriteState = !snippet.is_favorite;
    
    this.snippetService.toggleFavorite(snippet.id, newFavoriteState).subscribe({
      next: () => {
        snippet.is_favorite = newFavoriteState;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al actualizar favorito:', error);
        alert('Error al actualizar el favorito. Intenta de nuevo.');
      }
    });
  }

  deleteSnippet(snippet: Snippet): void {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${snippet.title}"?`)) {
      return;
    }

    this.snippetService.deleteSnippet(snippet.id).subscribe({
      next: () => {
        this.loadSnippets();
      },
      error: (error) => {
        console.error('Error al eliminar snippet:', error);
        alert('Error al eliminar el snippet. Intenta de nuevo.');
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    
    // Mostrar máximo 5 páginas
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  get showingRange(): string {
    const start = (this.currentPage - 1) * this.limit + 1;
    const end = Math.min(this.currentPage * this.limit, this.total);
    return `${start} - ${end} de ${this.total} snippets`;
  }
}