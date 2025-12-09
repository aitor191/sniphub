import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SnippetService } from '../../core/services/snippet.service';
import { AiService, ExplainCodeResponse } from '../../core/services/ai.services';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Snippet } from '../../../shared/interfaces/snippet.interface';
import { finalize } from 'rxjs/operators';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
  selector: 'app-snippet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MarkdownPipe],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailComponent implements OnInit {
  snippet: Snippet | null = null;
  isLoading = false;
  isLoadingExplanation = false;
  errorMessage = '';
  explanation: string | null = null;
  explanationProvider: string | null = null;
  isExplanationCached = false;
  showExplanation = false;
  copied = false;

  constructor(
    private snippetService: SnippetService,
    private aiService: AiService,
    private notificationService: NotificationService,
    private dialogService: DialogService,
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

    this.snippetService.getSnippetById(id).pipe(
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
        console.error('Error al cargar snippet:', error);
        if (error.status === 404) {
          this.errorMessage = 'Snippet no encontrado.';
        } else if (error.status === 403) {
          this.errorMessage = 'No tienes permiso para ver este snippet.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Verifica que el servidor esté en funcionamiento.';
        } else {
          this.errorMessage = error.error?.error || 'Error al cargar el snippet.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  explainCode(): void {
    if (!this.snippet || !this.snippet.code) {
      return;
    }

    this.isLoadingExplanation = true;
    this.errorMessage = '';
    this.showExplanation = true;

    this.aiService.explainCode(this.snippet.code).pipe(
      finalize(() => {
        this.isLoadingExplanation = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: ExplainCodeResponse) => {
        this.explanation = response.explanation;
        this.explanationProvider = response.provider;
        this.isExplanationCached = response.cached;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al explicar código:', error);
        if (error.status === 429) {
          this.errorMessage = 'Límite de uso de IA alcanzado. Intenta más tarde.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Error al procesar el código.';
        } else {
          this.errorMessage = 'Error al generar la explicación. Intenta de nuevo.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  deleteSnippet(): void {
    if (!this.snippet) return;

    this.dialogService.confirm({
      title: 'Eliminar Snippet',
      message: `¿Estás seguro de que quieres eliminar "${this.snippet.title}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    }).then(confirmed => {
      if (confirmed) {
        this.snippetService.deleteSnippet(this.snippet!.id).subscribe({
          next: () => {
            // Usar setTimeout para evitar el error NG0100
            setTimeout(() => {
              this.notificationService.success('Snippet eliminado correctamente');
            }, 0);
            this.router.navigate(['/snippets']);
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

  toggleFavorite(): void {
    if (!this.snippet) return;

    const newFavoriteState = !this.snippet.is_favorite;

    this.snippetService.toggleFavorite(this.snippet.id, newFavoriteState).subscribe({
      next: () => {
        this.snippet!.is_favorite = newFavoriteState;
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

  copyCode(): void {
    if (!this.snippet?.code) return;

    navigator.clipboard.writeText(this.snippet.code).then(() => {
      // Feedback inmediato en el botón
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
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