// Trigger recompile
import { Component, EventEmitter, inject, Input, Output, signal, HostListener, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';
import { NoteService } from '../../../study-notes/services/note.service';
import { NoteIdbService } from '../../../study-notes/services/note-idb.service';
import { Note } from '../../../study-notes/models/note.model';
import { forkJoin, from } from 'rxjs';

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
        <button class="nav-switch-btn" *ngIf="isInEditor()" (click)="goToLibraryView()" title="Read content (Read Mode)">
          <i class="pi pi-book"></i>
          <span>Read Mode</span>
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
            <div class="dropdown-item archive" *ngIf="isInEditor()" (click)="openArchiveModal()">
              <i class="pi pi-trash"></i>
              <span>Trash / Archive</span>
            </div>
            <div class="dropdown-item logout" (click)="logout()">
              <i class="pi pi-sign-out"></i>
              <span>Logout</span>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Archive/Trash Sheet Modal -->
    <div class="modal-backdrop" *ngIf="showArchiveModal()" (click)="showArchiveModal.set(false)"></div>
    <div class="archive-editor-modal" *ngIf="showArchiveModal()">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <i [class]="archiveActiveTab() === 'deleted' ? 'pi pi-trash' : 'pi pi-file'" 
             [style.color]="archiveActiveTab() === 'deleted' ? '#ef4444' : '#6366f1'" 
             style="font-size: 1.15rem;"></i>
          <h3>{{ archiveActiveTab() === 'deleted' ? 'Trash & Archive' : 'Active Notes' }}</h3>
        </div>

        <div class="header-right">
          <label class="select-all-label" *ngIf="archiveActiveTab() === 'deleted' ? archivedNotes().length > 0 : activeNotesList().length > 0">
            <input type="checkbox" 
                   [checked]="selectedNoteIds().length === (archiveActiveTab() === 'deleted' ? archivedNotes().length : activeNotesList().length) && (archiveActiveTab() === 'deleted' ? archivedNotes().length : activeNotesList().length) > 0"
                   (change)="toggleSelectAll()">
            <span>Select All</span>
          </label>

          <button class="modal-toggle-view-btn text-labeled" 
                  (click)="toggleActiveTab()" 
                  [title]="archiveActiveTab() === 'deleted' ? 'View Active Notes' : 'View Trash & Archive'">
            <i [class]="archiveActiveTab() === 'deleted' ? 'pi pi-file' : 'pi pi-trash'"></i>
            <span>{{ archiveActiveTab() === 'deleted' ? 'View Active Notes' : 'View Trash / Archive' }}</span>
          </button>

          <button class="modal-close" (click)="showArchiveModal.set(false)">
            <i class="pi pi-times"></i>
          </button>
        </div>
      </div>

      <!-- Floating Selection Action Bar -->
      <div class="floating-action-bar" *ngIf="selectedNoteIds().length > 0">
        <span class="selected-count-badge">
          <i class="pi pi-check-circle"></i>
          {{ selectedNoteIds().length }} selected
        </span>

        <div class="action-divider"></div>

        <div class="action-buttons">
          <button class="action-btn restore" 
                  *ngIf="archiveActiveTab() === 'deleted'" 
                  (click)="restoreSelected()">
            <i class="pi pi-refresh"></i> Restore
          </button>
          <button class="action-btn delete-permanently" 
                  *ngIf="archiveActiveTab() === 'deleted'" 
                  (click)="deleteSelectedPermanently()">
            <i class="pi pi-trash"></i> Permanent Delete
          </button>
          <button class="action-btn archive-active" 
                  *ngIf="archiveActiveTab() === 'active'" 
                  (click)="archiveSelected()">
            <i class="pi pi-trash"></i> Move to Trash
          </button>
        </div>
      </div>

      <!-- Body / List -->
      <div class="modal-body">
        <!-- Trash Tab List -->
        <div class="archive-list" *ngIf="archiveActiveTab() === 'deleted' && archivedNotes().length > 0">
          <div class="archive-item" 
               *ngFor="let note of archivedNotes()" 
               [class.selected]="selectedNoteIds().includes(note.id)"
               (click)="toggleSelectNote(note.id)">
            
            <input type="checkbox" 
                   class="item-checkbox" 
                   [checked]="selectedNoteIds().includes(note.id)"
                   (click)="$event.stopPropagation(); toggleSelectNote(note.id)">
            
            <div class="item-details">
              <h4 class="item-title">{{ note.title || 'Untitled Note' }}</h4>
              <p class="item-preview">{{ getNotePreview(note.content) }}</p>
              <span class="item-date">Deleted on {{ note.updatedAt | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <div class="archive-empty" *ngIf="archiveActiveTab() === 'deleted' && archivedNotes().length === 0">
          <i class="pi pi-inbox" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
          <p>Your trash is empty!</p>
        </div>

        <!-- Active Notes Tab List -->
        <div class="archive-list" *ngIf="archiveActiveTab() === 'active' && activeNotesList().length > 0">
          <div class="archive-item" 
               *ngFor="let note of activeNotesList()" 
               [class.selected]="selectedNoteIds().includes(note.id)"
               (click)="toggleSelectNote(note.id)">
            
            <input type="checkbox" 
                   class="item-checkbox" 
                   [checked]="selectedNoteIds().includes(note.id)"
                   (click)="$event.stopPropagation(); toggleSelectNote(note.id)">
            
            <div class="item-details">
              <h4 class="item-title">{{ note.title || 'Untitled Note' }}</h4>
              <p class="item-preview">{{ getNotePreview(note.content) }}</p>
              <span class="item-date">Last updated {{ note.updatedAt | date:'medium' }}</span>
            </div>
          </div>
        </div>

        <div class="archive-empty" *ngIf="archiveActiveTab() === 'active' && activeNotesList().length === 0">
          <i class="pi pi-inbox" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.5rem;"></i>
          <p>No active notes found!</p>
        </div>
      </div>
    </div>

    <!-- Custom Delete Confirmation Dialog -->
    <div class="confirm-backdrop" *ngIf="showDeleteConfirm()"></div>
    <div class="confirm-modal" *ngIf="showDeleteConfirm()">
      <div class="confirm-header">
        <i class="pi pi-exclamation-triangle warning-icon"></i>
        <h4>Permanently Delete Notes?</h4>
      </div>
      <div class="confirm-body">
        Are you sure you want to permanently delete these {{ selectedNoteIds().length }} selected note(s)? This action is permanent and cannot be undone.
      </div>
      <div class="confirm-footer">
        <button class="confirm-btn cancel" (click)="showDeleteConfirm.set(false)">Cancel</button>
        <button class="confirm-btn delete" (click)="confirmDeleteSelectedPermanently()">Delete Permanently</button>
      </div>
    </div>
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

    /* ── Archive/Trash Sheet Styles ── */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 600;
      animation: fadeIn 0.2s ease-out;
    }

    .archive-editor-modal {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 0);
      width: 60vw;
      max-width: 60vw;
      height: 80vh;
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      border-left: 1px solid rgba(0, 0, 0, 0.08);
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 24px 24px 0 0;
      box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      z-index: 610;
      animation: bottomSheetSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      padding: 1rem 0;
      font-family: inherit;

      .modal-header {
        padding: 1rem 2.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 72px;
        box-sizing: border-box;

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 0 0 200px;

          h3 {
            margin: 0;
            font-size: 1.15rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.01em;
            white-space: nowrap;
          }
        }

        .header-center {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
        }

        .header-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1.25rem;
          flex: 1.5;
        }

        .modal-close {
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          transition: all 0.2s;
          margin-left: 0.5rem;

          &:hover {
            background: rgba(0, 0, 0, 0.04);
            color: #0f172a;
          }
        }

        .modal-toggle-view-btn.text-labeled {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(99, 102, 241, 0.06);
          border: 1px solid rgba(99, 102, 241, 0.1);
          color: #4f46e5;
          padding: 0.4rem 0.95rem;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-left: 0.5rem;

          &:hover {
            background: #4f46e5;
            color: #fff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
          }

          i {
            font-size: 0.8rem;
          }
        }
      }

      .modal-body {
        flex: 1;
        overflow-y: auto;
      }
    }

    .floating-action-bar {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: #0f172a;
      color: #f8fafc;
      padding: 0.65rem 1.5rem;
      border-radius: 99px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25), 0 1px 3px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 620;
      animation: slideUpFloating 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .selected-count-badge {
      font-size: 0.8rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #e2e8f0;
      white-space: nowrap;

      i {
        color: #818cf8;
        font-size: 0.9rem;
      }
    }

    .action-divider {
      width: 1px;
      height: 18px;
      background: rgba(255, 255, 255, 0.15);
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      white-space: nowrap;
    }

    .action-btn {
      padding: 0.4rem 0.85rem;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 99px;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      transition: all 0.2s;

      &.restore {
        background: #4f46e5;
        color: #fff;

        &:hover {
          background: #4338ca;
        }
      }

      &.delete-permanently {
        background: transparent;
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fca5a5;

        &:hover {
          background: rgba(239, 68, 68, 0.15);
        }
      }

      &.archive-active {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #f8fafc;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      }
    }

    @keyframes slideUpFloating {
      from {
        transform: translate(-50%, 20px);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }

    .unified-toggle-switch {
      cursor: pointer;
      user-select: none;
    }

    .switch-pill {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(0, 0, 0, 0.05);
      padding: 3px;
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.04);
      width: 220px;
      height: 32px;
      box-sizing: border-box;
    }

    .switch-label {
      flex: 1;
      text-align: center;
      font-size: 0.78rem;
      font-weight: 600;
      color: #64748b;
      z-index: 2;
      transition: color 0.25s;
    }

    .switch-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 105px;
      height: 24px;
      background: #fff;
      border-radius: 9px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      z-index: 1;
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .switch-pill.active-mode {
      .switch-knob {
        transform: translateX(109px);
      }
      
      .text-active {
        color: #4f46e5;
      }
      .text-deleted {
        color: #64748b;
      }
    }

    .switch-pill:not(.active-mode) {
      .text-deleted {
        color: #4f46e5;
      }
      .text-active {
        color: #64748b;
      }
    }

    .select-all-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      white-space: nowrap;
    }

    .archive-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.5rem 2.5rem;
    }

    .archive-item {
      display: flex;
      align-items: flex-start;
      gap: 1.15rem;
      background: rgba(0, 0, 0, 0.015);
      border: 1px solid rgba(0, 0, 0, 0.03);
      padding: 1.15rem 1.4rem;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        background: rgba(0, 0, 0, 0.025);
        border-color: rgba(99, 102, 241, 0.15);
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.02);
      }

      &.selected {
        background: rgba(99, 102, 241, 0.02);
        border-color: rgba(99, 102, 241, 0.25);
      }
    }

    .item-checkbox {
      margin-top: 0.25rem;
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-title {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 700;
      color: #0f172a;
    }

    .item-preview {
      margin: 0;
      font-size: 0.8rem;
      color: #64748b;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .item-date {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 0.15rem;
    }

    .archive-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      color: #94a3b8;
      text-align: center;
      gap: 0.5rem;

      p {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 500;
      }
    }

    /* Dark theme overrides */
    :host-context([data-theme="dark"]) .archive-editor-modal {
      background: rgba(26, 26, 26, 0.95);
      border-top-color: rgba(255, 255, 255, 0.08);
      border-left-color: rgba(255, 255, 255, 0.08);
      border-right-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.4);

      .modal-header {
        border-bottom-color: rgba(255, 255, 255, 0.06);

        h3 {
          color: #f8fafc;
        }

        .modal-close {
          color: #94a3b8;
          &:hover {
            background: rgba(255, 255, 255, 0.06);
            color: #f8fafc;
          }
        }

        .modal-toggle-view-btn.text-labeled {
          background: rgba(129, 140, 248, 0.08);
          border-color: rgba(129, 140, 248, 0.15);
          color: #818cf8;

          &:hover {
            background: #818cf8;
            color: #1e1e1e;
            box-shadow: 0 4px 12px rgba(129, 140, 248, 0.25);
          }
        }
      }
    }

    :host-context([data-theme="dark"]) .toggle-switch-container {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.04);
    }

    :host-context([data-theme="dark"]) .toggle-switch-btn {
      color: #94a3b8;

      &:hover {
        color: #f8fafc;
      }

      &.active {
        background: #27272a;
        color: #818cf8;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    }

    :host-context([data-theme="dark"]) .select-all-label {
      color: #cbd5e1;
    }

    :host-context([data-theme="dark"]) .archive-item {
      background: rgba(255, 255, 255, 0.01);
      border-color: rgba(255, 255, 255, 0.04);

      &:hover {
        background: rgba(255, 255, 255, 0.02);
      }

      &.selected {
        background: rgba(129, 140, 248, 0.05);
        border-color: rgba(129, 140, 248, 0.2);
      }
    }

    :host-context([data-theme="dark"]) .item-title {
      color: #f8fafc;
    }

    :host-context([data-theme="dark"]) .item-preview {
      color: #94a3b8;
    }

    :host-context([data-theme="dark"]) .action-btn {
      &.restore {
        background: rgba(129, 140, 248, 0.08);
        border-color: rgba(129, 140, 248, 0.2);
        color: #818cf8;

        &:hover:not(:disabled) {
          background: rgba(129, 140, 248, 0.15);
        }
      }

      &.delete:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .confirm-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 700;
      animation: fadeIn 0.2s ease-out;
    }

    .confirm-modal {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 440px;
      background: #fff;
      border-radius: 20px;
      padding: 1.75rem 2rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      z-index: 710;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      font-family: inherit;
      animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .confirm-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .warning-icon {
        color: #ef4444;
        font-size: 1.5rem;
      }

      h4 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.01em;
      }
    }

    .confirm-body {
      font-size: 0.88rem;
      color: #64748b;
      line-height: 1.5;
    }

    .confirm-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .confirm-btn {
      padding: 0.55rem 1.15rem;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;

      &.cancel {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.08);
        color: #64748b;

        &:hover {
          background: rgba(0, 0, 0, 0.02);
          color: #0f172a;
        }
      }

      &.delete {
        background: #ef4444;
        border: none;
        color: #fff;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);

        &:hover {
          background: #dc2626;
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
        }
      }
    }

    /* Dark theme overrides for confirm modal */
    :host-context([data-theme="dark"]) .confirm-modal {
      background: #1e1e1e;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.55);

      .confirm-header h4 {
        color: #f8fafc;
      }

      .confirm-body {
        color: #94a3b8;
      }

      .confirm-btn.cancel {
        border-color: rgba(255, 255, 255, 0.08);
        color: #94a3b8;

        &:hover {
          background: rgba(255, 255, 255, 0.03);
          color: #f8fafc;
        }
      }
    }

    @keyframes zoomIn {
      from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
      to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }

    @keyframes bottomSheetSlideUp {
      from { transform: translate(-50%, 100%); }
      to { transform: translate(-50%, 0); }
    }

    @media (max-width: 768px) {
      .medium-nav {
        padding: 0 0.75rem;
        height: 56px;
      }

      .nav-left {
        min-width: auto;
        gap: 0.5rem;
      }

      .brand-text {
        display: block !important;
      }

      .search-wrapper {
        display: block !important;
        max-width: 120px;
      }

      .search-input {
        padding: 0.45rem 0.5rem 0.45rem 2rem;
        font-size: 0.8rem;
      }

      .nav-switch-btn {
        display: none !important;
      }

      .widget-info,
      .widget-chevron {
        display: none !important;
      }

      .user-profile-widget {
        padding: 0;
        border: none;
        &:hover {
          background: transparent;
          border-color: transparent;
        }
      }

      .archive-editor-modal {
        width: 92vw;
        max-width: 92vw;
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
  private idbService = inject(NoteIdbService);
  private noteService = inject(NoteService);

  userInitial = signal('A');
  userName = signal('User');
  userEmail = signal('');
  showProfileMenu = signal(false);
  isDarkMode = signal(typeof localStorage !== 'undefined' && localStorage.getItem('scribe-theme') === 'dark');

  showArchiveModal = signal(false);
  archivedNotes = signal<Note[]>([]);
  selectedNoteIds = signal<string[]>([]);
  showDeleteConfirm = signal(false);
  archiveActiveTab = signal<'active' | 'deleted'>('deleted');
  activeNotesList = signal<Note[]>([]);

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

  openArchiveModal(): void {
    this.showProfileMenu.set(false);
    this.showArchiveModal.set(true);
    this.selectedNoteIds.set([]);
    this.archiveActiveTab.set('deleted');
    this.loadArchivedNotes();
  }

  loadArchivedNotes(): void {
    this.idbService.getAllNotes().then(notes => {
      this.archivedNotes.set(notes.filter(n => n.isDeleted));
      this.activeNotesList.set(notes.filter(n => !n.isDeleted));
    });
  }

  toggleSelectNote(noteId: string): void {
    const selected = this.selectedNoteIds();
    if (selected.includes(noteId)) {
      this.selectedNoteIds.set(selected.filter(id => id !== noteId));
    } else {
      this.selectedNoteIds.set([...selected, noteId]);
    }
  }

  toggleSelectAll(): void {
    const list = this.archiveActiveTab() === 'deleted' ? this.archivedNotes() : this.activeNotesList();
    const allIds = list.map(n => n.id);
    if (this.selectedNoteIds().length === allIds.length) {
      this.selectedNoteIds.set([]);
    } else {
      this.selectedNoteIds.set(allIds);
    }
  }

  switchArchiveTab(tab: 'active' | 'deleted'): void {
    this.archiveActiveTab.set(tab);
    this.selectedNoteIds.set([]);
  }

  toggleActiveTab(): void {
    const nextTab = this.archiveActiveTab() === 'deleted' ? 'active' : 'deleted';
    this.switchArchiveTab(nextTab);
  }

  archiveSelected(): void {
    const ids = this.selectedNoteIds();
    if (ids.length === 0) return;

    const updates = ids.map(id => this.noteService.updateNote(id, { isDeleted: true }));
    forkJoin(updates).subscribe(() => {
      this.selectedNoteIds.set([]);
      this.loadArchivedNotes();
      this.noteService.triggerRefresh();
    });
  }

  restoreSelected(): void {
    const ids = this.selectedNoteIds();
    if (ids.length === 0) return;

    const updates = ids.map(id => this.noteService.updateNote(id, { isDeleted: false }));
    forkJoin(updates).subscribe(() => {
      this.selectedNoteIds.set([]);
      this.loadArchivedNotes();
      this.noteService.triggerRefresh();
    });
  }

  deleteSelectedPermanently(): void {
    if (this.selectedNoteIds().length === 0) return;
    this.showDeleteConfirm.set(true);
  }

  confirmDeleteSelectedPermanently(): void {
    this.showDeleteConfirm.set(false);
    const ids = this.selectedNoteIds();
    if (ids.length === 0) return;

    const deletions = ids.map(id => from(this.idbService.deleteNote(id)));
    forkJoin(deletions).subscribe(() => {
      this.selectedNoteIds.set([]);
      this.loadArchivedNotes();
      this.noteService.triggerRefresh();
    });
  }

  getNotePreview(content: string): string {
    if (!content) return 'No content';
    const plain = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return plain || 'No content';
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
