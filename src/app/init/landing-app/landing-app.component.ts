import { Component, inject, OnInit } from '@angular/core';
import { FirebaseAuthService } from '../../firebase/firebase-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-app',
  standalone: false,
  templateUrl: './landing-app.component.html',
  styleUrl: './landing-app.component.scss'
})
export class LandingAppComponent implements OnInit {
  readonly firebaseService = inject(FirebaseAuthService);
  readonly router = inject(Router);


  ngOnInit(): void {
    if (JSON.parse(sessionStorage.getItem('email')!)) {
      this.router.navigate(['/user']);
    }
    this.firebaseService.user$.subscribe(user => {
      if (user) {
        this.firebaseService.currentUserSig.set(user);
        this.firebaseService.isUserLoggedIn.set(true);
      }
    })
  };

  signOut() {
    this.firebaseService.signOut().then(() => {
      this.firebaseService.isUserLoggedIn.set(false);
      sessionStorage.clear();
      localStorage.clear();
    }).catch(err => {
      this.firebaseService.isUserLoggedIn.set(false);
    })


  }
}
