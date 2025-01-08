import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import { TicketService } from '../services/ticket.service';
import { SessionService } from '../session.service';
import { environment } from '../../environments/environment';
import { io } from 'socket.io-client';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class HomePage {
  private socket = io(environment.socketUrl, {
    transports: ['websocket'], // Erzwinge WebSocket
  });

  role: string = '';
  userName: string = '';
  activeTicket: any = null;
  activeUsers: string[] = []; // Liste der aktiven Nutzer

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private ticketService: TicketService,
    private alertController: AlertController
  ) {
    this.loadSessionData();
  }

  ngOnInit() {
    this.loadActiveTicket();
    this.loadActiveUsers();
    
    const currentUser = localStorage.getItem('userName'); // Aktuellen Nutzer abrufen

    // WebSocket-Events abonnieren
    this.socket.emit('register', currentUser);

    this.socket.on('connect', () => {
      console.log('WebSocket-Verbindung hergestellt.');
    });

    this.socket.on('ticketSharedWithYou', (data) => {
      console.log('Ticket geteilt:', data);
      this.showNotification('Ticket geteilt', `Ein neues Ticket (ID: ${data.ticketId}) wurde mit dir geteilt.`);
    });

    this.socket.on('ticketReturned', (data) => {
      console.log(`Ticket ${data.ticketId} wurde zurückgegeben von ${data.returnedBy}.`);
      this.showNotification(
        'Ticket zurückgegeben',
        `Das Ticket mit der ID ${data.ticketId} wurde von ${data.returnedBy} zurückgegeben.`
      );
    });

  }
  async showNotification(title: string, message: string) {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  ngOnDestroy() {
    this.socket.disconnect(); // Verbindung schließen, wenn die Seite verlassen wird
    console.log('WebSocket-Verbindung geschlossen.');
  }

  loadSessionData() {
    const session = localStorage.getItem('session');
    if (session) {
      const { role, userName } = JSON.parse(session);
      this.role = role;
      this.userName = userName;
    }
  }
  
    getCarImage(carName: string | null): string {
    const imageMap: Record<string, string> = {
      'Audi A6': 'assets/images/audi.png',
      'DS 4': 'assets/images/ds.png',
      'Ford Mustang E': 'assets/images/ford.png',
      'Hyundai': 'assets/images/hyundai.png',
      'E-Class Mercedes': 'assets/images/mercedes.png',
      'GMC': 'assets/images/gmc.png',
      'BMW': 'assets/images/bmw.png',
      'Audi': 'assets/images/audi.png',
      'Mercedes': 'assets/images/mercedes.png',
      'Volkswagen': 'assets/images/volkswagen.png',
    };
  
    return carName && imageMap[carName] ? imageMap[carName] : 'assets/images/default-car.png';
  }

  loadActiveTicket() {
    this.ticketService.activeTicket$.subscribe({
      next: (ticket) => {
        this.activeTicket = ticket;
        console.log('Aktives Ticket aktualisiert im Dashboard:', this.activeTicket);
      },
      error: (err) => {
        console.error('Fehler beim Abonnieren des aktiven Tickets:', err);
      },
    });
  }

  loadActiveUsers() {
    this.ticketService.getActiveUsers().subscribe({
      next: (users) => {
        this.activeUsers = users.filter((user) => user !== this.userName);
        console.log('Aktive Nutzer geladen:', this.activeUsers);
      },
      error: (err) => {
        console.error('Fehler beim Laden der aktiven Nutzer:', err);
      },
    });
  }

  onLogout() {
    console.log('Benutzer abgemeldet');
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  onCreateTicket() {
    console.log('Neues Ticket erstellen');
    this.router.navigate(['/wallet'], {
      queryParams: { openWizard: true },
    });
  }

  async onDeactivateTicket() {
    const alert = await this.alertController.create({
      header: 'Ticket Deaktivieren',
      message: 'Möchten Sie das aktive Ticket wirklich deaktivieren?',
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
          handler: () => {
            console.log('Ticket Deaktivieren abgebrochen.');
          },
        },
        {
          text: 'Deaktivieren',
          role: 'destructive',
          handler: () => {
            this.ticketService.clearActiveTicket();
            this.activeTicket = null;
            console.log('Ticket deaktiviert');
          },
        },
      ],
    });

    await alert.present();
  }

  onActionClick(action: string) {
    console.log(`Aktion ausgeführt: ${action}`);
    // Die Logik für die Aktionen wird später hinzugefügt
  }
}
