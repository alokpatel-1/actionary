import { Component, EventEmitter, inject, Output } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { TaskService } from '../../../services/task.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-create-task',
  standalone: false,
  templateUrl: './create-task.component.html',
  styleUrl: './create-task.component.scss'
})
export class CreateTaskComponent {
  @Output() onSaveTaskChange: EventEmitter<any> = new EventEmitter();
  @Output() onCancel: EventEmitter<any> = new EventEmitter();
  @Output() reloadTaskList: EventEmitter<any> = new EventEmitter();

  readonly crudService = inject(TaskService);
  readonly utilService = inject(ActionaryUtilService);

  newTask = new Task();
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
  }

  addSubTask(event: MouseEvent, parent: Task) {
    event?.stopPropagation();

    const subTask = new SubTask();
    if (!parent.subtasks || !parent?.subtasks?.length) {
      parent.subtasks = [];
    }

    parent.subtasks = [...parent.subtasks, subTask];
  };


  async onSaveTask() {
    await this.crudService.createItem(structuredClone(this.newTask));
    this.onCancel.emit();
    this.reloadTaskList.emit();
    this.newTask = new Task();
  }
}


// status = [
//   { "name": "To Do", "code": "TODO", "color": "#3498db" },
//   { "name": "In Progress", "code": "INPROG", "color": "#f39c12" },
//   { "name": "Done", "code": "DONE", "color": "#2ecc71" },
//   { "name": "Hold", "code": "HOLD", "color": "#e74c3c" }
// ];

// priority = [
//   { "name": "Highest", "code": "HIGHEST", "color": "#c0392b" },
//   { "name": "High", "code": "HIGH", "color": "#e74c3c" },
//   { "name": "Medium", "code": "MEDIUM", "color": "#f1c40f" },
//   { "name": "Low", "code": "LOW", "color": "#27ae60" },
//   { "name": "Lowest", "code": "LOWEST", "color": "#16a085" }
// ];

// tags = [
//   { "name": "Frontend", "code": "FRONTEND", "color": "#3498db" },
//   { "name": "Backend", "code": "BACKEND", "color": "#2ecc71" },
//   { "name": "Bug", "code": "BUG", "color": "#e74c3c" },
//   { "name": "Feature", "code": "FEATURE", "color": "#9b59b6" },
//   { "name": "Improvement", "code": "IMPROVE", "color": "#f39c12" }
// ]


export class SubTask {
  uuid!: string;
  placeholder!: string;
  value!: string;
  isDeleted!: boolean;
  isCompleted!: boolean;
  isEditable!: boolean;
  remarks!: string;
  createdAt!: string;

  constructor() {
    this.uuid = uuidv4();
    this.isEditable = true;
    this.isCompleted = false;
    this.isDeleted = false;
    this.value = '';
    this.remarks = '';
    this.placeholder = 'Add Sub task...'
    this.createdAt = new Date().toISOString()
  }
}

export class Task {
  uuid!: string;
  placeholder!: string;
  value!: string;
  isDeleted!: boolean;
  isCompleted!: boolean;
  isEditable!: boolean;
  remarks!: string;
  createdAt!: string;
  headerValue?: string;
  subtasks?: SubTask[]

  constructor(
  ) {
    this.subtasks = [];
    this.placeholder = 'Add Task...';
    this.headerValue = 'Add Task...';
    this.value = '';
    this.isCompleted = false;
    this.isDeleted = false;
    this.uuid = uuidv4();
    this.remarks = '';
    this.isEditable = true;
    this.createdAt = new Date().toISOString()
  }
}
