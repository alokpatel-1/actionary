import { TestBed } from '@angular/core/testing';

import { ActionaryUtilService } from './actionary-util.service';

describe('ActionaryUtilService', () => {
  let service: ActionaryUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActionaryUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
