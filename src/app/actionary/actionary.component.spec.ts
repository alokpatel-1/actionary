import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionaryComponent } from './actionary.component';


describe('ActionaryComponent', () => {
  let component: ActionaryComponent;
  let fixture: ComponentFixture<ActionaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionaryComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ActionaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
