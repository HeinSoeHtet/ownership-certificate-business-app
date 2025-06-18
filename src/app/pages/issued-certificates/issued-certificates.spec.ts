import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuedCertificates } from './issued-certificates';

describe('IssuedCertificates', () => {
  let component: IssuedCertificates;
  let fixture: ComponentFixture<IssuedCertificates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuedCertificates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssuedCertificates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
