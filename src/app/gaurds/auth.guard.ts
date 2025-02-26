import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = sessionStorage.getItem('email');

  if (!token?.length) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
