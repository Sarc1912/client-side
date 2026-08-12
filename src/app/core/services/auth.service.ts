import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, LoginPayload, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'lms_token';
  private readonly USER_KEY = 'lms_user';

  private _currentUser = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(this.loadToken());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  private readonly staffRoles = ['admin', 'manager', 'supervisor', 'senior_manager', 'executive', 'cashier', 'employee'];

  isStaff(): boolean {
    const role = this._currentUser()?.role;
    return !!role && this.staffRoles.includes(role);
  }

  homePath(): string {
    return this.isStaff() ? '/admin/dashboard' : '/client/dashboard';
  }

  hasRole(role: string): boolean {
    return this._currentUser()?.role === role;
  }

  hasAnyRole(roles: string[]): boolean {
    const userRole = this._currentUser()?.role;
    return !!userRole && roles.includes(userRole);
  }

  constructor(private api: ApiService, private router: Router) { }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('auth/login', payload).pipe(
      tap((res) => {
        // the backend returns access_token, wait, let me check backend payload...
        // it returns { user: result, access_token: this.jwtService.sign(payload) }
        // Wait, the client-side expects res.accessToken, but backend gives res.access_token.
        // Let's fix that mapping here.
        this.setSession((res as any).access_token ?? res.accessToken, res.user);
      })
    );
  }

  register(payload: any): Observable<User> {
    return this.api.post<User>('auth/register', payload);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._token.set(token);
    this._currentUser.set(user);
  }

  private loadToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
