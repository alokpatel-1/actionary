import { Component } from '@angular/core';

@Component({
    selector: 'app-create-task',
    standalone: false,
    templateUrl: './create-task.component.html',
    styleUrl: './create-task.component.scss'
})
export class CreateTaskComponent {
    status = [
        { "name": "To Do", "code": "TODO", "color": "#3498db" },
        { "name": "In Progress", "code": "INPROG", "color": "#f39c12" },
        { "name": "Done", "code": "DONE", "color": "#2ecc71" },
        { "name": "Hold", "code": "HOLD", "color": "#e74c3c" }
    ];

    priority = [
        { "name": "Highest", "code": "HIGHEST", "color": "#c0392b" },
        { "name": "High", "code": "HIGH", "color": "#e74c3c" },
        { "name": "Medium", "code": "MEDIUM", "color": "#f1c40f" },
        { "name": "Low", "code": "LOW", "color": "#27ae60" },
        { "name": "Lowest", "code": "LOWEST", "color": "#16a085" }
    ];

    tags = [
        { "name": "Frontend", "code": "FRONTEND", "color": "#3498db" },
        { "name": "Backend", "code": "BACKEND", "color": "#2ecc71" },
        { "name": "Bug", "code": "BUG", "color": "#e74c3c" },
        { "name": "Feature", "code": "FEATURE", "color": "#9b59b6" },
        { "name": "Improvement", "code": "IMPROVE", "color": "#f39c12" }
    ]


    createdat: any = new Date();
}
