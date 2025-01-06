//ticket-modal.component.ts

import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { SessionService } from '../../session.service';
import { PopoverController } from '@ionic/angular';
import { DateTimePopoverComponent } from './datetime-popover.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './ticket-modal.component.html',
  styleUrls: ['./ticket-modal.component.scss'],
})
export class TicketModalComponent implements OnInit {
  @Output() ticketCreated = new EventEmitter<void>();
  @Input() ticket: any = null; // Das bestehende Ticket zum Bearbeiten
  @Input() isEditMode: boolean = false; // Modus: Erstellen oder Bearbeiten

  selectedCar: string = '';
  availableCars: string[] = ['Audi A6', 'DS 4', 'Ford Mustang E', 'Hyundai', 'E-Class Mercedes', 'GMC'];
  activeUsers: string[] = [];
  sharedWithUser: string = '';
  private apiUrl = environment.apiUrl;

  // Ticket-Details
  car: string = '';
  validUntil: string = '';
  doorAccess: boolean = false;
  windowAccess: boolean = false;
  trunkAccess: boolean = false;
  engineStart: boolean = false;
  speedLimit: string = 'full';

  constructor(
    private modalController: ModalController,
    private popoverController: PopoverController,
    private ticketService: TicketService,
    private sessionService: SessionService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const currentUser = this.sessionService.getUserName(); // Aktuellen Nutzer abrufen
    this.loadActiveUsers(currentUser); // Beim Laden der Nutzer filtern
    if (this.isEditMode && this.ticket) {
      this.loadTicketData();
    }
  }

  dismiss() {
    this.modalController.dismiss();
  }

  async openDateTimePopover(event: any) {
    const popover = await this.popoverController.create({
      component: DateTimePopoverComponent,
      event: event,
      translucent: true,
    });
    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (data) {
      this.validUntil = data;
    }
  }

  loadTicketData() {
    if (!this.ticket) return;

    console.log('Lade Ticket-Daten:', this.ticket);
    this.selectedCar = this.ticket.car || '';
    this.validUntil = this.ticket.validUntil || '';
    this.doorAccess = this.ticket.doorAccess || false;
    this.windowAccess = this.ticket.windowAccess || false;
    this.trunkAccess = this.ticket.trunkAccess || false;
    this.engineStart = this.ticket.engineStart || false;
    this.speedLimit = this.ticket.speedLimit || 'full';
  }

  saveTicket() {
    const currentUser = this.sessionService.getUserName();
    const ticketData = {
      car: this.selectedCar,
      validUntil: this.validUntil,
      doorAccess: this.doorAccess,
      windowAccess: this.windowAccess,
      trunkAccess: this.trunkAccess,
      engineStart: this.engineStart,
      speedLimit: this.speedLimit,
      owner: currentUser,
    };
  
    if (this.isEditMode) {
      // Ticket aktualisieren
      if (!this.ticket || !this.ticket.id) {
        console.error('Kein gültiges Ticket zum Aktualisieren gefunden.');
        return;
      }
  
      this.ticketService.updateTicket(this.ticket.id, ticketData).subscribe({
        next: (response: any) => {
          console.log('Ticket erfolgreich aktualisiert:', response);
          this.ticketCreated.emit(); // Event auslösen, falls benötigt
          this.dismiss(); // Modal schließen
        },
        error: (error: any) => {
          console.error('Fehler beim Aktualisieren des Tickets:', error);
        },
      });
    } else {
      // Neues Ticket erstellen
      this.ticketService.createTicket(ticketData).subscribe({
        next: (response: any) => {
          console.log('Neues Ticket erfolgreich erstellt:', response);
          this.ticketCreated.emit(); // Event auslösen, falls benötigt
          this.dismiss(); // Modal schließen
        },
        error: (error: any) => {
          console.error('Fehler beim Erstellen des Tickets:', error);
        },
      });
    }
  }
  

  loadActiveUsers(currentUser: string) {
    this.http.get<{ data: { username: string; status: string }[] }>(`${this.apiUrl}/api/active-users`).subscribe({
      next: (response) => {
        console.log('API-Antwort für aktive Nutzer:', response);
        // Filtern: Alle Nutzer außer dem aktuellen
        this.activeUsers = response.data
          .filter((user) => user.username !== currentUser) // Aktuellen Nutzer ausschließen
          .map((user) => user.username); // Nur die Nutzernamen extrahieren
      },
      error: (error) => {
        console.error('Fehler beim Laden der aktiven Nutzer:', error);
        alert('Fehler beim Laden der aktiven Nutzer.');
      },
    });
  }

  shareTicket() {
    if (!this.ticket || !this.ticket.id) {
      console.error('Kein gültiges Ticket zum Teilen gefunden.');
      return;
    }
  
    if (!this.sharedWithUser) {
      console.error('Kein Nutzer ausgewählt, mit dem das Ticket geteilt werden soll.');
      return;
    }
  
    this.ticketService.shareTicket(this.ticket.id, this.sharedWithUser).subscribe({
      next: () => {
        console.log(`Ticket ${this.ticket.id} erfolgreich mit ${this.sharedWithUser} geteilt.`);
        this.ticketCreated.emit();
        this.dismiss();
      },
      error: (error) => {
        console.error('Fehler beim Teilen des Tickets:', error);
      },
    });
  }
  
}
