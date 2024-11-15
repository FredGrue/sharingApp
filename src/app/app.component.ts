import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { SessionService } from './session.service';
import { addIcons } from 'ionicons';
import { InactivityService } from './inactivity.service';
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
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
})
export class AppComponent {
  userName: string = '';
  menuItems: any[] = [];
  showHeader: boolean = true;
  currentTimestamp: string = '';

  constructor(
    private router: Router,
    private sessionService: SessionService,
    private menuCtrl: MenuController,
    private inactivityService: InactivityService
  ) {
    // Icons registrieren
    this.registerIcons();
    
    //Inactivity routine
    this.sessionService.sessionData$.subscribe((session) => {
      if (session) {
        this.userName = session.role === 'user' ? session.userName : 'Admin';
        this.setupMenuItems(session.role);
      } else {
        this.userName = '';
        this.menuItems = [];
      }
    });
  
    // Überwache Routenänderungen
    this.router.events.subscribe(() => {
      this.checkCurrentRoute();
    });

    // Abonniere Änderungen der Session-Daten
    this.sessionService.sessionData$.subscribe((session) => {
      if (session) {
        this.userName = session.role === 'user' ? session.userName : 'Admin';
        this.setupMenuItems(session.role);
      } else {
        this.userName = '';
        this.menuItems = [];
      }
    });

    // Überwache Routenänderungen
    this.router.events.subscribe(() => {
      this.checkCurrentRoute();
    });

    this.updateTimestamp();
    // Aktualisiere den Timestamp alle 10 Sekunden
    setInterval(() => this.updateTimestamp(), 10000);

    this.sessionService.sessionData$.subscribe((session) => {
      if (session) {
        this.userName = session.role === 'user' ? session.userName : 'Admin';
      } else {
        this.userName = '';
      }
    });

  }

  // Methode zur Aktualisierung des Timestamps
  updateTimestamp() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTimestamp = `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
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

  // Überprüft die aktuelle Route und steuert die Anzeige des Headers
  checkCurrentRoute() {
    const isLoginPage = this.router.url === '/login';
    this.showHeader = !isLoginPage;
    this.menuCtrl.enable(!isLoginPage);
  }

  // Legt die Menüpunkte basierend auf der Rolle fest
  setupMenuItems(role: string) {
    this.menuItems = role === 'user'
      ? [
          { title: 'Home', path: '/home', icon: 'home-outline' },
          { title: 'Wallet', path: '/wallet', icon: 'wallet-outline' },
          { title: 'Profile', path: '/profile', icon: 'person-outline' },
          { title: 'Settings', path: '/settings', icon: 'settings-outline' },
        ]
      : [
          { title: 'Home', path: '/home', icon: 'home-outline' },
          { title: 'Wallet', path: '/wallet', icon: 'wallet-outline' },
          { title: 'Profile', path: '/profile', icon: 'person-outline' },
          { title: 'Backlog', path: '/backlog', icon: 'albums-outline' },
          { title: 'Settings', path: '/settings', icon: 'settings-outline' },
        ];
  }

  // Methode zum Ausloggen
  onLogout() {
    this.sessionService.clearSessionData();
    this.router.navigate(['/login']);
  }
}
