import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalonFama } from './salon-fama';

describe('SalonFama', () => {
  let component: SalonFama;
  let fixture: ComponentFixture<SalonFama>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalonFama],
    }).compileComponents();

    fixture = TestBed.createComponent(SalonFama);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
