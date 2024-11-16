import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

import { importProvidersFrom } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { addIcons } from 'ionicons';
import { addOutline } from 'ionicons/icons';

import { HttpClientModule } from '@angular/common/http';

addIcons({
  'add-outline': addOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(IonicModule.forRoot(), HttpClientModule),
  ],
}).catch((err) => console.error(err));

// Dynamisches Design je nach Systemeinstellung
function applyThemeBasedOnSystemPreference() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  // Funktion zum Setzen des Themas
  const updateTheme = (isDarkMode: boolean) => {
    document.body.classList.toggle('dark', isDarkMode);
  };

  // Initiales Setzen des Themas
  updateTheme(prefersDark.matches);

  // Überwacht Änderungen der Systemeinstellungen
  prefersDark.addEventListener('change', (event) => {
    updateTheme(event.matches);
  });
}

// Thema anwenden
applyThemeBasedOnSystemPreference();

