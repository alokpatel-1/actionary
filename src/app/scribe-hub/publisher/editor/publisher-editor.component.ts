import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-publisher-editor',
  standalone: false,
  templateUrl: './publisher-editor.component.html',
  styleUrl: './publisher-editor.component.scss'
})
export class PublisherEditorComponent {
  private router = inject(Router);
  private utilService = inject(ActionaryUtilService);

  saveDraft(): void {
    this.utilService.showSuccess('Draft saved successfully.');
    this.router.navigate(['/new/publisher/dashboard']);
  }

  publish(): void {
    this.utilService.showSuccess('Note published to Reader Module!');
    this.router.navigate(['/new/publisher/dashboard']);
  }
}
