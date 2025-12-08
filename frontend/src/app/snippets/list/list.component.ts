import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SnippetService } from '../../core/services/snippet.service';
import { SearchHistoryService, SearchHistoryItem } from '../../core/services/search-history.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Snippet, SnippetsResponse } from '../../../shared/interfaces/snippet.interface';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-snippet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit, OnDestroy {
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

  // Historial de búsquedas
  searchHistory: SearchHistoryItem[] = [];
  showHistory = false;

  // Para debounce de búsqueda
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  copiedId: number | null = null;

  // Lenguajes disponibles
  languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#',
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'HTML',
    'CSS', 'SQL', 'Shell', 'JSON', 'YAML', 'Markdown', 'Other'
  ];

  constructor(
    private snippetService: SnippetService,
    private searchHistoryService: SearchHistoryService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadSearchHistory();
    
    const paramsSub = this.route.queryParams.subscribe(params => {
      if (params['is_favorite'] === 'true' || params['is_favorite'] === true) {
        this.showFavoritesOnly = true;
      }
      if (params['language']) {
        this.selectedLanguage = params['language'];
      }
      if (params['q']) {
        this.searchQuery = params['q'];
      }
    });
    this.subscriptions.add(paramsSub);

    this.loadSnippets();

    // Configurar debounce para búsqueda
    const searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      if (query.trim()) {
        this.searchHistoryService.addSearch(query);
        this.loadSearchHistory();
      }
      this.currentPage = 1;
      this.loadSnippets();
    });
    this.subscriptions.add(searchSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.searchSubject.complete();
  }

  loadSearchHistory(): void {
    this.searchHistory = this.searchHistoryService.getHistory();
  }

  loadSnippets(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.showHistory = false;

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

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.searchHistoryService.addSearch(this.searchQuery);
      this.loadSearchHistory();
    }
    this.currentPage = 1;
    this.loadSnippets();
  }

  onSearchFocus(): void {
    if (this.searchHistory.length > 0) {
      this.showHistory = true;
    }
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showHistory = false;
    }, 200);
  }

  selectHistoryItem(item: SearchHistoryItem): void {
    this.searchQuery = item.query;
    this.showHistory = false;
    this.onSearch();
  }

  removeHistoryItem(event: Event, item: SearchHistoryItem): void {
    event.stopPropagation();
    this.searchHistoryService.removeSearch(item.query);
    this.loadSearchHistory();
  }

  clearHistory(): void {
    this.dialogService.confirm({
      title: 'Limpiar Historial',
      message: '¿Estás seguro de que quieres limpiar todo el historial de búsquedas?',
      confirmText: 'Limpiar',
      cancelText: 'Cancelar'
    }).then(confirmed => {
      if (confirmed) {
        this.searchHistoryService.clearHistory();
        this.loadSearchHistory();
        setTimeout(() => {
          this.notificationService.success('Historial limpiado correctamente');
        }, 0);
      }
    });
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
        // Usar setTimeout para evitar errores de detección de cambios
        setTimeout(() => {
          this.notificationService.success(
            newFavoriteState ? 'Agregado a favoritos' : 'Eliminado de favoritos'
          );
        }, 0);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al actualizar favorito:', error);
        setTimeout(() => {
          this.notificationService.error('Error al actualizar el favorito. Intenta de nuevo.');
        }, 0);
      }
    });
  }

  deleteSnippet(snippet: Snippet): void {
    this.dialogService.confirm({
      title: 'Eliminar Snippet',
      message: `¿Estás seguro de que quieres eliminar "${snippet.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    }).then(confirmed => {
      if (confirmed) {
        this.snippetService.deleteSnippet(snippet.id).subscribe({
          next: () => {
            // Usar setTimeout para evitar el error NG0100
            setTimeout(() => {
              this.notificationService.success('Snippet eliminado correctamente');
            }, 0);
            this.loadSnippets();
          },
          error: (error) => {
            console.error('Error al eliminar snippet:', error);
            setTimeout(() => {
              this.notificationService.error('Error al eliminar el snippet. Intenta de nuevo.');
            }, 0);
          }
        });
      }
    });
  }

  copyCode(snippet: Snippet): void {
    if (!snippet?.code) return;

    navigator.clipboard.writeText(snippet.code).then(() => {
      // Feedback inmediato en el botón
      this.copiedId = snippet.id;
      setTimeout(() => {
        this.copiedId = null;
      }, 1500);

      // Usar setTimeout para consistencia y evitar errores de detección de cambios
      setTimeout(() => {
        this.notificationService.success('Código copiado al portapapeles');
      }, 0);
    }).catch(err => {
      console.error('Error al copiar:', err);
      setTimeout(() => {
        this.notificationService.error('Error al copiar el código');
      }, 0);
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

  get pageTitle(): string {
    if (this.showFavoritesOnly) {
      return '⭐ Mis Favoritos';
    }
    return 'Mis Snippets';
  }
}