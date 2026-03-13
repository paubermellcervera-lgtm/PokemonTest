import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cambio } from './cambio';

describe('Cambio', () => {
  let component: Cambio;
  let fixture: ComponentFixture<Cambio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cambio],
    }).compileComponents();

    fixture = TestBed.createComponent(Cambio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
