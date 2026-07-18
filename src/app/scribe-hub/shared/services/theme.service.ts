import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<AppTheme>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  toggleTheme(): void {
    const next = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('scribe_app_theme', theme);
    }
  }

  private getInitialTheme(): AppTheme {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('scribe_app_theme') as AppTheme;
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  }

  private applyTheme(theme: AppTheme): void {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-theme');
      } else {
        document.body.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-theme');
      }
    }
  }
}
