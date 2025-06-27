import { Injectable } from '@angular/core';
import { Web3 as Web3Service } from './web3'; // Assuming web3.service.ts path
import { ethers, EventLog } from 'ethers';

// Define the data structure for a business's dashboard
export interface BusinessInfo {
  isAuthorized: boolean;
  businessName: string;
  totalMinted: number;
  dailyMintLimit: number;
  dailyMintCount: number;
  remainingLimit: number;
}

// Define the structure for a batch minting operation
export interface BatchMintData {
  recipient: string;
  ipfsHash: string;
  metadataURI: string;
}

// NEW: Define a summary structure for previously minted certificates
export interface MintedCertificateSummary {
  tokenId: string;
  recipient: string; // The address it was minted to
  ipfsHash: string;
  blockNumber: number;
}

export interface CertificateDetails {
  tokenId: string;
  owner: string;
  ipfsHash: string;
  metadataUri: string;
  originalMinter: string;
  mintTimestamp: number;
  isAuthentic: boolean;
  businessName: string;
  history: OwnershipRecord[];
}

export interface OwnershipRecord {
  owner: string;
  timestamp: number;
}

export interface ProductDetails {
  name: string;
  description: string;
  image: string;
}

@Injectable({
  providedIn: 'root',
})
export class Business {
  constructor(private web3Service: Web3Service) {}

