import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { User } from '../../shared/interfaces/auth.interface';
import { SnippetService } from '../core/services/snippet.service';
import { Snippet } from '../../shared/interfaces/snippet.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  constructor(
    private authService: AuthService,
    private snippetService: SnippetService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.loadDashboardData();
  }

  logout(): void {
    this.authService.logout();
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
}