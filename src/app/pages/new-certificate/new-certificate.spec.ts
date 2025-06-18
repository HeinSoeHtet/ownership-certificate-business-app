import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCertificate } from './new-certificate';

describe('NewCertificate', () => {
  let component: NewCertificate;
  let fixture: ComponentFixture<NewCertificate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCertificate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewCertificate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
