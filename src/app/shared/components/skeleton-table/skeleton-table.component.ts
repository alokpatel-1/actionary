import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-table',
  standalone: false,
  template: `
    <div class="skeleton-table">
      <div class="skeleton-row" *ngFor="let i of rowsArray">
        <div class="skeleton-cell" *ngFor="let j of colsArray"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-table {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
    }
    .skeleton-row {
      display: flex;
      gap: 1rem;
      width: 100%;
      height: 48px;
    }
    .skeleton-cell {
      flex: 1;
      height: 100%;
      background: linear-gradient(90deg, var(--surface-hover) 25%, var(--surface-ground) 50%, var(--surface-hover) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `]
})
export class SkeletonTableComponent {
  @Input() rows: number = 5;
  @Input() cols: number = 4;

  get rowsArray() {
    return Array(this.rows).fill(0);
  }

  get colsArray() {
    return Array(this.cols).fill(0);
  }
}
