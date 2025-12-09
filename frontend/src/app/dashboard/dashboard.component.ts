import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { SearchHistoryService, SearchHistoryItem } from '../core/services/search-history.service';
import { User } from '../../shared/interfaces/auth.interface';
import { SnippetService } from '../core/services/snippet.service';
import { Snippet } from '../../shared/interfaces/snippet.interface';
import { NotificationService } from '../core/services/notification.service';
import { DialogService } from '../core/services/dialog.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  isLoading = false;
  totalSnippets = 0;
  favoriteSnippets = 0;
  publicSnippets = 0;
  recentSnippets: Snippet[] = [];
  allSnippets: Snippet[] = [];
  filteredSnippets: Snippet[] = [];
  activeFilter: string = 'all';
  popularTags: { tag: string; count: number }[] = [];
  isDarkTheme = false;
  isMenuOpen = false;
  
  // Búsqueda
  searchQuery = '';
  searchHistory: SearchHistoryItem[] = [];
  showHistory = false;

  // Para debounce de búsqueda
  private searchSubject = new Subject<string>();
  private subscriptions = new Subscription();
  copiedId: number | null = null;

  constructor(
    private authService: AuthService,
    private snippetService: SnippetService,
    private themeService: ThemeService,
    private searchHistoryService: SearchHistoryService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    const themeSub = this.themeService.currentTheme$.subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
      this.cdr.detectChanges();
    });
    this.subscriptions.add(themeSub);
    
    this.loadSearchHistory();
    this.loadDashboardData();
    
    // Configurar debounce para búsqueda
    const searchSub = this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.trim()) {
        this.searchHistoryService.addSearch(query);
        this.loadSearchHistory();
        this.router.navigate(['/snippets'], { queryParams: { q: query } });
      }
    });
    this.subscriptions.add(searchSub);
  }

  ngOnDestroy(): void {
    // Desuscribirse de todas las suscripciones
    this.subscriptions.unsubscribe();
    // Completar el Subject
    this.searchSubject.complete();
  }

  logout(): void {
    this.authService.logout();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenuOnMobile(): void {
    // Cerrar el menú en dispositivos móviles al hacer clic en un enlace
    if (window.innerWidth <= 768) {
      this.isMenuOpen = false;
    }
  }

  loadDashboardData(): void {
    this.isLoading = true;
  
    this.snippetService.getMySnippets({ limit: 1000 }).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.allSnippets = response.items.map(item => ({
          ...item,
          is_public: Boolean(item.is_public),
          is_favorite: Boolean(item.is_favorite)
        }));
  
        this.totalSnippets = response.total;
        this.favoriteSnippets = this.allSnippets.filter(s => s.is_favorite).length;
        this.publicSnippets = this.allSnippets.filter(s => s.is_public).length;
  
        // Extraer y contar tags
        this.extractPopularTags();
        
        // Aplicar filtro inicial
        this.applyFilter();
      },
      error: (error) => {
        console.error('Error al cargar datos del dashboard:', error);
      }
    });
  }

  editSnippet(snippet: Snippet): void {
    this.router.navigate(['/snippets', 'edit', snippet.id]);
  }

  deleteSnippet(snippet: Snippet): void {
    this.dialogService.confirm({
      title: 'Eliminar Snippet',
      message: `¿Estás seguro de eliminar "${snippet.title}"?`,
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
            this.loadDashboardData();
          },
          error: (error) => {
            console.error('Error al eliminar snippet:', error);
            setTimeout(() => {
              this.notificationService.error('Error al eliminar el snippet');
            }, 0);
          }
        });
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.searchHistoryService.addSearch(this.searchQuery);
      this.loadSearchHistory();
      // Navegar a la página de snippets con el query de búsqueda
      this.router.navigate(['/snippets'], { queryParams: { q: this.searchQuery } });
    }
  }

  onSearchInput(value: string): void {
    // Este método se llama desde el input para debounce
    this.searchSubject.next(value);
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
        setTimeout(() => {
          this.notificationService.success('Historial limpiado correctamente');
        }, 0);
      }
    });
  }

  extractPopularTags(): void {
    const tagCount: { [key: string]: number } = {};

    // Extraer todos los tags de los snippets
    this.allSnippets.forEach(snippet => {
      if (snippet.tags) {
        let tags: string[] = [];
        
        // Manejar diferentes formatos de tags (array, string JSON, string simple)
        if (Array.isArray(snippet.tags)) {
          tags = snippet.tags;
        } else if (typeof snippet.tags === 'string') {
          try {
            const parsed = JSON.parse(snippet.tags);
            tags = Array.isArray(parsed) ? parsed : [snippet.tags];
          } catch {
            // Si no es JSON válido, tratar como string simple
            tags = snippet.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
          }
        }

        // Contar frecuencia de cada tag
        tags.forEach(tag => {
          const normalizedTag = tag.trim().toLowerCase();
          if (normalizedTag.length > 0) {
            tagCount[normalizedTag] = (tagCount[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Convertir a array y ordenar por frecuencia (más usados primero)
    this.popularTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Mostrar máximo 7 tags más populares
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    let filtered = [...this.allSnippets];

    if (this.activeFilter === 'validations') {
      // Mantener el filtro de validaciones por compatibilidad
      filtered = filtered.filter(snippet => {
        const title = snippet.title?.toLowerCase() || '';
        const description = snippet.description?.toLowerCase() || '';
        return title.includes('valid') || description.includes('valid') || 
               title.includes('validar') || description.includes('validar') ||
               title.includes('validación') || description.includes('validación');
      });
    } else if (this.activeFilter !== 'all') {
      // Filtrar por tag específico
      filtered = filtered.filter(snippet => {
        if (!snippet.tags) return false;
        
        let tags: string[] = [];
        if (Array.isArray(snippet.tags)) {
          tags = snippet.tags;
        } else if (typeof snippet.tags === 'string') {
          try {
            const parsed = JSON.parse(snippet.tags);
            tags = Array.isArray(parsed) ? parsed : [snippet.tags];
          } catch {
            tags = snippet.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
          }
        }

        return tags.some(tag => tag.trim().toLowerCase() === this.activeFilter.toLowerCase());
      });
    }

    // Ordenar por fecha de actualización y tomar los más recientes
    this.filteredSnippets = filtered
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
    
    this.recentSnippets = this.filteredSnippets;
    this.cdr.detectChanges();
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
}