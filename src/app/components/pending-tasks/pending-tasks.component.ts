import { Component } from '@angular/core';
import { ImportsModule } from '../../imports';

@Component({
  selector: 'app-pending-tasks',
  imports: [ImportsModule],
  standalone: true,
  templateUrl: './pending-tasks.component.html',
  styleUrl: './pending-tasks.component.scss'
})
export class PendingTasksComponent {

}
