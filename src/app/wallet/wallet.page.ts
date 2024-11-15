import { Component } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { TicketModalComponent } from './ticket-modal/ticket-modal.component';
import { CommonModule } from '@angular/common';
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
  tickets = [
    { id: 1, title: 'Ticket 1', validUntil: '2024-12-01', sharedWith: 'User A' },
    { id: 2, title: 'Ticket 2', validUntil: '2024-12-15', sharedWith: 'User B' },
  ];

  constructor(private modalController: ModalController) {
        // Icons registrieren
        this.registerIcons();
  }

  async openTicketModal() {
    const modal = await this.modalController.create({
      component: TicketModalComponent,
    });
    await modal.present();
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
