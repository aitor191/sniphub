import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SnippetService } from '../../core/services/snippet.service';
import { NotificationService } from '../../core/services/notification.service';
import { Snippet } from '../../../shared/interfaces/snippet.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-public-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-detail.component.html',
  styleUrl: './public-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicDetailComponent implements OnInit {
  snippet: Snippet | null = null;
  isLoading = false;
  errorMessage = '';
  copied = false;

  constructor(
    private snippetService: SnippetService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSnippet(parseInt(id, 10));
    } else {
      this.errorMessage = 'ID de snippet no válido';
    }
  }

  loadSnippet(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.snippetService.getPublicSnippetById(id).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (snippet: Snippet) => {
        this.snippet = {
          ...snippet,
          is_public: Boolean(snippet.is_public),
          is_favorite: Boolean(snippet.is_favorite)
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar snippet público:', error);
        if (error.status === 404) {
          this.errorMessage = 'Snippet público no encontrado.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Verifica que el servidor esté en funcionamiento.';
        } else {
          this.errorMessage = error.error?.error || 'Error al cargar el snippet.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  copyCode(): void {
    if (!this.snippet?.code) return;

    navigator.clipboard.writeText(this.snippet.code).then(() => {
      // Feedback inmediato
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 1500);

      // Toast asíncrono
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