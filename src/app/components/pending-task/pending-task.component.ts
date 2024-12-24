import { Component } from '@angular/core';
import { ImportsModule } from '../../imports';

@Component({
  selector: 'app-pending-task',
  imports: [ImportsModule],
  standalone: true,
  templateUrl: './pending-task.component.html',
  styleUrl: './pending-task.component.scss'
})
export class PendingTaskComponent {

}
