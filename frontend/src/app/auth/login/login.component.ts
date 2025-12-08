import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../../shared/interfaces/auth.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      })
    ).subscribe({
      next: (response) => {
        this.cdr.detectChanges();
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        console.error('Error completo:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        
        // Resetear isLoading inmediatamente
        this.isLoading = false;
        
        // Manejar diferentes tipos de errores
        if (error.status === 400) {
          // Error de validación del backend
          if (error.error?.errors && Array.isArray(error.error.errors)) {
            const validationErrors = error.error.errors.map((e: any) => e.message).join(', ');
            this.errorMessage = `Errores de validación: ${validationErrors}`;
          } else {
            this.errorMessage = error.error?.error || 'Error de validación. Revisa los datos ingresados.';
          }
        } else if (error.status === 401) {
          this.errorMessage = error.error?.error || 'Credenciales inválidas';
        } else if (error.status === 403) {
          this.errorMessage = error.error?.error || 'Usuario inactivo';
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
        } else {
          this.errorMessage = error.error?.error || 'Error al iniciar sesión. Intenta de nuevo.';
        }
        
        // Forzar detección de cambios
        this.cdr.detectChanges();
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}