import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';
import { Task } from '../actionary/components/create-task/create-task.component';

@Injectable({
  providedIn: 'root'
})
export class ActionaryUtilService {
  isSideBarCloser: WritableSignal<boolean> = signal(false);
  private readonly messageService = inject(MessageService);
  private readonly spinner = inject(NgxSpinnerService);
  constructor() { }

  showSuccess(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail });
  }

  showInfo(detail: string) {
    this.messageService.add({ severity: 'info', summary: 'Info', detail });
  }

  showWarn(detail: string) {
    this.messageService.add({ severity: 'warn', summary: 'Warn', detail });
  }

  showError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  showContrast(detail: string) {
    this.messageService.add({ severity: 'contrast', summary: 'Error', detail });
  }

  showSecondary(detail: string) {
    this.messageService.add({ severity: 'secondary', summary: 'Secondary', detail });
  };

  setIsEditableFalse(task: Task) {
    // Check if the current object has the 'isEditable' property
    if (task.hasOwnProperty('isEditable')) {
      task.isEditable = false;
    }

    // If the object has subtasks, recursively set 'isEditable' to false for each subtask
    if (Array.isArray(task.subtasks)) {
      (task?.subtasks || []).forEach(data => this.setIsEditableFalse(data));
    }
  }
}
