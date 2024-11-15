import { Component } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './ticket-modal.component.html',
  styleUrls: ['./ticket-modal.component.scss'],
})
export class TicketModalComponent {
  availableCars = ['Car A', 'Car B', 'Car C'];
  selectedCar: string = '';
  validUntil: string = '';
  doorAccess: boolean = false;
  windowAccess: boolean = false;
  trunkAccess: boolean = false;
  speedLimit: string = '';

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  createTicket() {
    const newTicket = {
      car: this.selectedCar,
      validUntil: this.validUntil,
      doorAccess: this.doorAccess,
      windowAccess: this.windowAccess,
      trunkAccess: this.trunkAccess,
      speedLimit: this.speedLimit,
    };
    console.log('Neues Ticket:', newTicket);
    this.dismiss();
  }
}
