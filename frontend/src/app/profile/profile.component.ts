import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { SnippetService } from '../core/services/snippet.service';
import { User } from '../../shared/interfaces/auth.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  isLoading = false;
  isLoadingStats = false;
  
  // Formularios
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  // Mensajes
  profileSuccessMessage = '';
  profileErrorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';
  
  // Estadísticas
  totalSnippets = 0;
  favoriteSnippets = 0;
  publicSnippets = 0;
  
  // Tabs
  activeTab: 'profile' | 'password' | 'stats' = 'profile';

  constructor(
    private authService: AuthService,
    private snippetService: SnippetService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]]
    });
    
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    
    this.loadProfile();
    this.loadStats();
  }

  loadProfile(): void {
    this.isLoading = true;
    
    this.authService.getProfile().pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.user = response.user;
        this.profileForm.patchValue({
          username: response.user.username,
          email: response.user.email
        });
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        if (error.status === 401) {
          this.authService.logout();
        }
      }
    });
  }

  loadStats(): void {
    this.isLoadingStats = true;
    
    this.snippetService.getMySnippets({ limit: 1000 }).pipe(
      finalize(() => {
        this.isLoadingStats = false;
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
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    this.profileSuccessMessage = '';
    this.profileErrorMessage = '';

    const formValue = this.profileForm.value;
    const updateData: { username?: string; email?: string } = {};
    
    if (formValue.username !== this.user?.username) {
      updateData.username = formValue.username.trim();
    }
    if (formValue.email !== this.user?.email) {
      updateData.email = formValue.email.trim();
    }

    if (Object.keys(updateData).length === 0) {
      this.profileErrorMessage = 'No hay cambios para guardar';
      this.isLoading = false;
      return;
    }

    this.authService.updateProfile(updateData).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.profileSuccessMessage = response.message;
        this.user = response.user;
        setTimeout(() => {
          this.profileSuccessMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (error) => {
        console.error('Error al actualizar perfil:', error);
        if (error.status === 409) {
          this.profileErrorMessage = error.error?.error || 'El email o nombre de usuario ya está en uso';
        } else if (error.status === 400) {
          this.profileErrorMessage = error.error?.error || 'Error de validación';
        } else {
          this.profileErrorMessage = error.error?.error || 'Error al actualizar el perfil';
        }
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isLoading = true;
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    const formValue = this.passwordForm.value;

    this.authService.changePassword(formValue.currentPassword, formValue.newPassword).pipe(
      finalize(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.passwordSuccessMessage = response.message;
        this.passwordForm.reset();
        setTimeout(() => {
          this.passwordSuccessMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        if (error.status === 401) {
          this.passwordErrorMessage = 'La contraseña actual es incorrecta';
        } else if (error.status === 400) {
          this.passwordErrorMessage = error.error?.error || 'Error de validación';
        } else {
          this.passwordErrorMessage = error.error?.error || 'Error al cambiar la contraseña';
        }
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  get username() {
    return this.profileForm.get('username');
  }

  get email() {
    return this.profileForm.get('email');
  }

  get currentPassword() {
    return this.passwordForm.get('currentPassword');
  }

  get newPassword() {
    return this.passwordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.passwordForm.get('confirmPassword');
  }
}