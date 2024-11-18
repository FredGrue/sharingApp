//ticket.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = environment.apiUrl;
  private activeTicketSubject = new BehaviorSubject<any>(null);

  // Observable, auf das das Dashboard abonnieren kann
  activeTicket$ = this.activeTicketSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Holt alle gültigen Tickets
  getTickets() {
    return this.http.get<any[]>(`${this.apiUrl}/api/tickets`);
  }

   // Holt alle geteilten Tickets für den aktuellen Nutzer
   getSharedTickets(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/assigned-tickets/${username}`);
  }

  // Erstellt ein neues Ticket
  createTicket(ticketData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/tickets`, ticketData);
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
    return this.http.get<string[]>(`${this.apiUrl}/api/active-users`);
  }

  // Methode zum Aktualisieren eines Tickets
  updateTicket(ticketId: number, ticketData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/tickets/${ticketId}`, ticketData);
  }

  // Methode zum Teilen eines Tickets
  shareTicket(ticketId: number, sharedWith: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/tickets/${ticketId}/share`, { sharedWith });
  }

  getCurrentUser(): string {
    // Hier kannst du den aktuellen Nutzernamen aus dem Speicher holen (z.B. aus `localStorage` oder `sessionStorage`)
    return localStorage.getItem('userName') || 'Unbekannt';
  }
  


  getAssignedTickets(username: string) {
    return this.http.get<any[]>(`${this.apiUrl}/api/assigned-tickets/${username}`);
  }

  returnSharedTicket(ticketId: number, username: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/tickets/${ticketId}/return`, { username });
  }

  deleteTicket(ticketId: string): Observable<any> {
    console.log(`Sende DELETE-Anfrage an API: ${this.apiUrl}/api/tickets/${ticketId}`);
    return this.http.delete(`${this.apiUrl}/api/tickets/${ticketId}`);
  }

}
