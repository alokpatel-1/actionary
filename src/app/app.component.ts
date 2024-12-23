import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImportsModule } from './imports';
import { SidebarComponent } from './app-layout/sidebar/sidebar.component';
import { TopBarComponent } from './app-layout/top-bar/top-bar.component';
import { RouterOutlet } from '@angular/router';
import { ActionaryUtilService } from './services/actionary-util.service';

const imports = [
    FormsModule,
    ImportsModule,
    SidebarComponent,
    TopBarComponent,
    RouterOutlet
];
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [...imports],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
    readonly utilService = inject(ActionaryUtilService);
}
