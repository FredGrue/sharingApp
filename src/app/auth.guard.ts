import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const session = localStorage.getItem('session');
    if (session) {
      const { role } = JSON.parse(session);
      if (role === 'user' || role === 'admin') {
        return true;
      }
    }

    // Weiterleitung zur Login-Seite, wenn keine gültige Session vorhanden ist
    this.router.navigate(['/login']);
    return false;
  }
}
