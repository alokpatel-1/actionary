import { Component } from '@angular/core';
import { ImportsModule } from '../../imports';

@Component({
  selector: 'app-calender-view',
  imports: [ImportsModule],
  standalone: true,
  templateUrl: './calender-view.component.html',
  styleUrl: './calender-view.component.scss'
})
export class CalenderViewComponent {

}
