import { Component } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-datetime-popover',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  template: `
    <ion-content>
      <ion-datetime
        [(ngModel)]="selectedDateTime"
        display-format="DD.MM.YYYY HH:mm"
        placeholder="Datum und Uhrzeit wählen"
      ></ion-datetime>
      <ion-button expand="block" (click)="confirm()">Bestätigen</ion-button>
    </ion-content>
  `,
})
export class DateTimePopoverComponent {
  selectedDateTime: string = '';

  constructor(private popoverController: PopoverController) {}

  confirm() {
    const formattedDate = this.formatDateTime(this.selectedDateTime);
    this.popoverController.dismiss(formattedDate);
  }

  formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }
}
