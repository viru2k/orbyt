import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

// DTOs and Interfaces
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  company?: string;
  country?: string;
  planSlug: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}

export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  popular?: boolean;
  maxClients: number;
  maxInvoices: number;
}

export interface PaymentSetupResponse {
  provider: 'redsys' | 'stripe';
  setupIntent: {
    id: string;
    clientSecret?: string; // Stripe
    url?: string; // Redsys
    parameters?: Record<string, string>; // Redsys
  };
}

export interface DashboardStats {
  subscription: {
    id: string;
    status: 'active' | 'trial' | 'cancelled' | 'past_due';
    plan: string;
    nextBilling: string;
    amount: number;
  };
  usage: {
    clients: { current: number; limit: number };
    invoices: { current: number; limit: number };
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer';
  provider: 'redsys' | 'stripe';
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrbitLandingApiService {
  private readonly baseUrl = environment.landingApiUrl;
  private readonly tokenKey = 'orbyt_landing_token';
  
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from token on startup
    const token = this.getToken();
    if (token) {
      this.loadCurrentUser();
    }
  }

  // ===== AUTHENTICATION =====
  register(registerData: RegisterDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/register`, registerData);
  }

  login(loginData: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/auth/login`, loginData);
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/verify-email?token=${token}`);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/reset-password`, { token, password });
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/me`);
  }

  // ===== TOKEN MANAGEMENT =====
  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadCurrentUser(): void {
    this.getCurrentUser().subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.removeToken()
    });
  }

  // ===== PUBLIC LANDING APIS =====
  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.baseUrl}/landing/plans`);
  }

  getFeaturedPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(`${this.baseUrl}/landing/plans/featured`);
  }

  submitLead(leadData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/landing/leads`, leadData);
  }

  subscribeNewsletter(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/landing/newsletter`, { email });
  }

  getLandingStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/landing/stats`);
  }

  // ===== PAYMENT MANAGEMENT =====
  getPreferredPaymentProvider(country: string = 'ES'): 'redsys' | 'stripe' {
    // Spain uses Redsys, others use Stripe
    return country === 'ES' ? 'redsys' : 'stripe';
  }

  createPaymentSetup(provider: 'redsys' | 'stripe', planId?: string): Observable<PaymentSetupResponse> {
    return this.http.post<PaymentSetupResponse>(`${this.baseUrl}/subscriptions/create`, {
      provider,
      planId
    });
  }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.baseUrl}/subscriptions/payment-methods`);
  }

  updateDefaultPaymentMethod(methodId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/subscriptions/payment-methods/${methodId}/default`, {});
  }

  deletePaymentMethod(methodId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/subscriptions/payment-methods/${methodId}`);
  }

  // ===== SUBSCRIPTION MANAGEMENT =====
  getCurrentSubscription(): Observable<any> {
    return this.http.get(`${this.baseUrl}/subscriptions/current`);
  }

  upgradeSubscription(planId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/subscriptions/upgrade`, { planId });
  }

  cancelSubscription(): Observable<any> {
    return this.http.put(`${this.baseUrl}/subscriptions/cancel`, {});
  }

  reactivateSubscription(): Observable<any> {
    return this.http.put(`${this.baseUrl}/subscriptions/reactivate`, {});
  }

  getSubscriptionHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subscriptions/history`);
  }

  getUsageStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/subscriptions/usage`);
  }

  // ===== DASHBOARD =====
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
  }

  getRecentActivity(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/dashboard/recent-activity`);
  }

  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/dashboard/notifications`);
  }

  getOnboardingProgress(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/onboarding-progress`);
  }

  // ===== HEALTH CHECK =====
  getHealthStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // ===== UTILITY METHODS =====
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      await this.getHealthStatus().toPromise();
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }

  // Format prices for display
  formatPrice(price: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  // Check if trial is expiring soon
  isTrialExpiringSoon(subscription: any): boolean {
    if (subscription.status !== 'trial') return false;
    
    const trialEnd = new Date(subscription.nextBilling);
    const now = new Date();
    const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysLeft <= 3;
  }
}