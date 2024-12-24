import { Component } from '@angular/core';
import { ImportsModule } from '../../imports';

@Component({
  selector: 'app-todays-task',
  imports: [ImportsModule],
  standalone: true,
  templateUrl: './todays-task.component.html',
  styleUrl: './todays-task.component.scss'
})
export class TodaysTaskComponent {

}
