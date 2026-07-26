import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: false,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Delete Confirmation';
  @Input() message = 'Are you sure you want to delete this item? This action cannot be undone.';
  @Input() confirmText = 'Delete Note';
  @Input() cancelText = 'Cancel';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-overlay')) {
      this.onCancel();
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isOpen) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      this.onConfirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.onCancel();
    }
  }
}
