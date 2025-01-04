import { Component, inject, OnInit, signal } from '@angular/core';
import { ImportsModule } from '../../imports';
import { ActionaryUtilService } from '../../services/actionary-util.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [ImportsModule, RouterLink],
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  readonly utilService = inject(ActionaryUtilService);
  readonly router = inject(Router);

  sidebarItems = [
    {
      label: 'Upcoming', icon: 'pi pi-arrow-circle-right',
      active: false, url: "upcoming"
    },
    {
      label: 'Today', icon: 'pi pi-file-excel',
      active: false, url: "tasks"
    },
    {
      label: 'Add Task', icon: 'pi pi-plus-circle',
      active: false, url: "create"
    },
    {
      label: 'Pending Task', icon: 'pi pi-folder-open',
      active: false, url: "pending"
    },
    {
      label: 'Calendar View', icon: 'pi pi-calendar',
      active: false, url: "calender-view"
    }
  ];

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.

    let matchedRouter = this.sidebarItems.find(f => this.router.url?.endsWith(f.url));
    if (matchedRouter) {
      matchedRouter.active = true;
    }

  }

  setActive(item: any): void {
    this.sidebarItems.forEach(i => (i.active = false)); // Reset all items
    item.active = true; // Set the clicked item as active
  }

}
