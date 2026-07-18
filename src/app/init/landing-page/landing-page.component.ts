import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../firebase/firebase-auth.service';

@Component({
  selector: 'app-landing-page',
  standalone: false,
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  public firebaseService = inject(FirebaseAuthService);
  public router = inject(Router);

  activeTab = signal<'editor' | 'search' | 'sync' | 'organization'>('editor');
  demoSearchQuery = signal('redis');

  // Simulated live search results for Cmd+K demo
  demoSearchResults = computed(() => {
    const q = this.demoSearchQuery().toLowerCase().trim();
    const all = [
      { title: 'Redis In-Memory Architecture & Persistence', tag: '#backend', folder: 'Database', date: '2 hours ago' },
      { title: 'RabbitMQ vs Kafka Queue Comparison', tag: '#architecture', folder: 'Distributed Systems', date: '1 day ago' },
      { title: 'Closure & Lexical Scope in JavaScript', tag: '#js', folder: 'Frontend', date: '3 days ago' },
      { title: 'TypeScript 5.4 Feature Summary', tag: '#typescript', folder: 'Frontend', date: '5 days ago' }
    ];
    if (!q) return all;
    return all.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.tag.toLowerCase().includes(q) ||
      item.folder.toLowerCase().includes(q)
    );
  });

  selectTab(tab: 'editor' | 'search' | 'sync' | 'organization'): void {
    this.activeTab.set(tab);
  }

  scrollToSection(id: string): void {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  navigateToApp(): void {
    if (this.firebaseService.isUserLoggedIn()) {
      this.router.navigate(['/new/reader/feed']);
    } else {
      this.router.navigate(['/new/auth/login']);
    }
  }

  navigateToLogin(): void {
    this.router.navigate(['/new/auth/login']);
  }

  navigateToSignup(): void {
    this.router.navigate(['/new/auth/signup']);
  }

  navigateToReader(): void {
    this.router.navigate(['/new/reader/feed']);
  }
}
