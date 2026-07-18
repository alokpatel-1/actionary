import { Component, inject, ViewChild, AfterViewInit, ChangeDetectorRef, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionaryUtilService } from '../../../services/actionary-util.service';
import { NoteEditorComponent } from '../../../study-notes/components/note-editor/note-editor.component';

@Component({
  selector: 'app-publisher-editor',
  standalone: false,
  templateUrl: './publisher-editor.component.html',
  styleUrl: './publisher-editor.component.scss'
})
export class PublisherEditorComponent implements AfterViewInit {
  @ViewChild(NoteEditorComponent) noteEditor!: NoteEditorComponent;
  isReady = signal(false);

  private router = inject(Router);
  private utilService = inject(ActionaryUtilService);
  private cdr = inject(ChangeDetectorRef);

  ngAfterViewInit(): void {
    this.isReady.set(true);
    this.cdr.detectChanges();
  }

  saveDraft(): void {
    if (this.noteEditor) {
      this.noteEditor.save(true);
    }
    this.utilService.showSuccess('Draft saved successfully.');
    this.router.navigate(['/new/publisher/dashboard']);
  }

  publish(): void {
    if (this.noteEditor) {
      this.noteEditor.status.set('published');
      this.noteEditor.save(true);
    }
    this.utilService.showSuccess('Note published to Reader Module!');
    this.router.navigate(['/new/publisher/dashboard']);
  }
}
