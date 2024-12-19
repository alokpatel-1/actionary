import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImportsModule } from './imports';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [FormsModule, ImportsModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {

}
