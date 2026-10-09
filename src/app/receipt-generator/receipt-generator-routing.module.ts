import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReceiptGeneratorComponent } from './receipt-generator.component';
import { BulkCreateComponent } from './components/bulk-create/bulk-create.component';

const routes: Routes = [
  { path: '', component: ReceiptGeneratorComponent },
  { path: 'bulk', component: BulkCreateComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceiptGeneratorRoutingModule {}
