import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { SessionService } from '../../session.service';
import { PopoverController } from '@ionic/angular';
import { DateTimePopoverComponent } from './datetime-popover.component';
import { HttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { environment } from '../../../environments/environment';
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
  selector: 'app-ticket-create-wizard',
  templateUrl: './ticket-create-wizard.component.html',
  styleUrls: ['./ticket-create-wizard.component.scss'],
  standalone: true,
  imports: [
    IonicModule, // Importiere Ionic-Module
    CommonModule, // Für grundlegende Angular-Features wie *ngIf, *ngFor
    FormsModule, // Für Two-Way-Binding ([(ngModel)])
  ],
})
export class TicketCreateWizardComponent {
  currentStep: number = 1; // Start bei Schritt 1
  @Output() ticketCreated = new EventEmitter<void>();
  @Input() ticket: any = null; // Das bestehende Ticket zum Bearbeiten
  @Input() isEditMode: boolean = false; // Modus: Erstellen oder Bearbeiten

  selectedCar: string = '';
  availableCars: string[] = ['Audi A6', 'DS 4', 'Ford Mustang E', 'Hyundai', 'E-Class Mercedes', 'GMC'];
  activeUsers: string[] = [];
  sharedWithUser: string = '';
  private apiUrl = environment.apiUrl;

  // Kontrollvariable, um doppelte Aufrufe zu verhindern
  isSubmitting = false;

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

  async showInvalidDateAlert() {
    const alert = document.createElement('ion-alert');
    alert.header = 'Ungültiges Datum';
    alert.message = 'Bitte wähle ein Datum, das in der Zukunft liegt.';
    alert.buttons = ['OK'];
  
    document.body.appendChild(alert);
    await alert.present();
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
  
  // Ticket-Daten
  permissions = {
    doorAccess: false,
    windowAccess: false,
    trunkAccess: false,
    engineStart: false,
  };

  nextStep() {
    if (this.currentStep === 2) {
      const today = new Date(); // Aktuelles Datum
      const selectedDate = new Date(this.validUntil); // Ausgewähltes Datum
  
      // Überprüfen, ob das Datum in der Zukunft liegt
      if (!this.validUntil || selectedDate <= today) {
        console.error('Das ausgewählte Datum muss in der Zukunft liegen.');
        this.showInvalidDateAlert();
        return; // Stoppe, wenn das Datum ungültig ist
      }
  
      console.log('Datum bestätigt:', this.validUntil);
    }
  
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }
  
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  saveTicket() {
    if (this.isSubmitting) {
      return; // Wenn bereits ein Ticket gespeichert wird, abbrechen
    }
  
    if (!this.speedLimit) {
      console.error('Keine Maximalgeschwindigkeit ausgewählt.');
      return;
    }
  
    this.isSubmitting = true; // Blockiere weitere Aufrufe
    const currentUser = this.sessionService.getUserName();
    console.log('Ticket Wizard - Aktueller Benutzer:', currentUser); // Debugging

    if (!currentUser) {
      console.error('Benutzername ist nicht gesetzt. Überprüfe SessionService.');
      return; // Abbrechen, wenn Benutzername fehlt
    }

    const ticketData = {
      car: this.selectedCar,
      validUntil: this.validUntil,
      doorAccess: this.permissions.doorAccess,
      windowAccess: this.permissions.windowAccess,
      trunkAccess: this.permissions.trunkAccess,
      engineStart: this.permissions.engineStart,
      speedLimit: this.speedLimit,
      owner: currentUser,
    };

    console.log('Ticket-Daten vor dem Senden:', ticketData); // Debugging
  
    if (this.isEditMode) {
      // Ticket aktualisieren
      if (!this.ticket || !this.ticket.id) {
        console.error('Kein gültiges Ticket zum Aktualisieren gefunden.');
        this.isSubmitting = false;
        return;
      }
  
      this.ticketService.updateTicket(this.ticket.id, ticketData).subscribe({
        next: (response: any) => {
          console.log('Ticket erfolgreich aktualisiert:', response);
          this.ticketCreated.emit();
          this.dismiss();
        },
        error: (error: any) => {
          console.error('Fehler beim Aktualisieren des Tickets:', error);
          this.isSubmitting = false;
        },
      });
    } else {
      // Neues Ticket erstellen
      this.ticketService.createTicket(ticketData).subscribe({
        next: (response: any) => {
          console.log('Neues Ticket erfolgreich erstellt:', response);
          console.log('Ticket-Daten nach dem Senden:', ticketData); // Debugging
          this.ticketCreated.emit();
          this.dismiss();
        },
        error: (error: any) => {
          console.error('Fehler beim Erstellen des Tickets:', error);
          this.isSubmitting = false;
        },
      });
    }
  }

  isPastDate(date: string): boolean {
    const today = new Date();
    const selectedDate = new Date(date);
    return selectedDate <= today; // Vergleiche Datum
  }

  dismiss() {
    this.isSubmitting = false; // Zurücksetzen der Kontrollvariable
    this.modalController.dismiss();
  }

}
