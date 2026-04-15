import { TradeExecutor, TOKENS } from '../trade/TradeExecutor.js';
import { formatEther } from 'viem';

const MIN_BALANCE = 0.005; // OKB — below this, warn but don't auto-swap (avoid loops)

export class GasVault {
  private executor: TradeExecutor;

  constructor(executor: TradeExecutor) {
    this.executor = executor;
  }

  async checkAndRefill(): Promise<void> {
    try {
      const balStr = await this.executor.getBalance();
      const bal = parseFloat(balStr);
      console.log(`[GasVault] 💰 Wallet balance: ${bal.toFixed(6)} OKB`);

      if (bal < MIN_BALANCE) {
        console.warn(`[GasVault] ⚠️  Low balance (${bal.toFixed(6)} OKB). Please fund wallet: ${this.executor.getAccountAddress()}`);
        // We skip auto-refill here — the wallet needs OKB to swap, can't self-fund from zero
      } else {
        console.log(`[GasVault] ✅ Gas healthy. Continuing autonomous loop.`);
      }
    } catch (e) {
      console.error('[GasVault] Balance check failed:', e);
    }
  }
}
