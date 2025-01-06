//ticket.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { io, Socket } from 'socket.io-client'; // Import für Socket.io
import { map } from 'rxjs/operators'; // Import für map hinzufügen

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private apiUrl = environment.apiUrl;
  private activeTicketSubject = new BehaviorSubject<any>(null);
  private socket: Socket; // Socket.io-Instanz definieren

  // Observable, auf das das Dashboard abonnieren kann
  activeTicket$ = this.activeTicketSubject.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io(environment.socketUrl, {
      transports: ['websocket'], // Optional: Nur WebSocket erzwingen
    });
  }

  // Holt alle gültigen Tickets
  getTickets(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/api/tickets`).pipe(
      map((response: any) => response?.data || []) // Extrahiere "data" und gib ein leeres Array zurück, falls nicht vorhanden
    );
  }
    
   // Holt alle geteilten Tickets für den aktuellen Nutzer
   getSharedTickets(username: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/api/assigned-tickets/${username}`).pipe(
      map((response: any) => response?.data || []) // Sicherstellen, dass immer ein Array zurückkommt
    );
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

 // Funktion zum Markieren eines aktiven Tickets
  markTicketAsActive(ticketId: number) {
    const currentUser = this.getCurrentUser();
    return this.http.post(`${environment.apiUrl}/api/active-tickets`, { ticketId, username: currentUser });
  }

  getAssignedTickets(username: string) {
    return this.http.get<any[]>(`${this.apiUrl}/api/assigned-tickets/${username}`);
  }

  returnSharedTicket(ticketId: number, username: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/tickets/${ticketId}/return`, { username });
  }

  deleteTicket(ticketId: string): Observable<any> {
    console.log(`Sende DELETE-Anfrage an API: ${this.apiUrl}/api/tickets/${ticketId}`);
    
    // API-Endpunkt, um aktive Tickets zu prüfen und/oder Benutzer zu benachrichtigen
    return new Observable((observer) => {
      this.http.get<any[]>(`${this.apiUrl}/api/active-tickets/${ticketId}`).subscribe({
        next: (activeUsers) => {
          if (activeUsers.length > 0) {
            console.warn(`Ticket ${ticketId} wird aktiv genutzt von:`, activeUsers);
            // Benachrichtige die Nutzer, dass das Ticket gelöscht werden soll
            activeUsers.forEach((user) => {
              this.notifyUserForDeletion(user.username, ticketId);
            });
  
            observer.error(`Ticket ${ticketId} ist aktiv und kann nicht gelöscht werden.`);
          } else {
            // Ticket kann gelöscht werden
            this.http.delete(`${this.apiUrl}/api/tickets/${ticketId}`).subscribe({
              next: (response) => {
                console.log(`Ticket ${ticketId} erfolgreich gelöscht.`);
                observer.next(response);
                observer.complete();
              },
              error: (error) => {
                console.error(`Fehler beim Löschen des Tickets ${ticketId}:`, error);
                observer.error(error);
              },
            });
          }
        },
        error: (error) => {
          console.error(`Fehler beim Überprüfen aktiver Nutzer für Ticket ${ticketId}:`, error);
          observer.error(error);
        },
      });
    });
  }
  
  // Zusätzliche Methode zur Benachrichtigung der Nutzer
  notifyUserForDeletion(username: string, ticketId: string) {
    console.log(`Benachrichtige Nutzer ${username} über die Löschung von Ticket ${ticketId}`);
    this.socket.emit('notifyDeletion', { username, ticketId });
  }

  removeActiveTicket(ticketId: string): void {
    const currentActiveTicket = this.getActiveTicket();
  
    if (currentActiveTicket && currentActiveTicket.id === ticketId) {
      this.clearActiveTicket(); // Das Ticket entfernen, wenn es aktiv ist
      console.log(`Das aktive Ticket mit ID ${ticketId} wurde entfernt.`);
    } else {
      console.log(`Das Ticket mit ID ${ticketId} ist nicht aktiv und muss nicht entfernt werden.`);
    }
  }

}
