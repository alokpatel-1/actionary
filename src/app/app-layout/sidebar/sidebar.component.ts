import { Component, inject, OnInit, signal } from '@angular/core';
import { ImportsModule } from '../../imports';
import { ActionaryUtilService } from '../../services/actionary-util.service';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

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
      label: 'Today', icon: 'pi pi-file-excel',
      active: false, url: "tasks"
    },
    {
      label: 'Add Task', icon: 'pi pi-plus-circle',
      active: false, url: "create"
    },
    {
      label: 'Expenses', icon: 'pi pi-wallet',
      active: false, url: "/expenses"
    },
    // {
    //   label: 'Pending Task', icon: 'pi pi-folder-open',
    //   active: false, url: "pending"
    // },
    // {
    //   label: 'Calendar View', icon: 'pi pi-calendar',
    //   active: false, url: "calender-view"
    // }
  ];

  ngOnInit(): void {
    this.updateSelectedMenu();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSelectedMenu();
      });

  }

  updateSelectedMenu() {
    const url = this.router.url ?? '';
    this.sidebarItems.forEach(item => {
      item.active = url === item.url || (item.url !== '/expenses' && url.endsWith(item.url)) || (item.url === '/expenses' && url.startsWith('/expenses'));
    });
  }

  setActive(item: any): void {
    this.sidebarItems.forEach(i => (i.active = false)); // Reset all items
    item.active = true; // Set the clicked item as active
  }

}
