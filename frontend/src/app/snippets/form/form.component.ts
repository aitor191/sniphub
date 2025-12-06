import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { SnippetService } from '../../core/services/snippet.service';
import { SnippetRequest, Snippet } from '../../../shared/interfaces/snippet.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-snippet-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss'
})
export class FormComponent implements OnInit {
  snippetForm: FormGroup;
  isLoading = false;
  isEditMode = false;
  snippetId: number | null = null;
  errorMessage = '';
  successMessage = '';

  // Lenguajes disponibles
  languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'HTML', 
    'CSS', 'SQL', 'Shell', 'JSON', 'YAML', 'Markdown', 'Other'
  ];

  constructor(
    private fb: FormBuilder,
    private snippetService: SnippetService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.snippetForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      code: ['', [Validators.required]],
      language: ['', [Validators.required]],
      is_public: [false],
      is_favorite: [false],
      tags: ['']
    });
  }

  ngOnInit(): void {
    // Verificar si es en modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.snippetId = parseInt(id, 10);
      this.loadSnippet(this.snippetId);
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
        // Cargar datos en el formulario
        this.snippetForm.patchValue({
          title: snippet.title,
          description: snippet.description || '',
          code: snippet.code,
          language: snippet.language,
          is_public: snippet.is_public,
          is_favorite: snippet.is_favorite,
          tags: Array.isArray(snippet.tags) 
            ? snippet.tags.join(', ') 
            : (snippet.tags ? String(snippet.tags) : '')
        });
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar snippet:', error);
        this.errorMessage = error.error?.error || 'Error al cargar el snippet.';
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.snippetForm.invalid) {
      this.markFormGroupTouched(this.snippetForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.snippetForm.value;
    
    // Procesar tags: convertir string a array si es necesario
    let tags = null;
    if (formValue.tags && formValue.tags.trim()) {
      tags = formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }

    const snippetData: SnippetRequest = {
      title: formValue.title.trim(),
      description: formValue.description?.trim() || undefined,
      code: formValue.code,
      language: formValue.language,
      is_public: formValue.is_public || false,
      is_favorite: formValue.is_favorite || false,
      tags: tags && tags.length > 0 ? tags : undefined
    };

    if (this.isEditMode && this.snippetId) {
      // Actualizar snippet existente
      this.snippetService.updateSnippet(this.snippetId, snippetData).pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (response) => {
          console.log('Snippet actualizado:', response);
          this.successMessage = 'Snippet actualizado correctamente';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/snippets'/*, this.snippetId*/]);
          }, 1500);
        },
        error: (error) => {
          console.error('Error al actualizar snippet:', error);
          this.handleError(error);
          this.cdr.detectChanges();
        }
      });
    } else {
      // Crear nuevo snippet
      this.snippetService.createSnippet(snippetData).pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      ).subscribe({
        next: (response) => {
          console.log('Snippet creado:', response);
          this.successMessage = 'Snippet creado correctamente';
          this.cdr.detectChanges();
          setTimeout(() => {
            this.router.navigate(['/snippets']);
          }, 1500);
        },
        error: (error) => {
          console.error('Error al crear snippet:', error);
          this.handleError(error);
          this.cdr.detectChanges();
        }
      });
    }
  }

  private handleError(error: any): void {
    if (error.status === 400) {
      if (error.error?.errors && Array.isArray(error.error.errors)) {
        const validationErrors = error.error.errors.map((e: any) => e.message).join(', ');
        this.errorMessage = `Errores de validación: ${validationErrors}`;
      } else {
        this.errorMessage = error.error?.error || 'Error de validación. Revisa los datos ingresados.';
      }
    } else if (error.status === 404) {
      this.errorMessage = 'Snippet no encontrado.';
    } else if (error.status === 403) {
      this.errorMessage = 'No tienes permiso para realizar esta acción.';
    } else if (error.status === 0) {
      this.errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
    } else {
      this.errorMessage = error.error?.error || 'Error al guardar el snippet. Intenta de nuevo.';
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get title() {
    return this.snippetForm.get('title');
  }

  get code() {
    return this.snippetForm.get('code');
  }

  get language() {
    return this.snippetForm.get('language');
  }

  get description() {
    return this.snippetForm.get('description');
  }
}