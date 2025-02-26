import { Component, inject, ViewChild } from '@angular/core';
import { ImportsModule } from '../../imports';
import { Popover } from 'primeng/popover';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ActionaryUtilService } from '../../services/actionary-util.service';
import { FirebaseAuthService } from '../../firebase/firebase-auth.service';
import { Router } from '@angular/router';

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
  @ViewChild('userPanelRef') userPanelRef!: Popover;
  readonly utilService = inject(ActionaryUtilService);
  readonly firebaseService = inject(FirebaseAuthService);
  readonly router = inject(Router);

  toggleSidebar() {
    this.utilService.isSideBarCloser.set(!this.utilService.isSideBarCloser());
  }

  members = [
    { name: 'Sign Out', email: JSON.parse(sessionStorage.getItem('email')!), value: 'signout' },
  ];

  signOut() {
    this.firebaseService.signOut().then(() => {
      this.firebaseService.isUserLoggedIn.set(false);
      sessionStorage.clear();
      localStorage.clear();
      this.router.navigate(['/']);
    }).catch(err => {
      this.firebaseService.isUserLoggedIn.set(false);
    })
  }

  toggle(event: MouseEvent) {
    this.userPanelRef.toggle(event);
  }
}
