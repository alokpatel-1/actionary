import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ReadingTimePipe } from './pipes/reading-time.pipe';
import { ExcerptPipe } from './pipes/excerpt.pipe';
import { AutofocusDirective } from './directives/autofocus.directive';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@NgModule({
  declarations: [
    ReadingTimePipe,
    ExcerptPipe,
    AutofocusDirective,
    ClickOutsideDirective,
    ConfirmDialogComponent,
    SidebarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ReadingTimePipe,
    ExcerptPipe,
    AutofocusDirective,
    ClickOutsideDirective,
    ConfirmDialogComponent,
    SidebarComponent
  ]
})
export class SharedModule { }
