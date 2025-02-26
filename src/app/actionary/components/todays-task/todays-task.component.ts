import { Component, inject, ViewChild } from '@angular/core';
import { FirebaseStoreService } from '../../../firebase/firebase-store.service';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { Panel } from 'primeng/panel';
import { TaskService } from '../../../services/task.service';

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
  readonly crudService = inject(TaskService);

  readonly email = JSON.parse(sessionStorage.getItem('email')!);

  tasks: any = [];

  menudata: MenuItem[] = [];

  async ngOnInit() {
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

    this.getTasks();
  };

  async getTasks() {
    this.tasks = await this.crudService.getItesmsFilterByEmail(this.email);

    console.log('@ lkjdksads  task', this.tasks);

  }

  addNewTask() {
    this.isNewTaskPanelOpen = true;
  }

  navigateTo() {
    this.router.navigate(['user/create'])
  }
}
