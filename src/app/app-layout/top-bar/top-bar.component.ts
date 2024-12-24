import { Component, inject, ViewChild } from '@angular/core';
import { ImportsModule } from '../../imports';
import { Popover } from 'primeng/popover';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ActionaryUtilService } from '../../services/actionary-util.service';

@Component({
  selector: 'app-top-bar',
  imports: [ImportsModule],
  standalone: true,
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
  animations: [
    trigger('openClose', [
      state('open', style({
        height: '200px',
        opacity: 1,
      })),
      state('closed', style({
        height: '100px',
        opacity: 0.5,
      })),
      transition('open <=> closed', [
        animate('0.3s')
      ]),
    ]),
  ],
})
export class TopBarComponent {
  readonly utilService = inject(ActionaryUtilService);

  toggleSidebar() {
    console.log('@ jahshd ', this.utilService.isSideBarCloser());

    this.utilService.isSideBarCloser.set(!this.utilService.isSideBarCloser());
  }
}
