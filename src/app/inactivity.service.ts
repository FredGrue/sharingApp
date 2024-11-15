import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class InactivityService {
  private timeoutId: any;
  private readonly TIMEOUT_DURATION = 5 * 60 * 1000; // 5 Minuten Inaktivität

  constructor(private router: Router, private sessionService: SessionService) {
    this.startInactivityTimer();
    this.setupEventListeners();
  }

  // Starte den Inaktivitäts-Timer
  startInactivityTimer() {
    this.clearInactivityTimer();
    this.timeoutId = setTimeout(() => this.logoutUser(), this.TIMEOUT_DURATION);
  }

  // Beende den Inaktivitäts-Timer
  clearInactivityTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  // Setze Event-Listener für Benutzeraktivitäten
  setupEventListeners() {
    ['click', 'mousemove', 'keydown', 'touchstart'].forEach((event) => {
      window.addEventListener(event, () => this.resetTimer());
    });
  }

  // Setze den Inaktivitäts-Timer zurück
  resetTimer() {
    this.startInactivityTimer();
  }

  // Logout des Benutzers bei Inaktivität
  logoutUser() {
    this.sessionService.clearSessionData();
    this.router.navigate(['/login']);
    alert('Sie wurden aufgrund von Inaktivität automatisch ausgeloggt.');
  }
}
