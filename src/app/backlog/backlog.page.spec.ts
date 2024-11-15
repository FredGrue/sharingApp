import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BacklogPage } from './backlog.page';

describe('BacklogPage', () => {
  let component: BacklogPage;
  let fixture: ComponentFixture<BacklogPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BacklogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
