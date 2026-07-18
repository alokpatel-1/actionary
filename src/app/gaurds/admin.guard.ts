import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { ActionaryUtilService } from '../services/actionary-util.service';

export const ADMIN_EMAIL = 'alokpatel863@gmail.com';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(Auth);
  const utilService = inject(ActionaryUtilService);

  return user(auth).pipe(
    take(1),
    map((firebaseUser) => {
      let email = firebaseUser?.email || '';
      if (!email && typeof sessionStorage !== 'undefined') {
        const rawEmail = sessionStorage.getItem('email') || '';
        email = rawEmail.replace(/"/g, '').trim();
      }

      const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (!isAdmin) {
        utilService.showError(`Access denied. Admin privileges required (${ADMIN_EMAIL}).`);
        router.navigate(['/library']);
        return false;
      }
      return true;
    })
  );
};
