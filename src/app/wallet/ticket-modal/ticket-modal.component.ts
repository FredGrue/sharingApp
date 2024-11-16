import { Component, Output, EventEmitter } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { PopoverController } from '@ionic/angular';
import { DateTimePopoverComponent } from './datetime-popover.component';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './ticket-modal.component.html',
  styleUrls: ['./ticket-modal.component.scss'],
})
export class TicketModalComponent {
  @Output() ticketCreated = new EventEmitter<void>();

  // Variablen hinzufügen
  selectedCar: string = '';
  availableCars: string[] = ['Audi A6', 'DS 4', 'Ford Mustang E', 'Hyundai', 'E-Class Mercedes', 'GMC']; // Beispielhafte Fahrzeugliste

  car: string = '';
  validUntil: string = '';
  doorAccess: boolean = false;
  windowAccess: boolean = false;
  trunkAccess: boolean = false;
  engineStart: boolean = false;
  speedLimit: string = 'full';
  constructor(private modalController: ModalController, 
              private popoverController: PopoverController,
              private ticketService: TicketService) {}

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

  createTicket() {
    const newTicket = {
      car: this.selectedCar, // Korrektur hier: selectedCar statt car
      validUntil: this.validUntil,
      doorAccess: this.doorAccess,
      windowAccess: this.windowAccess,
      trunkAccess: this.trunkAccess,
      engineStart: this.engineStart,
      speedLimit: this.speedLimit,
    };
  
    this.ticketService.createTicket(newTicket).subscribe({
      next: (response) => {
        console.log('Ticket erfolgreich erstellt:', response);
        this.ticketCreated.emit();
        this.dismiss();
      },
      error: (error) => {
        console.error('Fehler beim Erstellen des Tickets:', error);
      },
    });
  }


}