  /**
   * Mints a single certificate to a recipient.
   * This is the primary function for the "Mint Certificate" page.
   * @param recipient The address of the new owner.
   * @param ipfsHash The IPFS hash of the product data.
   * @param metadataURI The full IPFS URI for the metadata JSON file.
   * @returns A promise that resolves with the transaction result.
   */
  async mintCertificate(
    recipient: string,
    ipfsHash: string,
    metadataURI: string
  ): Promise<{
    success: boolean;
    tokenId?: string;
    txHash?: string;
    error?: string;
  }> {
    try {
      if (!ethers.isAddress(recipient))
        throw new Error('Invalid recipient address');
      if (!ipfsHash) throw new Error('IPFS hash is required');

      const result = await this.web3Service.executeTransaction(
        'certificate',
        'mintCertificate',
        [recipient, ipfsHash, metadataURI]
      );

      if (!result.success)
        throw new Error(result.error || 'Transaction failed');

      // Extract the tokenId from the receipt
      const tokenId = this.web3Service
        .parseEventFromReceipt(result.receipt, 'certificate', 'ProductMinted')
        ?.args['tokenId'].toString();

      return { success: true, tokenId, txHash: result.receipt?.hash };
    } catch (error: any) {
      console.error('❌ Mint failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mints multiple certificates in a single transaction.
   * @param batchData An array of objects containing recipient and metadata for each certificate.
   * @returns A promise resolving with the transaction result, including an array of minted token IDs.
   */
  async batchMintCertificates(batchData: BatchMintData[]): Promise<{
    success: boolean;
    tokenIds?: string[];
    txHash?: string;
    error?: string;
  }> {
    try {
      if (!batchData || batchData.length === 0)
        throw new Error('Batch data is empty');

      const result = await this.web3Service.executeTransaction(
        'certificate',
        'batchMintCertificates',
        [batchData]
      );

      if (!result.success) throw new Error(result.error || 'Batch mint failed');

      // Extract all ProductMinted events from the receipt
      const tokenIds = this.web3Service
        .parseAllEventsFromReceipt(
          result.receipt,
          'certificate',
          'ProductMinted'
        )
        .map((event) => event.args['tokenId'].toString());

      return { success: true, tokenIds, txHash: result.receipt?.hash };
    } catch (error: any) {
      console.error('❌ Batch mint failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetches all relevant information for a business's dashboard.
   * @param businessAddress The address of the business to look up.
   * @returns A detailed business info object or null if not found.
   */
  async getBusinessDashboardInfo(
    businessAddress: string
  ): Promise<BusinessInfo | null> {
    try {
      if (!ethers.isAddress(businessAddress)) return null;

      const businessData = await this.web3Service.callViewFunction(
        'businessManager',
        'getBusinessInfo',
        [businessAddress]
      );

      const remainingLimit = await this.web3Service.callViewFunction(
        'businessManager',
        'getRemainingDailyLimit',
        [businessAddress]
      );

      return {
        isAuthorized: businessData.isAuthorized,
        businessName: businessData.businessName,
        totalMinted: Number(businessData.totalMinted),
        dailyMintLimit: Number(businessData.dailyMintLimit),
        dailyMintCount: Number(businessData.dailyMintCount),
        remainingLimit: Number(remainingLimit),
      };
    } catch (error: any) {
      console.error(
        `❌ Failed to get info for business ${businessAddress}:`,
        error
      );
      return null;
    }
  }

  /**
   * NEW: Retrieves a list of all certificates minted by a specific business by querying past events.
   * @param businessAddress The wallet address of the business.
   * @returns An array of certificate summaries.
   */
  async getMintedByBusiness(
    businessAddress: string
  ): Promise<MintedCertificateSummary[]> {
    try {
      if (!ethers.isAddress(businessAddress)) {
        console.error('Invalid business address provided.');
        return [];
      }

      const certificateContract =
        this.web3Service.getReadOnlyContract('certificate');
      if (!certificateContract) {
        throw new Error('Certificate contract not available.');
      }

      // The ProductMinted event is defined as:
      // event ProductMinted(uint256 indexed tokenId, address indexed business, address indexed owner, string ipfsHash);
      // We can create a filter to find all events where the `business` address matches.
      const filter = await certificateContract.filters['ProductMinted'](
        null,
        businessAddress
      );

      // Query the blockchain for all historical events matching the filter.
      const events = await certificateContract.queryFilter(filter, 0, 'latest');

      console.log(
        `Found ${events.length} certificates minted by ${businessAddress}`
      );

      // Map the raw event data into a clean, typed array for the UI.
      const summaries = events
        .map((event) => {
          // CORRECTED: Add a type guard to ensure 'args' exists before accessing it.
          if (event instanceof EventLog && event.args) {
            return {
              tokenId: event.args['tokenId'].toString(),
              recipient: event.args['owner'],
              ipfsHash: event.args['ipfsHash'],
              blockNumber: event.blockNumber,
            };
          }
          return null;
        })
        .filter(
          (summary): summary is MintedCertificateSummary => summary !== null
        ); // Filter out any nulls

      // Reverse the list to show the most recently minted certificates first.
      return summaries.reverse();
    } catch (error) {
      console.error('❌ Failed to retrieve minted certificates:', error);
      return [];
    }
  }

  /**
   * Fetches all details for a single certificate, including its full history.
   * This is the primary function for the verification and certificate details pages.
   * @param tokenId The ID of the token to look up.
   * @returns A detailed certificate object or null if not found.
   */
  async getCertificateDetails(
    tokenId: string
  ): Promise<CertificateDetails | null> {
    try {
      console.log(
        `📖 Verifying and fetching details for certificate #${tokenId}...`
      );

      const [owner, productInfo, verification, history, tokenUri] =
        await Promise.all([
          this.web3Service.callViewFunction('certificate', 'ownerOf', [
            tokenId,
          ]),
          this.web3Service.callViewFunction('certificate', 'getProductInfo', [
            tokenId,
          ]),
          this.web3Service.callViewFunction(
            'certificate',
            'verifyAuthenticity',
            [tokenId]
          ),
          this.web3Service.callViewFunction(
            'certificate',
            'getOwnershipHistory',
            [tokenId]
          ),
          this.web3Service.callViewFunction('certificate', 'tokenURI', [
            tokenId,
          ]),
        ]);

      const formattedHistory = history.map((record: any) => ({
        owner: record.owner,
        timestamp: Number(record.timestamp),
      }));

      return {
        tokenId,
        owner,
        ipfsHash: productInfo.ipfsHash,
        metadataUri: tokenUri,
        originalMinter: productInfo.originalMinter,
        mintTimestamp: Number(productInfo.mintTimestamp),
        isAuthentic: verification?.isAuthentic || false,
        businessName: verification?.businessName || 'Unknown',
        history: formattedHistory,
      };
    } catch (error: any) {
      console.error(`❌ Failed to get certificate ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Allows the original minter to update the IPFS hash associated with a certificate.
   * @param tokenId The ID of the token to update.
   * @param newIpfsHash The new IPFS hash for the product data.
   * @returns A promise resolving with the transaction result.
   */
  async updateProductData(
    tokenId: string,
    newIpfsHash: string
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      const result = await this.web3Service.executeTransaction(
        'certificate',
        'updateProductData',
        [tokenId, newIpfsHash]
      );

      if (!result.success) {
        throw new Error(result.error || 'Update failed');
      }

      return { success: true, txHash: result.receipt?.hash };
    } catch (error: any) {
      console.error(`❌ Failed to update data for token ${tokenId}:`, error);
      return { success: false, error: error.message };
    }
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}.....${address.slice(-4)}`;
  }
}
