import { Component, inject, signal } from '@angular/core';
import { ImportsModule } from '../../imports';
import { ActionaryUtilService } from '../../services/actionary-util.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-sidebar',
    imports: [ImportsModule, RouterLink],
    standalone: true,
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
    readonly utilService = inject(ActionaryUtilService);

    sidebarItems = [
        {
            label: 'Upcoming', icon: 'pi pi-arrow-circle-right',
            active: false, url: "upcoming"
        },
        {
            label: 'Today', icon: 'pi pi-file-excel',
            active: true, url: "task"
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

    setActive(item: any): void {
        this.sidebarItems.forEach(i => (i.active = false)); // Reset all items
        item.active = true; // Set the clicked item as active
    }

}
