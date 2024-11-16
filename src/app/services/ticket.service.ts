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
}
