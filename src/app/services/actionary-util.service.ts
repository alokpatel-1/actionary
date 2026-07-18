import { inject, Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ActionaryUtilService {
  private readonly messageService = inject(MessageService);
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
  }
}

