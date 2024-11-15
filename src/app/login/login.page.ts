import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SessionService } from '../session.service';

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

  constructor(private router: Router, private sessionService: SessionService) {
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

    this.sessionService.updateSessionData(sessionData);
    this.router.navigate(['/home']);
  }
}
