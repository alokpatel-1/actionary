import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { MyPreset } from './mypreset';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { provideFirebaseApp, initializeApp } from "@angular/fire/app";
import { getAuth, provideAuth } from "@angular/fire/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwZN-eNpoJ3_CIysKaEqVF25hBALjfyK4",
  authDomain: "actionary-be94a.firebaseapp.com",
  projectId: "actionary-be94a",
  storageBucket: "actionary-be94a.firebasestorage.app",
  messagingSenderId: "525534937218",
  appId: "1:525534937218:web:ad4a70d4543f5bc5aa749b",
  measurementId: "G-VFNYXH68GE"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    MessageService,
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          prefix: 'ac',
          darkModeSelector: false,
          cssLayer: false
        }
      }
    })
  ]
};
