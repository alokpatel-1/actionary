import { Component, inject } from '@angular/core';
import { ActionaryUtilService } from '../services/actionary-util.service';

@Component({
  selector: 'app-actionary',
  standalone: false,
  templateUrl: './actionary.component.html',
  styleUrl: './actionary.component.scss'
})
export class ActionaryComponent {
  readonly utilService = inject(ActionaryUtilService);


}
