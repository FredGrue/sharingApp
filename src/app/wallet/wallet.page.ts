import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { IonModal } from '@ionic/angular';
import { AlertController } from '@ionic/angular';
import { TicketModalComponent } from './ticket-modal/ticket-modal.component';
import { CommonModule } from '@angular/common';
import { TicketService } from '../services/ticket.service';
import { addIcons } from 'ionicons';
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


  constructor(private modalController: ModalController, 
              private ticketService: TicketService, 
              private alertController: AlertController) {
        // Icons registrieren
        this.registerIcons();
  }

  ngOnInit() {
    this.loadTickets();
  }

  async openTicketModal(ticket: any) {
    const modal = await this.modalController.create({
      component: TicketModalComponent,
      componentProps: {
        ticket: ticket, // Übergibt das Ticket-Objekt an das Modal
      },
    });
    await modal.present();
  }
  
  ionViewWillEnter() {
    this.loadTickets();
  }

  openModal() {
    this.ticketModal.present();
  }

  onTicketCreated() {
    this.loadTickets(); // Tickets neu laden, wenn ein Ticket erstellt wurde
  }

  loadTickets() {
    const currentUser = this.ticketService.getCurrentUser();
    this.ticketService.getAssignedTickets(currentUser).subscribe({
      next: (data: any[]) => {
        this.tickets = data.map((ticket) => ({
          ...ticket,
          carName: this.getCarName(ticket.car),
        }));
      },
      error: (error) => {
        console.error('Fehler beim Laden der Tickets:', error);
      },
    });
  }
  
  // Zugewiesene Tickets abrufen
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
  // Methode zur Registrierung der Icons
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
    // Hier kannst du das Ticket als aktiv markieren
  }
  
  manageTicket(ticket: any) {
    console.log('Ticket bearbeiten:', ticket);
    this.openTicketModal(ticket);
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
    console.log('Button "Delete" wurde geklickt.');
    console.log('Lösche Ticket mit ID:', ticket.id);
  
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
            console.log('Bestätigung erhalten. Lösche das Ticket.');
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
