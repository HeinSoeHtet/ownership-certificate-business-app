import { Component, inject, signal } from '@angular/core';
import { Navbar } from '../../layouts/navbar/navbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subscription } from 'rxjs';
import { WalletState, Web3 as Web3Service } from '../../services/web3';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BusinessInfo,
  Business as BusinessService,
} from '../../services/business';

@Component({
  selector: 'app-dashboard',
  imports: [Navbar, MatProgressBarModule, MatButtonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  web3Service = inject(Web3Service);
  businessService = inject(BusinessService);

  walletState$: Observable<WalletState>;

  private subscriptions: Subscription[] = [];
  businessInfo = signal<BusinessInfo | null>(null);

  constructor() {
    this.walletState$ = this.web3Service.walletState$;
  }

  async ngOnInit() {
    const walletSub = this.walletState$.subscribe(async (state) => {
      if (state.connected && state.isCorrectNetwork && state.address) {
        const businessInfo =
          await this.businessService.getBusinessDashboardInfo(state.address);
        this.businessInfo.set(businessInfo);

        // const result = await this.governanceService.getAuthorizedBusinesses();
        console.log(businessInfo);
      }
    });

    this.subscriptions.push(walletSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
