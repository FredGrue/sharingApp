import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = 'http://localhost:3000/tickets';

  constructor(private http: HttpClient) {}

  // Holt alle gültigen Tickets
  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Erstellt ein neues Ticket
  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, ticketData);
  }
  
  deleteTicket(ticketId: string): Observable<any> {
    console.log(`Sende DELETE-Anfrage an API: http://localhost:3000/api/tickets/${ticketId}`);
    return this.http.delete(`http://localhost:3000/api/tickets/${ticketId}`);
  }

  // Aktive Nutzer abrufen
  getActiveUsers() {
    return this.http.get<string[]>('http://localhost:3000/active-users');
  }

  // Ticket teilen
  shareTicket(ticketId: number, sharedWith: string) {
    return this.http.post('http://localhost:3000/share-ticket', {
      ticketId,
      sharedWith,
    });
  }

  getCurrentUser(): string {
    // Hier kannst du den aktuellen Nutzernamen aus dem Speicher holen (z.B. aus `localStorage` oder `sessionStorage`)
    return localStorage.getItem('userName') || 'Unbekannt';
  }

  getAssignedTickets(username: string) {
    return this.http.get<any[]>(`http://localhost:3000/assigned-tickets/${username}`);
  }

}
