import { Component } from '@angular/core';
import { ImportsModule } from '../../imports';

@Component({
  selector: 'app-upcoming-task',
  imports: [ImportsModule],
  standalone: true,
  templateUrl: './upcoming-task.component.html',
  styleUrl: './upcoming-task.component.scss'
})
export class UpcomingTaskComponent {

}
