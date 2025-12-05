import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { RegisterRequest } from '../../../shared/interfaces/auth.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.registerForm.value;

    const data: RegisterRequest = {
      username: formValue.username,
      email: formValue.email,
      password: formValue.password,
    }; 

    this.authService.register(data).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      })
    ).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/auth/login'], {
            queryParams: { registered: 'true' }
          });
        }, 1500);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        
        // Asegurar que isLoading se resetee inmediatamente
        this.isLoading = false;
        
        if (error.status === 409) {
          this.errorMessage = error.error?.error || 'El email o nombre de usuario ya está en uso';
        } else if (error.status === 400) {
          // Manejar errores de validación
          if (error.error?.errors && Array.isArray(error.error.errors)) {
            const validationErrors = error.error.errors.map((e: any) => e.message).join(', ');
            this.errorMessage = `Errores de validación: ${validationErrors}`;
          } else {
            this.errorMessage = error.error?.error || 'Error de validación. Revisa los datos ingresados.';
          }
        } else if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
        } else {
          this.errorMessage = error.error?.error || 'Error al registrarse. Intenta de nuevo.';
        }        
        // Forzar detección de cambios después de establecer el mensaje de error
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

  get username() {
    return this.registerForm.get('username');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }
}