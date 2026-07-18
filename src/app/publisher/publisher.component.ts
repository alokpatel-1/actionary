import { Component } from '@angular/core';

@Component({
  selector: 'app-publisher-shell',
  standalone: false,
  template: `
    <div class="publisher-shell-wrapper">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .publisher-shell-wrapper {
      min-height: 100vh;
      background-color: #fafafa;
    }
  `]
})
export class PublisherComponent { }
