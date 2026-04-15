import { Request, Response } from 'express';
import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
dotenv.config();

// X Layer Mainnet chain config
const xlayer = {
  id: 196,
  name: 'X Layer Mainnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: { default: { http: [process.env.X_LAYER_RPC_URL || 'https://rpc.xlayer.tech'] } },
};

// Published Prism signals (in-memory store)
interface PrismSignal {
  id: string;
  ticker: string;
  confidence: number;
  narrative: string;
  strategy: string;
  price: string;
  createdAt: string;
  txHash?: string;
}
const prismStore: Record<string, PrismSignal> = {};

export class x402Handler {
  private agentWallet: string;
  private publicClient: any;

  constructor() {
    const pk = process.env.X_LAYER_WALLET_PK as `0x${string}`;
    this.agentWallet = pk
      ? privateKeyToAccount(pk).address
      : '0x0000000000000000000000000000000000000000';

    this.publicClient = createPublicClient({
      chain: xlayer as any,
      transport: http(process.env.X_LAYER_RPC_URL || 'https://rpc.xlayer.tech'),
    });
  }

  /**
   * Publish a new Prism signal to the x402 paywall.
   * Called by the autonomous loop when a high-confidence Prism is forged.
   */
  publishSignal(prism: any): string {
    const id = `prism_${Date.now()}`;
    prismStore[id] = {
      id,
      ticker:     prism.ticker || prism.strategy || 'SCAN',
      confidence: prism.confidence,
      narrative:  prism.risk_narrative,
      strategy:   prism.strategy,
      price:      prism.suggested_size || '0',
      createdAt:  new Date().toISOString(),
      txHash:     prism.outcome_tx,
    };
    console.log(`[x402Handler] 💸 Signal published: ${id} | ${prism.confidence}% confidence`);
    return id;
  }

  /**
   * Handle incoming requests for Prism signals.
   * Step 1: Return 402 with payment instructions if no payment proof.
   * Step 2: Verify the TX on-chain — check it sent ≥ 0.001 OKB to agent wallet.
   * Step 3: Return the full Prism signal.
   */
  async handlePrisRequest(req: Request, res: Response) {
    const resourceId = req.params.id;
    const paymentTx  = req.headers['x-payment-tx']?.toString() ||
                       req.headers['authorization']?.toString().replace('Bearer ', '');

    const signal = prismStore[resourceId] || prismStore['latest'];

    if (!paymentTx) {
      // ── 402 Challenge ──────────────────────────────────────────────────────
      return res.status(402).json({
        error:   'Payment Required',
        message: 'Send 0.001 OKB to unlock this Prism signal.',
        payment: {
          recipient: this.agentWallet,
          amount:    '0.001',
          token:     'OKB (native)',
          chainId:   196,
          memo:      resourceId,
          note:      'Include X-Payment-TX header with your TX hash after payment.',
        },
        preview: {
          id:         resourceId,
          confidence: signal ? `${signal.confidence}%` : 'unknown',
          strategy:   signal?.strategy || 'PRISM_SIGNAL',
        }
      });
    }

    // ── Verify Payment On-Chain ────────────────────────────────────────────
    const verified = await this.verifyPaymentOnChain(paymentTx as `0x${string}`);

    if (!verified) {
      return res.status(403).json({
        error:   'Payment Unverified',
        message: `TX ${paymentTx.slice(0, 16)}... not found or insufficient. Send ≥ 0.001 OKB to ${this.agentWallet}.`,
      });
    }

    // ── Grant Access ───────────────────────────────────────────────────────
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found. A new Prism will be forged in the next cycle.' });
    }

    console.log(`[x402Handler] ✅ Payment verified. Unlocking signal ${resourceId}`);
    return res.json({
      status:   'UNLOCKED',
      resource: resourceId,
      signal: {
        ticker:     signal.ticker,
        confidence: signal.confidence,
        narrative:  signal.narrative,
        strategy:   signal.strategy,
        createdAt:  signal.createdAt,
        txHash:     signal.txHash,
        chainId:    196,
        source:     'PrismPulse x402 Signal Market',
      }
    });
  }

  /**
   * Real on-chain payment verification using viem.
   * Checks that the TX sent ≥ 0.001 OKB to the agent wallet.
   */
  private async verifyPaymentOnChain(txHash: `0x${string}`): Promise<boolean> {
    try {
      console.log(`[x402Handler] Verifying TX on X Layer: ${txHash.slice(0, 16)}...`);
      const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash });

      if (!receipt || receipt.status !== 'success') {
        console.warn('[x402Handler] TX not found or failed.');
        return false;
      }

      // Get the transaction to check value and recipient
      const tx = await this.publicClient.getTransaction({ hash: txHash });
      const toAddr = tx.to?.toLowerCase();
      const agentAddr = this.agentWallet.toLowerCase();
      const MIN_WEI = BigInt('1000000000000000'); // 0.001 OKB in wei

      if (toAddr !== agentAddr) {
        console.warn(`[x402Handler] TX recipient mismatch: got ${toAddr}, expected ${agentAddr}`);
        return false;
      }

      if (tx.value < MIN_WEI) {
        console.warn(`[x402Handler] Insufficient payment: ${tx.value} < ${MIN_WEI}`);
        return false;
      }

      console.log(`[x402Handler] ✅ Payment verified: ${tx.value} wei from ${tx.from}`);
      return true;
    } catch (e: any) {
      console.error('[x402Handler] On-chain verification error:', e.message);
      return false;
    }
  }

  getLatestSignalId(): string {
    const ids = Object.keys(prismStore);
    return ids[ids.length - 1] || 'none';
  }
}
