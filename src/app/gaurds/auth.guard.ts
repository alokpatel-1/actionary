import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { ActionaryUtilService } from '../services/actionary-util.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);
  const utilService = inject(ActionaryUtilService);

  return user(auth).pipe(
    take(1),
    map((firebaseUser) => {
      const hasSession =
        typeof sessionStorage !== 'undefined' &&
        (sessionStorage.getItem('email') || sessionStorage.getItem('localId') || sessionStorage.getItem('token'));
      const allowed = !!firebaseUser || !!hasSession;

      if (!allowed) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
        utilService.showError('Your session has expired. Please log in again to access your notes.');
        router.navigate(['/login']);
      }
      return allowed;
    })
  );
};
