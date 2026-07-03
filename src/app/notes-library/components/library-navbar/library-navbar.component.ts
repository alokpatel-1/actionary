import { Component, EventEmitter, inject, Input, Output, signal, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';

@Component({
  selector: 'app-library-navbar',
  template: `
    <nav class="medium-nav">
      <div class="nav-left">
        <a routerLink="/library" class="brand-logo">
          <span class="brand-icon">📝</span>
          <span class="brand-text">Scribe</span>
        </a>
      </div>

      <div class="nav-center" *ngIf="showSearch">
        <div class="search-wrapper">
          <i class="pi pi-search search-icon"></i>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search" 
            [ngModel]="searchQuery" 
            (ngModelChange)="onSearchChange($event)">
        </div>
      </div>

      <div class="nav-right">
        <div class="avatar-circle-wrapper" (click)="toggleProfileMenu()">
          <div class="avatar-circle">
            {{ userInitial() }}
          </div>
          
          <div class="profile-dropdown" *ngIf="showProfileMenu()">
            <div class="popover-user-details" style="padding: 0.75rem 1rem; border-bottom: 1px solid #eaeaea; margin-bottom: 0;">
              <div style="font-weight: 600; font-size: 0.9rem; color: #292929;">{{ userName() }}</div>
              <div style="font-size: 0.75rem; color: #757575;">{{ userEmail() }}</div>
            </div>
            <div class="dropdown-item" (click)="$event.stopPropagation(); goToEditorView()">
              <i class="pi pi-file-edit"></i> Publish content
            </div>
            <div class="dropdown-item logout" (click)="$event.stopPropagation(); logout()">
              <i class="pi pi-sign-out"></i> Logout
            </div>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .medium-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 65px;
      padding: 0 1.5rem;
      background: #fff;
      border-bottom: 1px solid #f2f2f2;
      position: sticky;
      top: 0;
      z-index: 100;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .nav-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      min-width: 200px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #292929;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      font-family: source-serif-pro, Georgia, serif;
    }

    .nav-center {
      flex: 1;
      display: flex;
      justify-content: center;
      max-width: 600px;
    }

    .search-wrapper {
      position: relative;
      width: 100%;
      max-width: 400px;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #757575;
      font-size: 0.9rem;
    }

    .search-input {
      width: 100%;
      padding: 0.65rem 1rem 0.65rem 2.5rem;
      font-size: 0.95rem;
      background: #f9f9f9;
      border: none;
      border-radius: 20px;
      outline: none;
      transition: background 0.2s;
      color: #292929;
    }

    .search-input:focus {
      background: #fff;
      box-shadow: 0 0 0 1px #e0e0e0;
    }
    
    .search-input::placeholder {
      color: #757575;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      min-width: 200px;
      justify-content: flex-end;
    }

    .write-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #6b6b6b;
      cursor: pointer;
      padding: 0;
      transition: color 0.2s;
    }

    .write-btn:hover {
      color: #292929;
    }

    .avatar-circle-wrapper {
      position: relative;
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #6366F1;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      user-select: none;
    }

    .profile-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: white;
      border: 1px solid #eaeaea;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      min-width: 200px;
      overflow: hidden;
      z-index: 200;
    }

    .dropdown-item {
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      font-size: 0.9rem;
      color: #292929;
      transition: background 0.2s;
    }

    .dropdown-item:hover {
      background: #f9f9f9;
    }

    .dropdown-item.logout {
      color: #d32f2f;
      border-top: 1px solid #eaeaea;
    }

    .dropdown-item i {
      font-size: 1.1rem;
    }

    @media (max-width: 768px) {
      .search-wrapper {
        display: none;
      }
      .brand-text {
        display: none;
      }
      .nav-left, .nav-right {
        min-width: auto;
      }
    }
  `],
  standalone: false
})
export class LibraryNavbarComponent {
  @Input() showSearch = true;
  @Input() searchQuery = '';
  @Input() noteIdToEdit?: string;
  
  @Output() searchChange = new EventEmitter<string>();
  @Output() toggleSidebar = new EventEmitter<void>();

  private router = inject(Router);
  private authService = inject(FirebaseAuthService);
  private eRef = inject(ElementRef);

  userInitial = signal('A');
  userName = signal('User');
  userEmail = signal('');
  showProfileMenu = signal(false);

  constructor() {
    if (typeof sessionStorage !== 'undefined') {
      let name = sessionStorage.getItem('displayName');
      let email = sessionStorage.getItem('email');
      
      if (name) name = name.replace(/"/g, '');
      if (email) email = email.replace(/"/g, '');

      if (name && name.trim().length > 0) {
        this.userName.set(name.trim());
        this.userInitial.set(name.trim().charAt(0).toUpperCase());
      } else if (email && email.trim().length > 0) {
        this.userName.set(email.trim().split('@')[0]);
        this.userInitial.set(email.trim().charAt(0).toUpperCase());
      }
      
      if (email && email.trim().length > 0) {
        this.userEmail.set(email.trim());
      }
    }
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showProfileMenu.set(false);
    }
  }

  onSearchChange(value: string) {
    this.searchQuery = value;
    this.searchChange.emit(value);
  }

  goToEditor() {
    if (this.noteIdToEdit) {
      this.router.navigate(['/notes/edit', this.noteIdToEdit]);
    } else {
      this.router.navigate(['/notes/create']);
    }
  }

  toggleProfileMenu() {
    this.showProfileMenu.set(!this.showProfileMenu());
  }

  goToEditorView() {
    this.showProfileMenu.set(false);
    if (this.noteIdToEdit) {
      this.router.navigate(['/notes/edit', this.noteIdToEdit]);
    } else {
      this.router.navigate(['/notes']);
    }
  }

  logout() {
    this.showProfileMenu.set(false);
    this.authService.signOut().then(() => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      this.router.navigate(['/home/auth/login']);
    });
  }
}
