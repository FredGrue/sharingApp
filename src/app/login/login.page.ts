import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SessionService } from '../session.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class LoginPage {
  role: string = 'user'; // Standardmäßig "user"
  userName: string = '';

  constructor(private router: Router, 
              private sessionService: SessionService,
              private http: HttpClient) {
    this.checkSession();
  }

  checkSession() {
    const session = localStorage.getItem('session');
    if (session) {
      this.router.navigate(['/home']);
    }
  }

  onRoleChange() {
    // Optionale Logik bei Rollenänderung
    if (this.role === 'admin') {
      this.userName = ''; // Leert das Namensfeld, wenn "Admin" ausgewählt wird
    }
  }


  onLogin() {
    if (!this.role) {
      alert('Bitte wählen Sie eine Rolle aus.');
      return;
    }
  
    const sessionData = {
      role: this.role,
      userName: this.role === 'user' ? this.userName : '',
    };
  
    // Anfrage an den Server senden, um den Nutzer zu registrieren
    if (sessionData.userName) {
      this.http
        .post('http://localhost:3000/login', { userName: sessionData.userName })
        .subscribe({
          next: (response: any) => {
            console.log('Nutzer erfolgreich registriert:', response);
            // Session-Daten lokal speichern
            this.sessionService.updateSessionData(sessionData);
            this.router.navigate(['/home']);
          },
          error: (error) => {
            console.error('Fehler beim Login-Request:', error);
            alert('Fehler beim Login. Bitte versuchen Sie es erneut.');
          },
        });
    } else {
      this.sessionService.updateSessionData(sessionData);
      this.router.navigate(['/home']);
    }
  }
}
