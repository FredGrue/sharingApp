//profile.page.ts

import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Für [(ngModel)]
import { IonicModule } from '@ionic/angular'; // Für Ionic-Komponenten

@Component({
  standalone: true,
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule,]
})


export class ProfilePage implements OnInit {
  selectedTab: string = 'user-info'; // Standardtab
  userName: string = '';

  // Arrays für Dropdown-Listen
  days: number[] = [];
  months: { value: number; name: string }[] = [];
  years: number[] = [];

  // Temporäre Variablen für das ausgewählte Geburtsdatum
  dobDay: number | null = null;
  dobMonth: number | null = null;
  dobYear: number | null = null;

  userInfo: any = {
    homeAddress: '',
    dob: '',
    driverLicense: [],
    climateTemperature: 22,
    fanIntensity: 2,
    seatPosition: 'Normal',
    favoriteColor: '#ffffff',
  };

  constructor(private http: HttpClient, private toastCtrl: ToastController) {}

  ngOnInit() {
    this.userName = localStorage.getItem('userName') || 'Unbekannt';
    this.loadUserData();
    this.initializeDateDropdowns();
  }

  changeTab(tab: string) {
    this.selectedTab = tab;
  }

  // Dropdown-Werte für Tage, Monate und Jahre erstellen
  initializeDateDropdowns() {
    // Tage von 1 bis 31
    this.days = Array.from({ length: 31 }, (_, i) => i + 1);

    // Monate als Werte und Namen
    this.months = [
      { value: 1, name: 'January' },
      { value: 2, name: 'February' },
      { value: 3, name: 'March' },
      { value: 4, name: 'April' },
      { value: 5, name: 'May' },
      { value: 6, name: 'June' },
      { value: 7, name: 'July' },
      { value: 8, name: 'August' },
      { value: 9, name: 'September' },
      { value: 10, name: 'October' },
      { value: 11, name: 'November' },
      { value: 12, name: 'December' },
    ];

    // Jahre von 1950 bis zum aktuellen Jahr
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i);
  }

  // Nutzerdaten laden und Geburtsdatum aufteilen
  loadUserData() {
    this.http.get<any>(`${environment.apiUrl}/api/user/${this.userName}`).subscribe({
      next: (data) => {
        this.userInfo = { ...this.userInfo, ...data };

        // Geburtsdatum aufteilen, falls vorhanden
        if (this.userInfo.dob) {
          const [year, month, day] = this.userInfo.dob.split('-').map(Number);
          this.dobYear = year;
          this.dobMonth = month;
          this.dobDay = day;
        }
      },
      error: (err) => console.error('Fehler beim Laden der Nutzerdaten:', err),
    });
  }

  // Validierung und Speichern der Daten
  async validateAndSave() {
    const missingFields = [];

    // Geburtsdatum zusammensetzen und prüfen
    if (this.dobDay && this.dobMonth && this.dobYear) {
      this.userInfo.dob = `${this.dobYear}-${String(this.dobMonth).padStart(2, '0')}-${String(this.dobDay).padStart(2, '0')}`;
    } else {
      missingFields.push('Date of Birth');
    }

    if (this.userInfo.driverLicense.length === 0) missingFields.push('Driver Licence');

    if (missingFields.length > 0) {
      const toast = await this.toastCtrl.create({
        message: `Bitte füllen Sie die folgenden Felder aus: ${missingFields.join(', ')}`,
        duration: 3000,
        color: 'warning',
      });
      await toast.present();
      return;
    }

    this.saveUserData();
  }

  saveUserData() {
    this.http.put(`${environment.apiUrl}/api/user/${this.userName}`, this.userInfo).subscribe({
      next: async () => {
        const toast = await this.toastCtrl.create({
          message: 'Daten erfolgreich gespeichert!',
          duration: 2000,
          color: 'success',
        });
        toast.present();
      },
      error: async (err) => {
        console.error('Fehler beim Speichern der Nutzerdaten:', err);
        const toast = await this.toastCtrl.create({
          message: 'Fehler beim Speichern der Daten!',
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }
}