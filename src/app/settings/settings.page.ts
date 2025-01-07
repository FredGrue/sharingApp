import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { io } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { IonicModule } from '@ionic/angular';
import { SessionService } from '../session.service';
import { FormsModule } from '@angular/forms'; // Importiere FormsModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class SettingsPage implements OnInit, OnDestroy {
  locationSharing: boolean = false;
  geofencing: boolean = false;
  privacyLevel: number = 1;

  private socket = io(environment.socketUrl, {
    transports: ['websocket'], // Erzwinge WebSocket (optional)
  });

  constructor(
    private alertController: AlertController,
    private sessionService: SessionService,
  ) {}

  ngOnInit() {
    const currentUser = this.sessionService.getUserName();

    // Verbindung herstellen und registrieren
    this.socket.emit('register', currentUser);

    this.socket.on('connect', () => {
      console.log('WebSocket-Verbindung hergestellt.');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Verbindungsfehler:', error);
    });

    this.socket.on('update-check', async (data: string) => {
      console.log('Update-Status empfangen:', data);
      await this.showUpdateStatusAlert(data);
    });
  }

  checkForUpdates() {
    console.log('Auf Updates prüfen...');
    this.showUpdateStatusAlert('Keine neuen Updates verfügbar.');
  }

  contactSupport() {
    window.location.href = 'mailto:innovation@marquardt.com';
  }

  async showUpdateStatusAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Update-Status',
      message: message || 'Keine neuen Updates verfügbar.',
      buttons: ['OK'],
    });

    await alert.present();
  }

  async showLocationAlert() {
    const alert = await this.alertController.create({
      header: 'Standortfreigabe',
      message: `Die Standortfreigabe ist jetzt ${this.locationSharing ? 'aktiviert' : 'deaktiviert'}.`,
      buttons: ['OK'],
    });

    await alert.present();
  }

  async showGeofencingAlert() {
    const alert = await this.alertController.create({
      header: 'Geofencing',
      message: `Geofencing wurde ${this.geofencing ? 'aktiviert' : 'deaktiviert'}.`,
      buttons: ['OK'],
    });

    await alert.present();
  }

  ngOnDestroy() {
    console.log('WebSocket-Verbindung wird geschlossen.');
    this.socket.disconnect();
  }
}
