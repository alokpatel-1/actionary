import { Component, inject } from '@angular/core';
import { FirebaseStoreService } from '../../../firebase/firebase-store.service';

@Component({
  selector: 'app-todays-task',
  standalone: false,
  templateUrl: './todays-task.component.html',
  styleUrl: './todays-task.component.scss'
})
export class TodaysTaskComponent {
  // readonly firebasedb = inject(FirebaseStoreService);

  constructor(private firebasedb: FirebaseStoreService) { }
}
