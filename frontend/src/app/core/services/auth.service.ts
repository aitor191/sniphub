import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { LoginRequest, RegisterRequest, AuthResponse, RegisterResponse,User } from '../../../shared/interfaces/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register', data).pipe(
      tap(response => {
        // Guardar el usuario (sin token, ya que el registro no devuelve token)
        // El usuario deberá hacer login después del registro
        this.currentUserSubject.next(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getProfile(): Observable<{ user: User }> {
    return this.api.get<{ user: User }>('/auth/profile');
  }
}