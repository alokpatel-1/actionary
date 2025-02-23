import { Component, Input } from '@angular/core';
import { SubTask, Task } from '../create-task/create-task.component';

@Component({
  selector: 'app-task-list',
  standalone: false,

  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  @Input() tasks: any = [];

  menudata: any = [];

  ngOnInit(): void {
    this.menudata = [
      {
        label: 'Refresh',
        icon: 'pi pi-refresh',
        command: (event: any) => {
          console.log('@ hhh', event);

        }
      },
      {
        label: 'Search',
        icon: 'pi pi-search',
        command: (event: any) => {
          console.log('@ hhh', event);

        }
      },
      {
        separator: true
      },
      {
        label: 'Delete',
        icon: 'pi pi-times',
        command: (event: any) => {
          console.log('@ hhh', event);

        }
      }
    ];
  };

  addSubTask(event: MouseEvent, parent: Task) {
    event?.stopPropagation();

    const subTask = new SubTask();
    if (!parent.subtasks || !parent?.subtasks?.length) {
      parent.subtasks = [];
    }

    parent.subtasks = [...parent.subtasks, subTask];

    // menu.tog(event);
    console.log('@ lajlasdsd ', parent);
  }
}
