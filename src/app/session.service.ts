import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private sessionData = new BehaviorSubject<any>(null);
  sessionData$ = this.sessionData.asObservable();

  constructor() {
    this.loadSessionData();
  }

  // Lädt die Sitzung aus dem LocalStorage
  loadSessionData() {
    const session = localStorage.getItem('session');
    if (session) {
      this.sessionData.next(JSON.parse(session));
    } else {
      this.sessionData.next(null);
    }
  }

  // Aktualisiert die Sitzung und speichert sie im LocalStorage
  updateSessionData(data: any) {
    localStorage.setItem('session', JSON.stringify(data));
    this.sessionData.next(data);
  }

  // Löscht die Sitzung
  clearSessionData() {
    localStorage.removeItem('session');
    this.sessionData.next(null);
  }

  // Methode zum Abrufen des aktuellen Nutzernamens
  getUserName(): string {
    const currentSession = this.sessionData.getValue();
    return currentSession?.userName || '';
  }

  // Methode zum Abrufen der aktuellen Rolle (user/admin)
  getUserRole(): string {
    const currentSession = this.sessionData.getValue();
    return currentSession?.role || 'user';
  }
}
