import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { IonModal } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { TicketModalComponent } from './ticket-modal/ticket-modal.component';
import { CommonModule } from '@angular/common';
import { TicketService } from '../services/ticket.service';
import { SessionService } from '../session.service';
import { addIcons } from 'ionicons';
import { io } from 'socket.io-client';
import {
  logOutOutline,
  logOutSharp,
  mailOutline,
  mailSharp,
  settingsOutline,
  settingsSharp,
  fileTrayFullOutline,
  fileTrayFullSharp,
  personOutline,
  personSharp,
  albumsOutline,
  albumsSharp,
  keyOutline,
  keySharp,
  homeOutline,
  homeSharp,
  walletOutline,
  walletSharp,
  carOutline,
  carSharp,
} from 'ionicons/icons';

@Component({
  standalone: true,
  selector: 'app-wallet',
  templateUrl: './wallet.page.html',
  styleUrls: ['./wallet.page.scss'],
  imports: [IonicModule, CommonModule, TicketModalComponent],
})
export class WalletPage {
  tickets: any[] = [];
  @ViewChild('ticketModal') ticketModal!: IonModal;
  private socket = io('http://localhost:3000'); // WebSocket-Verbindung

  constructor(
    private modalController: ModalController,
    private ticketService: TicketService,
    private alertController: AlertController,
    private sessionService: SessionService
  ) {
    // Icons registrieren
    this.registerIcons();
  }

  ngOnInit() {
    this.socket.on('connect', () => {
      console.log('Verbindung zum WebSocket-Server hergestellt.');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Verbindungsfehler:', error);
    });

    this.socket.on('ticketCreated', (data) => {
      console.log('Neues Ticket erstellt:', data);
      this.loadTickets();
    });

    this.socket.on('ticketShared', (data) => {
      console.log('Ticket geteilt:', data);
      this.loadTickets();
    });

    this.socket.on('ticketUpdated', (data) => {
      console.log('Ticket aktualisiert:', data);
      this.loadTickets();
    });
  }

  ionViewWillEnter() {
    this.loadTickets();
  }

  ionViewWillLeave() {
    this.socket.disconnect();
    console.log('WebSocket-Verbindung geschlossen.');
  }

  async openTicketModal(ticket: any, isEditMode: boolean) {
    const modal = await this.modalController.create({
      component: TicketModalComponent,
      componentProps: {
        ticket: ticket,
        isEditMode: isEditMode, // Modus wird an das Modal übergeben
      },
    });
    await modal.present();
  }

  
  openModal() {
    this.ticketModal.present();
  }

  onTicketCreated() {
    this.loadTickets(); // Tickets neu laden, wenn ein Ticket erstellt wurde
  }

  loadTickets() {
    const currentUser = this.sessionService.getUserName();
    this.ticketService.getTickets().subscribe({
      next: (data: any[]) => {
        this.tickets = data
          .filter(
            (ticket) =>
              ticket.owner === currentUser ||
              currentUser === 'admin' ||
              ticket.sharedWith === currentUser
          )
          .map((ticket) => ({
            ...ticket,
            carName: this.getCarName(ticket.car),
          }));
        console.log('Tickets loaded:', this.tickets);
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
      },
    });
  }
  

  getAssignedTickets(username: string) {
    return this.ticketService.getAssignedTickets(username);
  }

  getCarName(carId: string): string {
    const carNames: Record<string, string> = {
      'Audi A6': 'Audi A6',
      'DS 4': 'DS 4',
      'Ford Mustang E': 'Ford Mustang E',
      'Hyundai': 'Hyundai',
      'E-Class Mercedes': 'E-Class Mercedes',
      'GMC': 'GMC',
      'BMW': 'BMW',
      'Audi': 'Audi',
      'Mercedes': 'Mercedes',
      'Volkswagen': 'Volkswagen',
    };
    return carNames[carId] || 'Unbekanntes Fahrzeug';
  }

  getCarImage(carName: string): string {
    const imageMap: Record<string, string> = {
      'Audi A6': 'assets/images/audi.png',
      'DS 4': 'assets/images/ds.png',
      'Ford Mustang E': 'assets/images/ford.png',
      'Hyundai': 'assets/images/hyundai.png',
      'E-Class Mercedes': 'assets/images/mercedes.png',
    };
    return imageMap[carName] || 'assets/images/default-car.png';
  }

  registerIcons() {
    addIcons({
      'log-out-outline': logOutOutline,
      'log-out-sharp': logOutSharp,
      'mail-outline': mailOutline,
      'mail-sharp': mailSharp,
      'settings-outline': settingsOutline,
      'settings-sharp': settingsSharp,
      'file-tray-full-outline': fileTrayFullOutline,
      'file-tray-full-sharp': fileTrayFullSharp,
      'person-outline': personOutline,
      'person-sharp': personSharp,
      'albums-outline': albumsOutline,
      'albums-sharp': albumsSharp,
      'key-outline': keyOutline,
      'key-sharp': keySharp,
      'home-outline': homeOutline,
      'home-sharp': homeSharp,
      'wallet-outline': walletOutline,
      'wallet-sharp': walletSharp,
      'car-outline': carOutline,
      'car-sharp': carSharp,
    });
  }

  useTicket(ticket: any) {
    console.log('Ticket aktivieren:', ticket);
  }

  manageTicket(ticket: any) {
    console.log('Ticket bearbeiten:', ticket);
    this.openTicketModal(ticket, true); // `true` für Bearbeitungsmodus
  }

  deleteTicket(ticket: any) {
    console.log('deleteTicket() aufgerufen für Ticket ID:', ticket.id);
    this.ticketService.deleteTicket(ticket.id).subscribe({
      next: (response) => {
        console.log(`Ticket ${ticket.id} erfolgreich gelöscht.`, response);
        this.tickets = this.tickets.filter((t) => t.id !== ticket.id);
      },
      error: (error) => {
        console.error('Fehler beim Löschen des Tickets:', error);
        this.showErrorAlert('Das Ticket konnte nicht gelöscht werden. Bitte versuche es erneut.');
      },
    });
  }

  async confirmDelete(ticket: any) {
    const alert = await this.alertController.create({
      header: 'Bestätigung',
      message: 'Möchtest du dieses Ticket wirklich löschen?',
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
          handler: () => {
            console.log('Löschen abgebrochen.');
          },
        },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () => {
            this.deleteTicket(ticket);
          },
        },
      ],
    });

    await alert.present();
  }

  showErrorAlert(message: string) {
    const alert = document.createElement('ion-alert');
    alert.header = 'Fehler';
    alert.message = message;
    alert.buttons = ['OK'];

    document.body.appendChild(alert);
    alert.present();
  }
  
}
