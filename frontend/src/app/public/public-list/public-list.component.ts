import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SnippetService } from '../../core/services/snippet.service';
import { SearchHistoryService, SearchHistoryItem } from '../../core/services/search-history.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Snippet, SnippetsResponse } from '../../../shared/interfaces/snippet.interface';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-public-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './public-list.component.html',
  styleUrl: './public-list.component.scss'
})
export class PublicListComponent implements OnInit, OnDestroy {
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
  
  // Historial de búsquedas
  searchHistory: SearchHistoryItem[] = [];
  showHistory = false;

  // Para debounce de búsqueda
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  
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
  ) {}

  ngOnInit(): void {
    this.loadSearchHistory();
    
    // Leer query params de la URL
    const paramsSub = this.route.queryParams.subscribe(params => {
      if (params['language']) {
        this.selectedLanguage = params['language'];
      }
      if (params['q']) {
        this.searchQuery = params['q'];
      }
      if (params['page']) {
        this.currentPage = parseInt(params['page'], 10);
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

  loadSnippets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const filters = {
      page: this.currentPage,
      limit: this.limit,
      q: this.searchQuery || undefined,
      language: this.selectedLanguage || undefined
    };

    this.snippetService.getPublicSnippets(filters).pipe(
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
        console.error('Error al cargar snippets públicos:', error);
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Verifica que el servidor esté en funcionamiento.';
        } else if (error.status >= 500) {
          this.errorMessage = 'Error del servidor. Intenta de nuevo más tarde.';
        } else {
          this.errorMessage = 'Error al cargar los snippets públicos. Intenta de nuevo.';
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

  loadSearchHistory(): void {
    this.searchHistory = this.searchHistoryService.getHistory();
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
        this.notificationService.success('Historial limpiado correctamente');
      }
    });
  }

  copyCode(snippet: Snippet): void {
    if (!snippet?.code) return;

    navigator.clipboard.writeText(snippet.code).then(() => {
      this.notificationService.success('Código copiado al portapapeles');
    }).catch(err => {
      console.error('Error al copiar:', err);
      this.notificationService.error('Error al copiar el código');
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

  get totalPages(): number {
    return Math.ceil(this.total / this.limit);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    
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