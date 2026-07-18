import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReaderComponent } from './reader.component';
import { FeedComponent } from './feed/feed.component';
import { NoteViewComponent } from './note-view/note-view.component';

const routes: Routes = [
  {
    path: '',
    component: ReaderComponent,
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'feed', component: FeedComponent },
      { path: 'notes/:id', component: NoteViewComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReaderRoutingModule { }
