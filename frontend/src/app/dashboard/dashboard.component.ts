import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { SearchHistoryService, SearchHistoryItem } from '../core/services/search-history.service';
import { User } from '../../shared/interfaces/auth.interface';
import { SnippetService } from '../core/services/snippet.service';
import { Snippet } from '../../shared/interfaces/snippet.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  isLoading = false;
  totalSnippets = 0;
  favoriteSnippets = 0;
  publicSnippets = 0;
  recentSnippets: Snippet[] = [];
  isDarkTheme = false;
  isMenuOpen = false;
  
  // Búsqueda
  searchQuery = '';
  searchHistory: SearchHistoryItem[] = [];
  showHistory = false;

  constructor(
    private authService: AuthService,
    private snippetService: SnippetService,
    private themeService: ThemeService,
    private searchHistoryService: SearchHistoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.themeService.currentTheme$.subscribe(theme => {
      this.isDarkTheme = theme === 'dark';
      this.cdr.detectChanges();
    });
    
    this.loadSearchHistory();
    this.loadDashboardData();
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
        const allSnippets = response.items.map(item => ({
          ...item,
          is_public: Boolean(item.is_public),
          is_favorite: Boolean(item.is_favorite)
        }));
  
        this.totalSnippets = response.total;
        this.favoriteSnippets = allSnippets.filter(s => s.is_favorite).length;
        this.publicSnippets = allSnippets.filter(s => s.is_public).length;
  
        this.recentSnippets = allSnippets
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5);
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
    if (confirm(`¿Estás seguro de eliminar "${snippet.title}"?`)) {
      this.snippetService.deleteSnippet(snippet.id).subscribe({
        next: () => {
          this.loadDashboardData();
        },
        error: (error) => {
          console.error('Error al eliminar snippet:', error);
        }
      });
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.searchHistoryService.addSearch(this.searchQuery);
      this.loadSearchHistory();
      // Navegar a la página de snippets con el query de búsqueda
      this.router.navigate(['/snippets'], { queryParams: { q: this.searchQuery } });
    }
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
    if (confirm('¿Estás seguro de que quieres limpiar todo el historial de búsquedas?')) {
      this.searchHistoryService.clearHistory();
      this.loadSearchHistory();
    }
  }
}