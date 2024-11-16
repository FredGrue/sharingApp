import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { IonModal } from '@ionic/angular';
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


  constructor(private modalController: ModalController, private ticketService: TicketService) {
        // Icons registrieren
        this.registerIcons();
  }

  ngOnInit() {
    this.loadTickets();
  }

  async openTicketModal() {
    const modal = await this.modalController.create({
      component: TicketModalComponent,
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
    this.ticketService.getTickets().subscribe({
      next: (data: any[]) => {
        this.tickets = data.map((ticket) => ({
          ...ticket,
          carName: this.getCarName(ticket.car),
        }));
        console.log('Tickets geladen:', this.tickets);
      },
      error: (error) => {
        console.error('Fehler beim Laden der Tickets:', error);
      },
    });
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

}
