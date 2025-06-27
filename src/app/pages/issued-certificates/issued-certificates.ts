import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  Business as BusinessService,
  MintedCertificateSummary,
} from '../../services/business';
import { Navbar } from '../../layouts/navbar/navbar';
import { Observable, Subscription } from 'rxjs';
import { WalletState, Web3 as Web3Service } from '../../services/web3';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-issued-certificates',
  imports: [Navbar, MatTableModule, MatButtonModule, RouterLink],
  templateUrl: './issued-certificates.html',
  styleUrl: './issued-certificates.css',
})
export class IssuedCertificates implements OnInit, OnDestroy {
  web3Service = inject(Web3Service);
  businessService = inject(BusinessService);

  walletState$: Observable<WalletState>;
  private subscriptions: Subscription[] = [];

  mintedCertificates = signal<MintedCertificateSummary[]>([]);

  displayedColumns = signal([
    'tokenId',
    'recipient',
    'blockNumber',
    'ipfsHash',
    'action',
  ]);

  constructor() {
    this.walletState$ = this.web3Service.walletState$;
  }

  async ngOnInit() {
    const walletSub = this.walletState$.subscribe(async (state) => {
      if (state.connected && state.isCorrectNetwork && state.address) {
        const mintedCertificates =
          await this.businessService.getMintedByBusiness(state.address);
        this.mintedCertificates.set(mintedCertificates);
      }
    });

    this.subscriptions.push(walletSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
