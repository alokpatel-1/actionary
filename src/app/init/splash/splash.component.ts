import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { take } from 'rxjs/operators';

const SPLASH_MIN_MS = 1200;

@Component({
  selector: 'app-splash',
  standalone: false,
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss'
})
export class SplashComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(Auth);

  ngOnInit(): void {
    setTimeout(() => {
      user(this.auth)
        .pipe(take(1))
        .subscribe((firebaseUser) => {
          const isLoggedIn = !!(
            firebaseUser ||
            (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('email'))
          );
          if (isLoggedIn) {
            this.router.navigate(['/expenses/list']);
          } else {
            this.router.navigate(['/home/auth/login']);
          }
        });
    }, SPLASH_MIN_MS);
  }
}
