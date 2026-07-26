import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthTokenService } from '../core/auth/auth-token.service';
import { ActionaryUtilService } from '../services/actionary-util.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(AuthTokenService);
  const router = inject(Router);
  const utilService = inject(ActionaryUtilService);

  const profile = tokenService.currentUserProfile();
  if (profile && profile.role === 'ADMIN') {
    return true;
  }

  utilService.showError('Access denied. Administrator privileges required.');
  router.navigate(['/reader/feed']);
  return false;
};
