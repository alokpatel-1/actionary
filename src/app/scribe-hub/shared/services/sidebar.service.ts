import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  readonly isSidebarCollapsed = signal<boolean>(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(val => !val);
  }

  hideSidebar(): void {
    this.isSidebarCollapsed.set(true);
  }

  showSidebar(): void {
    this.isSidebarCollapsed.set(false);
  }
}
