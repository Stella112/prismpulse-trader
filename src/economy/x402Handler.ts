import { Request, Response } from 'express';
import { TradeExecutor } from '../trade/TradeExecutor.js';

export class x402Handler {
  private tradeExecutor: TradeExecutor;

  constructor() {
    this.tradeExecutor = new TradeExecutor();
  }

  async handlePrisRequest(req: Request, res: Response) {
    const resourceId = req.params.id;
    const paymentHash = req.headers['authorization']?.toString().split(' ')[1];

    if (!paymentHash) {
      // Step 1: Issue 402 Challenge
      return res.status(402).json({
        error: 'Payment Required',
        message: 'This Prism alert requires a micro-payment to unlock.',
        payment_instructions: {
          address: this.tradeExecutor.getAccountAddress(),
          amount: '0.01',
          currency: 'USDT',
          memo: resourceId,
          chainId: 196
        }
      });
    }

    // Step 2: Verify Payment Proof (Mock verification for Hackathon)
    const isPaid = await this.verifyProof(paymentHash, resourceId);

    if (!isPaid) {
      return res.status(403).json({ error: 'Invalid or missing payment proof.' });
    }

    // Step 3: Grant Access
    return res.json({
      resourceId,
      status: 'UNLOCKED',
      data: {
        prism: 'High confidence alpha detected on token 0x...',
        narrative: 'Whale inflow + Social heat confirmed.'
      }
    });
  }

  private async verifyProof(txHash: string, resourceId: string): Promise<boolean> {
    console.log(`[x402Handler] Verifying proof: ${txHash} for resource ${resourceId}...`);
    // In production, we would use Viem's publicClient to check the TX data
    // match the resourceId and that the receiver is our wallet.
    return true; // Hackathon simulation
  }
}
