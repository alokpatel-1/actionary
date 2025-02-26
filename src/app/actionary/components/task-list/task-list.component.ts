import { Component, inject, Input, ViewChild } from '@angular/core';
import { SubTask, Task } from '../create-task/create-task.component';
import { TaskService } from '../../../services/task.service';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-task-list',
  standalone: false,

  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent {
  @Input() tasks: any = [];

  @ViewChild('cm') contextMenu!: ContextMenu;

  readonly taskService = inject(TaskService);
  readonly utilService = inject(ActionaryUtilService);

  menudata: any = [];
  selectedParentItem!: any;
  subTaskMenu: MenuItem[] = [];
  selectedSubItem: any;
  filterMenuData: any[] = [];
  activeFilter: any = 'all';
  selectedAcordian: any;

  ngOnInit(): void {
    this.filterMenuData = [
      {
        label: 'Show all tasks',
        icon: 'pi pi-list',
        command: (event: any) => {
          this.activeFilter = 'all';
        }
      },
      {
        label: 'Show completed only',
        icon: 'pi pi-check',
        command: (event: any) => {
          this.activeFilter = true;
        }
      },
      {
        label: 'Show pending only',
        icon: 'pi pi-folder-open',
        command: (event: any) => {
          this.activeFilter = false;
        }
      },
    ]
    this.menudata = [
      {
        label: 'Edit all',
        icon: 'pi pi-pencil',
        command: (event: any) => {
          this.setDynamicObjKeyStaus(this.selectedParentItem, 'isEditable', true);
        }
      }, {
        label: 'Save all',
        icon: 'pi pi-save',
        command: (event: any) => {
          this.updateItem(this.selectedParentItem);
        }
      },
      {
        label: 'Complete all',
        icon: 'pi pi-list-check',
        command: (event: any) => {
          this.setDynamicObjKeyStaus(this.selectedParentItem, 'isCompleted', true);
        }
      },
      {
        separator: true
      },
      {
        label: 'Delete all',
        styleClass: 'red-item',
        icon: 'pi pi-trash',
        command: (event: any) => {
          this.setDynamicObjKeyStaus(this.selectedParentItem, 'isDeleted', true);
        }
      }
    ];

    this.subTaskMenu = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => {
          this.selectedSubItem.isEditable = true;
        }
      },
      {
        label: 'Update',
        icon: 'pi pi-save',
        command: () => {
          this.updateItem(this.selectedParentItem);
        }
      },
      {
        label: 'Completed',
        icon: 'pi pi-check',
        command: () => {
          this.selectedSubItem.isCompleted = true;
        }
      },
      {
        separator: true
      },
      {
        label: 'Delete',
        styleClass: 'red-item',
        icon: 'pi pi-trash',
        command: () => {
          this.selectedSubItem.isDeleted = true;
          this.updateItem(this.selectedParentItem);
        }
      }
    ];
  };

  onContextMenu(event: MouseEvent, parent: Task, child: Task) {
    this.selectedParentItem = parent;
    this.selectedSubItem = child
  }

  onHide() {
    this.selectedParentItem = null;
    this.selectedSubItem = null;
  }

  addSubTask(event: MouseEvent, parent: Task) {
    event?.stopPropagation();

    const subTask = new SubTask();
    if (!parent.subtasks || !parent?.subtasks?.length) {
      parent.subtasks = [];
    }

    parent.subtasks = [...parent.subtasks, subTask];
  }

  async updateItem(item: any, event?: MouseEvent) {
    event?.stopPropagation();
    if (!this.utilService.validJSON([item])) {
      this.utilService.showError('Please enter valid value.');
      return;
    }


    await this.taskService.updateItem(item.id, structuredClone(item));
    this.getItems();
  };

  setDynamicObjKeyStaus(data: any[], statusKey: string, value: boolean): void {
    if (!statusKey || !value?.toString()?.length) {
      return;
    }

    [data].forEach((item: any) => {
      item[statusKey] = true;
      if (item.subtasks?.length) {
        item.subtasks.forEach((subtask: any) => subtask[statusKey] = true);
      }
    });

    if (!['isEditable'].includes(statusKey)) {
      this.updateItem(data);
    }
  }

  async cancelEdit() {
    this.getItems();
  }

  async deleteItem(item: any) {
    await this.taskService.deleteItem(item.id);
    this.getItems();
  }

  async getItems() {
    const email = JSON.parse(sessionStorage.getItem('email')!)
    this.tasks = await this.taskService.getItesmsFilterByEmail(email);
  }
}

