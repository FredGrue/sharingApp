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

  loadSessionData() {
    const session = localStorage.getItem('session');
    if (session) {
      this.sessionData.next(JSON.parse(session));
    } else {
      this.sessionData.next(null);
    }
  }

  updateSessionData(data: any) {
    localStorage.setItem('session', JSON.stringify(data));
    this.sessionData.next(data);
  }

  clearSessionData() {
    localStorage.removeItem('session');
    this.sessionData.next(null);
  }
}
