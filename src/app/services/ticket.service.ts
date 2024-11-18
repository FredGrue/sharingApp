//ticket.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = 'http://localhost:3000/api/tickets';
  private activeTicketSubject = new BehaviorSubject<any>(null);

  // Observable, auf das das Dashboard abonnieren kann
  activeTicket$ = this.activeTicketSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Holt alle gültigen Tickets
  getTickets() {
    return this.http.get<any[]>('http://localhost:3000/api/tickets');
  }

   // Holt alle geteilten Tickets für den aktuellen Nutzer
   getSharedTickets(username: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/api/assigned-tickets/${username}`);
  }

  // Erstellt ein neues Ticket
  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, ticketData);
  }

   // Setzt das aktive Ticket
   setActiveTicket(ticket: any) {
    this.activeTicketSubject.next(ticket);
    console.log('Aktives Ticket gesetzt:', ticket);
  }

  // Holt das aktuelle aktive Ticket
  getActiveTicket() {
    return this.activeTicketSubject.value;
  }

  // Entfernt das aktive Ticket
  clearActiveTicket() {
    this.activeTicketSubject.next(null);
    console.log('Aktives Ticket entfernt.');
  }

  

  // Aktive Nutzer abrufen
  getActiveUsers() {
    return this.http.get<string[]>('http://localhost:3000/api/active-users');
  }

  // Methode zum Aktualisieren eines Tickets
  updateTicket(ticketId: number, ticketData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${ticketId}`, ticketData);
  }

  // Methode zum Teilen eines Tickets
  shareTicket(ticketId: number, sharedWith: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${ticketId}/share`, { sharedWith });
  }

  getCurrentUser(): string {
    // Hier kannst du den aktuellen Nutzernamen aus dem Speicher holen (z.B. aus `localStorage` oder `sessionStorage`)
    return localStorage.getItem('userName') || 'Unbekannt';
  }
  


  getAssignedTickets(username: string) {
    return this.http.get<any[]>(`http://localhost:3000/api/assigned-tickets/${username}`);
  }

  returnSharedTicket(ticketId: number, username: string): Observable<any> {
    return this.http.post<any>(`http://localhost:3000/api/tickets/${ticketId}/return`, { username });
  }

  deleteTicket(ticketId: string): Observable<any> {
    console.log(`Sende DELETE-Anfrage an API: http://localhost:3000/api/tickets/${ticketId}`);
    return this.http.delete(`http://localhost:3000/api/tickets/${ticketId}`);
  }

}
