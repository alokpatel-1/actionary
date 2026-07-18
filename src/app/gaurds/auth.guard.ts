import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ActionaryUtilService } from '../services/actionary-util.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const utilService = inject(ActionaryUtilService);

  const hasSession =
    typeof sessionStorage !== 'undefined' &&
    (sessionStorage.getItem('email') || sessionStorage.getItem('localId') || sessionStorage.getItem('token'));
  
  const allowed = !!hasSession;

  if (!allowed) {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    utilService.showError('Your session has expired. Please log in again to access your notes.');
    router.navigate(['/auth/login']);
  }
  return allowed;
};
