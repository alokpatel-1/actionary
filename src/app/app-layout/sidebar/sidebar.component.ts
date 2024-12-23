import { Component, inject, signal } from '@angular/core';
import { ImportsModule } from '../../imports';
import { ActionaryUtilService } from '../../services/actionary-util.service';

@Component({
    selector: 'app-sidebar',
    imports: [ImportsModule],
    standalone: true,
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
    readonly utilService = inject(ActionaryUtilService);


    toggleSideBar() {
        this.utilService.isSideBarCloser.set(!this.utilService.isSideBarCloser());
    }
}
