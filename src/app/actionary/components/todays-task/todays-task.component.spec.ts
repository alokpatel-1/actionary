import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodaysTaskComponent } from './todays-task.component';

describe('TodaysTaskComponent', () => {
  let component: TodaysTaskComponent;
  let fixture: ComponentFixture<TodaysTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodaysTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TodaysTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
