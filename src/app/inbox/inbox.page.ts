import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MenuController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inbox',
  templateUrl: './inbox.page.html',
  styleUrls: ['./inbox.page.scss'],
  standalone: true,
  imports: [IonicModule,CommonModule, FormsModule]
})
export class InboxPage implements OnInit {
  username: string = ''; // Eigenschaft hinzugefügt
  role: string = ''; // Eigenschaft hinzugefügt

  constructor(private router: Router, private menuCtrl: MenuController) {
    // Daten von der Login-Seite holen
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.username = navigation.extras.state['username'] || 'unbekannt';
      this.role = navigation.extras.state['role'] || 'user';
    }
  }

  ngOnInit() {
  }

}
