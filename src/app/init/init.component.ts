import { Component, inject } from '@angular/core';
import { ActionaryUtilService } from '../services/actionary-util.service';

@Component({
  selector: 'app-init',
  templateUrl: './init.component.html',
  styleUrl: './init.component.scss'
})
export class ActionaryComponent {
  readonly utilService = inject(ActionaryUtilService);


}
