import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricosComponent } from './historicos.component';

describe('HistoricosComponent', () => {
  let component: HistoricosComponent;
  let fixture: ComponentFixture<HistoricosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HistoricosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistoricosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
