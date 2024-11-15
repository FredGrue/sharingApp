import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})

export class HomePage {
  role: string = '';
  userName: string = '';

  constructor(private router: Router) {
    this.loadSessionData();
  }

  // Session-Daten aus dem localStorage laden
  loadSessionData() {
    const session = localStorage.getItem('session');
    if (session) {
      const { role, userName } = JSON.parse(session);
      this.role = role;
      this.userName = userName;
    }
  }

  // Logout-Funktion
  onLogout() {
    localStorage.clear(); // Entfernt alle Session-Daten
    this.router.navigate(['/login']);
  }
  
}
