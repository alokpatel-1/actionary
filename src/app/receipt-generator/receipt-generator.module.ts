import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ImportsModule } from '../imports';
import { ReceiptGeneratorRoutingModule } from './receipt-generator-routing.module';
import { ReceiptGeneratorComponent } from './receipt-generator.component';
import { ReceiptPreviewComponent } from './components/receipt-preview/receipt-preview.component';
import { BulkCreateComponent } from './components/bulk-create/bulk-create.component';

@NgModule({
  declarations: [ReceiptGeneratorComponent, ReceiptPreviewComponent, BulkCreateComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ImportsModule,
    ReceiptGeneratorRoutingModule,
  ],
})
export class ReceiptGeneratorModule {}
