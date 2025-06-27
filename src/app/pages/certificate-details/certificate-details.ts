import { Component, inject, signal } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { WalletState, Web3 as Web3Service } from '../../services/web3';
import { ActivatedRoute } from '@angular/router';
import { formatInTimeZone } from 'date-fns-tz';

import {
  Business as BusinessService,
  CertificateDetails as ICertificateDetails,
  ProductDetails,
} from '../../services/business';
import { Navbar } from '../../layouts/navbar/navbar';
import { Ipfs as IpfsService } from '../../services/ipfs';

@Component({
  selector: 'app-certificate-details',
  imports: [Navbar],
  templateUrl: './certificate-details.html',
  styleUrl: './certificate-details.css',
})
export class CertificateDetails {
  private route = inject(ActivatedRoute);

  web3Service = inject(Web3Service);
  businessService = inject(BusinessService);
  ipfsService = inject(IpfsService);
  walletState$: Observable<WalletState>;

  certificateDetails = signal<ICertificateDetails | null>(null);
  productDetails = signal<ProductDetails | null>(null);

  private subscriptions: Subscription[] = [];
  walletAddress = signal('');
  certificateId = signal('');

  constructor() {
    this.walletState$ = this.web3Service.walletState$;
  }

  async ngOnInit() {
    this.certificateId.set(this.route.snapshot.params['id']);
    const walletSub = this.walletState$.subscribe(async (state) => {
      if (state.connected && state.isCorrectNetwork && state.address) {
        const certificateDetails =
          (await this.businessService.getCertificateDetails(
            this.certificateId()
          )) as ICertificateDetails;

        const productDetails = (await this.ipfsService.getMetadata(
          certificateDetails.metadataUri
        )) as ProductDetails;

        productDetails.image = this.ipfsService.resolveIpfsUri(
          productDetails?.image as string
        );

        this.productDetails.set(productDetails);
        this.certificateDetails.set(certificateDetails);
      }
    });

    this.subscriptions.push(walletSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return formatInTimeZone(date, 'UTC', 'yyyy-MM-dd HH:mm:ss zzz');
  }
}
