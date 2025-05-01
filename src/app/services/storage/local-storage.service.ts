import { Injectable } from '@angular/core';

const TOKEN_KEY = 'expvi_token';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  setToken(token: string): void {
    console.log(TOKEN_KEY,token);
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  clearToken(): void {
  //  localStorage.removeItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}