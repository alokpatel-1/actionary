import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReaderComponent } from './reader.component';
import { FeedComponent } from './feed/feed.component';
import { NoteViewComponent } from './note-view/note-view.component';
import { TrendingComponent } from './trending/trending.component';
import { PublisherProfileComponent } from './publisher-profile/publisher-profile.component';

const routes: Routes = [
  {
    path: '',
    component: ReaderComponent,
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'feed', component: FeedComponent },
      { path: 'trending', component: TrendingComponent },
      { path: 'notes/:id', component: NoteViewComponent },
      { path: 'publisher/:id', component: PublisherProfileComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReaderRoutingModule { }
