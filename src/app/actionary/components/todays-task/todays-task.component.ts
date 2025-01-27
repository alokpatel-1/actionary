import { Component, inject } from '@angular/core';
import { FirebaseStoreService } from '../../../firebase/firebase-store.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-todays-task',
  standalone: false,
  templateUrl: './todays-task.component.html',
  styleUrl: './todays-task.component.scss'
})
export class TodaysTaskComponent {
  readonly firebasedb = inject(FirebaseStoreService);

  cards = [
    {
      id: 1,
      createAt: new Date(),
      accordion: [
        {
          header: 'Header I',
          createAt: new Date(),
          content:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero? Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?',
        },
        {
          header: 'Header II',
          createAt: new Date(),
          content:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?',
        },
        {
          header: 'Header III',
          createAt: new Date(),
          content:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?',
        },
      ],
    },
    {
      id: 2,
      createAt: new Date(),
      accordion: [
        {
          header: 'Header I',
          createAt: new Date(),
          content:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?',
        },
        {
          header: 'Header II',
          createAt: new Date(),
          content:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?',
        },
        {
          header: 'Header III',
          createAt: new Date(),
          content:
            'Lorem ipsum dolor sit amet consectetur adipisicing elit.Nemo ab, hic, animi enim eum nostrum, illum harum iure facere optio expedita vel rerum eius non natus voluptatem laudantium.Nihil, libero?',
        },
      ],
    }
  ];

  menudata: MenuItem[] = [];

  ngOnInit() {
    this.menudata = [
      {
        label: 'Refresh',
        icon: 'pi pi-refresh',
        command: (event) => {
          console.log('@ hhh', event);

        }
      },
      {
        label: 'Search',
        icon: 'pi pi-search',
        command: (event) => {
          console.log('@ hhh', event);

        }
      },
      {
        separator: true
      },
      {
        label: 'Delete',
        icon: 'pi pi-times',
        command: (event) => {
          console.log('@ hhh', event);

        }
      }
    ];
  }
}
