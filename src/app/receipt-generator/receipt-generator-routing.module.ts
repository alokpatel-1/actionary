import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReceiptGeneratorComponent } from './receipt-generator.component';

const routes: Routes = [
  { path: '', component: ReceiptGeneratorComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReceiptGeneratorRoutingModule {}
