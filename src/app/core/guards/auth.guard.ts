import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    const roles = route.data?.['roles'] as Array<string>;
    if (roles && roles.length > 0) {
      if (auth.hasAnyRole(roles)) {
        return true;
      }
      // If authenticated but lacks role, redirect to the user's home area
      return router.createUrlTree([auth.homePath()]);
    }
    return true;
  }

  return router.createUrlTree(['/login']);
};
