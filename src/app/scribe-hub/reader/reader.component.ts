import { Component } from '@angular/core';

@Component({
  selector: 'app-reader-shell',
  standalone: false,
  template: `
    <div class="reader-shell-wrapper">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .reader-shell-wrapper {
      min-height: 100vh;
      background-color: #fafafa;
    }
  `]
})
export class ReaderComponent { }
