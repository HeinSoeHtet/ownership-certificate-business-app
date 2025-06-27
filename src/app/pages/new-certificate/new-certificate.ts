import { Component, inject } from '@angular/core';
import { Navbar } from '../../layouts/navbar/navbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ImageUpload } from '../../components/image-upload/image-upload';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Ipfs as IpfsService } from '../../services/ipfs';
import { Business as BusinessService } from '../../services/business';
import { Snackbar } from '../../components/snackbar/snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-new-certificate',
  imports: [
    Navbar,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ImageUpload,
    ReactiveFormsModule,
  ],
  templateUrl: './new-certificate.html',
  styleUrl: './new-certificate.scss',
})
export class NewCertificate {
  private _snackBar = inject(MatSnackBar);

  ipfsService = inject(IpfsService);
  businessService = inject(BusinessService);

  public readonly certificateForm = new FormGroup({
    recipientAddress: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    productName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    imageFile: new FormControl<File | null>(null, {
      validators: [Validators.required],
    }),
  });

  async submitForm(): Promise<void> {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }
    const { recipientAddress, productName, description, imageFile } =
      this.certificateForm.getRawValue();

    try {
      // 1. Upload image to get its hash
      const imageHash = await this.ipfsService.uploadFile(imageFile as File);
      console.log('Image uploaded. Hash:', imageHash);
      // 2. Create metadata object
      const metadata = {
        name: productName,
        description: description,
        image: `ipfs://${imageHash}`,
      };
      // 3. Upload metadata to get its hash
      const metadataHash = await this.ipfsService.uploadMetadata(metadata);
      console.log('Metadata uploaded. Hash:', metadataHash);
      const metadataURI = `ipfs://${metadataHash}`;
      // 4. Call the BusinessService to mint the certificate
      console.log('Minting certificate with metadata:', metadataURI);

      await this.businessService.mintCertificate(
        recipientAddress,
        metadataHash,
        metadataURI
      );

      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'Successfully minted certificate!',
        },
      });
    } catch (error) {
      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'Error minting certificate!',
        },
      });
      console.error('Error minting certificate:', error);
    }
  }
}
