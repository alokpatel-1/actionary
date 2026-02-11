import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);
  return user(auth).pipe(
    take(1),
    map((firebaseUser) => {
      const hasSession =
        typeof sessionStorage !== 'undefined' &&
        (sessionStorage.getItem('email') || sessionStorage.getItem('localId'));
      const allowed = !!firebaseUser || !!hasSession;
      if (!allowed) {
        router.navigate(['/home/auth/login']);
      }
      return allowed;
    })
  );
};
