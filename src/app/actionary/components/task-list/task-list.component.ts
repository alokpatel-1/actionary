import { Component, inject, Input } from '@angular/core';
import { SubTask, Task } from '../create-task/create-task.component';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: false,

  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  @Input() tasks: any = [];

  readonly taskService = inject(TaskService);

  menudata: any = [];
  selectedItem!: any;

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
          console.log('@ hhh', event, this.selectedItem);
          this.deleteItem(this.selectedItem);
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
  }

  async updateItem(item: any) {
    console.log('@ jshdskjhdjkasd kjashdjkasd', structuredClone(item));

    await this.taskService.updateItem(item.id, structuredClone(item));
    this.getItems();
  };

  async cancelEdit() {
    this.getItems();
  }

  async deleteItem(item: any) {
    await this.taskService.deleteItem(item.id);
    this.getItems();
  }

  async getItems() {
    this.tasks = await this.taskService.getItems();
  }
}
