import { Component, inject, ViewChild } from '@angular/core';
import { FirebaseStoreService } from '../../../firebase/firebase-store.service';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { Panel } from 'primeng/panel';

@Component({
  selector: 'app-todays-task',
  standalone: false,
  templateUrl: './todays-task.component.html',
  styleUrl: './todays-task.component.scss'
})
export class TodaysTaskComponent {
  isNewTaskPanelOpen: boolean = false;

  @ViewChild('panelRef') panelRef!: HTMLElement;


  readonly firebasedb = inject(FirebaseStoreService);
  readonly router = inject(Router);

  tasks = []

  menudata: MenuItem[] = [];

  ngOnInit() {
    this.menudata = [
      {
        label: 'Refresh',
        icon: 'pi pi-refresh',
        command: (event) => {
          console.log('@ hhh', event);

        }
      },
      {
        label: 'Search',
        icon: 'pi pi-search',
        command: (event) => {
          console.log('@ hhh', event);

        }
      },
      {
        separator: true
      },
      {
        label: 'Delete',
        icon: 'pi pi-times',
        command: (event) => {
          console.log('@ hhh', event);

        }
      }
    ];

    console.log('@ panelRef', this.panelRef);

  };

  addNewTask() {
    this.isNewTaskPanelOpen = true;
  }

  onSaveTask() { }

  navigateTo() {
    this.router.navigate(['user/create'])
  }
}
