// Trigger recompile
import { Component, EventEmitter, inject, Input, Output, signal, HostListener, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';

@Component({
  selector: 'app-library-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <nav class="medium-nav">
      <div class="nav-left">
        <button class="nav-toggle-btn" *ngIf="showToggle" (click)="onToggleClick()" title="Toggle Sidebar">
          <i class="pi pi-bars"></i>
        </button>
        <a routerLink="/library" class="brand-logo" *ngIf="showBrand">
          <span class="brand-icon">📝</span>
          <span class="brand-text">Scribe</span>
        </a>
      </div>

      <div class="nav-center">
        <div class="search-wrapper" *ngIf="showSearch">
          <i class="pi pi-search search-icon"></i>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search" 
            [ngModel]="searchQuery" 
            (ngModelChange)="onSearchChange($event)">
        </div>
        <!-- Projected editor status (Saving..., word counts, etc.) -->
        <ng-content select="[editor-status]"></ng-content>
      </div>

      <div class="nav-right">
        <!-- Projected editor actions (Save, Edit, manual sync buttons) -->
        <ng-content select="[editor-actions]"></ng-content>

        <!-- Direct switch buttons inside the top bar -->
        <button class="nav-switch-btn" *ngIf="isInEditor()" (click)="goToLibraryView()" title="Read content (Library)">
          <i class="pi pi-book"></i>
          <span>Library</span>
        </button>
        <button class="nav-switch-btn" *ngIf="!isInEditor()" (click)="goToEditorView()" title="Write notes (Editor)">
          <i class="pi pi-file-edit"></i>
          <span>Write Notes</span>
        </button>

        <!-- Theme Toggle Button -->
        <button class="theme-toggle-btn" (click)="toggleDarkMode()" [title]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <i class="pi" [ngClass]="isDarkMode() ? 'pi-sun' : 'pi-moon'"></i>
        </button>

        <!-- Premium User Profile Widget -->
        <div class="user-profile-widget" 
             (click)="toggleProfileMenu()" 
             [title]="userEmail() ? userName() + ' (' + userEmail() + ')' : userName()">
          <div class="widget-avatar">
            {{ userInitial() }}
          </div>
          <div class="widget-info">
            <span class="widget-name">{{ userName() }}</span>
          </div>
          <i class="pi pi-selector widget-chevron"></i>

          <!-- Dropdown Popover Menu -->
          <div class="profile-dropdown" *ngIf="showProfileMenu()" (click)="$event.stopPropagation()">
            <div class="popover-user-details">
              <div class="popover-name">{{ userName() }}</div>
              <div class="popover-email" *ngIf="userEmail()">{{ userEmail() }}</div>
            </div>
            <div class="dropdown-item logout" (click)="logout()">
              <i class="pi pi-sign-out"></i>
              <span>Logout</span>
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
      padding: 0 2rem;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      position: sticky;
      top: 0;
      z-index: 100;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      transition: background 0.3s, border-color 0.3s;
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

    .nav-toggle-btn {
      background: none;
      border: none;
      font-size: 1.15rem;
      color: #6b6b6b;
      cursor: pointer;
      padding: 0.35rem;
      margin-right: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: background 0.15s, color 0.15s;
    }

    .nav-toggle-btn:hover {
      background: #f2f2f2;
      color: #292929;
    }

    .theme-toggle-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: transparent;
      border: 1px solid transparent;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 1rem;
    }

    .theme-toggle-btn:hover {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.06);
      color: #0f172a;
      transform: translateY(-1px);
    }

    .nav-switch-btn {
      height: 32px;
      padding: 0 0.8rem;
      border-radius: 16px;
      background: transparent;
      border: 1px solid transparent;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;

      span {
        font-size: 0.8rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    }

    .nav-switch-btn:hover {
      background: rgba(79, 70, 229, 0.05);
      border-color: rgba(79, 70, 229, 0.15);
      color: #4f46e5;
      transform: translateY(-1px);
    }

    .nav-logout-btn {
      height: 32px;
      padding: 0 0.8rem;
      border-radius: 16px;
      background: transparent;
      border: 1px solid transparent;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;

      span {
        font-size: 0.8rem;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
    }

    .nav-logout-btn:hover {
      background: rgba(239, 68, 68, 0.04);
      border-color: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      transform: translateY(-1px);
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

    .user-profile-widget {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.3rem 0.75rem 0.3rem 0.5rem;
      border-radius: 20px;
      background: transparent;
      border: 1px solid transparent;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .user-profile-widget:hover {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .widget-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .widget-info {
      display: flex;
      flex-direction: column;
      text-align: left;
      line-height: 1.15;
    }

    .widget-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #292929;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .widget-chevron {
      font-size: 0.75rem;
      color: #888;
      margin-left: 0.1rem;
    }

    .profile-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      min-width: 200px;
      overflow: hidden;
      z-index: 250;
      animation: popoverFadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes popoverFadeIn {
      from { opacity: 0; transform: translateY(4px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .popover-user-details {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .popover-name {
      font-weight: 600;
      font-size: 0.88rem;
      color: #0f172a;
    }

    .popover-email {
      font-size: 0.72rem;
      color: #64748b;
    }

    .dropdown-item {
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.82rem;
      color: #334155;
      transition: background 0.15s, color 0.15s;

      i {
        font-size: 0.9rem;
      }
    }

    .dropdown-item:hover {
      background: rgba(0, 0, 0, 0.03);
      color: #0f172a;
    }

    .dropdown-item.logout {
      color: #ef4444;
      border-top: 1px solid rgba(0, 0, 0, 0.05);

      &:hover {
        background: rgba(239, 68, 68, 0.04);
        color: #ef4444;
      }
    }

    :host-context([data-theme="dark"]) .nav-toggle-btn {
      color: #b0b0b0;
    }
    :host-context([data-theme="dark"]) .nav-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #e8e8e8;
    }

    :host-context([data-theme="dark"]) .theme-toggle-btn,
    :host-context([data-theme="dark"]) .nav-switch-btn {
      color: #94a3b8;
    }

    :host-context([data-theme="dark"]) .theme-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.1);
      color: #f8fafc;
    }

    :host-context([data-theme="dark"]) .nav-switch-btn:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.1);
      color: #818cf8;
    }

    :host-context([data-theme="dark"]) .medium-nav {
      background: rgba(15, 15, 15, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    :host-context([data-theme="dark"]) .brand-logo {
      color: #e8e8e8;
    }
    :host-context([data-theme="dark"]) .search-input {
      background: #222;
      color: #e8e8e8;
    }
    :host-context([data-theme="dark"]) .search-input:focus {
      background: #1e1e1e;
      box-shadow: 0 0 0 1px #444;
    }
    :host-context([data-theme="dark"]) .user-profile-widget {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
    }
    :host-context([data-theme="dark"]) .user-profile-widget:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.15);
    }
    :host-context([data-theme="dark"]) .widget-name {
      color: #e8e8e8;
    }
    :host-context([data-theme="dark"]) .widget-role {
      color: #888;
    }
    :host-context([data-theme="dark"]) .widget-chevron {
      color: #666;
    }

    :host-context([data-theme="dark"]) .profile-dropdown {
      background: rgba(26, 26, 26, 0.95);
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
    }

    :host-context([data-theme="dark"]) .popover-user-details {
      border-bottom-color: rgba(255, 255, 255, 0.06);
    }

    :host-context([data-theme="dark"]) .popover-name {
      color: #f8fafc;
    }

    :host-context([data-theme="dark"]) .popover-email {
      color: #94a3b8;
    }

    :host-context([data-theme="dark"]) .dropdown-item {
      color: #cbd5e1;
    }

    :host-context([data-theme="dark"]) .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #f8fafc;
    }

    :host-context([data-theme="dark"]) .dropdown-item.logout {
      border-top-color: rgba(255, 255, 255, 0.06);

      &:hover {
        background: rgba(239, 68, 68, 0.08);
        color: #fca5a5;
      }
    }

    @media (max-width: 768px) {
      .search-wrapper {
        display: none;
      }
      .brand-text {
        display: none;
      }
    }
  `],
})
export class LibraryNavbarComponent {
  @Input() showSearch = true;
  @Input() showBrand = true;
  @Input() showToggle = false;
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
  isDarkMode = signal(typeof localStorage !== 'undefined' && localStorage.getItem('scribe-theme') === 'dark');

  constructor() {
    if (typeof sessionStorage !== 'undefined') {
      const userStr = sessionStorage.getItem('user');
      const emailVal = sessionStorage.getItem('email');
      const displayNameVal = sessionStorage.getItem('displayName');

      let name = 'User';
      let email = '';

      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          name = userObj.displayName || userObj.username || displayNameVal || 'User';
          email = userObj.email || (emailVal ? emailVal.replace(/"/g, '') : '');
        } catch (e) {
          name = displayNameVal || 'User';
          email = emailVal ? emailVal.replace(/"/g, '') : '';
        }
      } else {
        name = displayNameVal || 'User';
        email = emailVal ? emailVal.replace(/"/g, '') : '';
      }

      if (name) name = name.replace(/"/g, '').trim();
      if (email) email = email.replace(/"/g, '').trim();

      if (name && name.length > 0) {
        this.userName.set(name);
        this.userInitial.set(name.charAt(0).toUpperCase());
      } else if (email && email.length > 0) {
        this.userName.set(email.split('@')[0]);
        this.userInitial.set(email.charAt(0).toUpperCase());
      }
      
      if (email && email.length > 0) {
        this.userEmail.set(email);
      }
    }
    
    // Apply theme on load
    this.applyTheme(this.isDarkMode());
  }

  toggleDarkMode() {
    const nextVal = !this.isDarkMode();
    this.isDarkMode.set(nextVal);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('scribe-theme', nextVal ? 'dark' : 'light');
    }
    this.applyTheme(nextVal);
  }

  private applyTheme(dark: boolean) {
    if (dark) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
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

  onToggleClick() {
    this.toggleSidebar.emit();
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

  goToLibraryView() {
    this.showProfileMenu.set(false);
    this.router.navigate(['/library']);
  }

  isInEditor(): boolean {
    return this.router.url.startsWith('/notes');
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
