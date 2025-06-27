import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'new-certificate',
    loadComponent: () =>
      import('./pages/new-certificate/new-certificate').then(
        (m) => m.NewCertificate
      ),
  },
  {
    path: 'issued-certificates',
    loadComponent: () =>
      import('./pages/issued-certificates/issued-certificates').then(
        (m) => m.IssuedCertificates
      ),
  },
  {
    path: 'issued-certificates/:id',
    loadComponent: () =>
      import('./pages/certificate-details/certificate-details').then(
        (m) => m.CertificateDetails
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
