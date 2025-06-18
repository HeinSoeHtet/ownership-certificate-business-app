import { Component } from '@angular/core';
import { Navbar } from '../../layouts/navbar/navbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ImageUpload } from '../../components/image-upload/image-upload';

@Component({
  selector: 'app-new-certificate',
  imports: [
    Navbar,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ImageUpload,
  ],
  templateUrl: './new-certificate.html',
  styleUrl: './new-certificate.scss',
})
export class NewCertificate {}
