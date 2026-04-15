import { TradeExecutor, TOKENS } from '../trade/TradeExecutor.js';
import { formatEther, parseEther } from 'viem';

// Refill when OKB drops below this level
const MIN_BALANCE   = 0.005;  // OKB — warn threshold
const REFILL_TARGET = 0.02;   // OKB — target after refill
const USDC_RESERVE  = 1.0;    // USDC — minimum to keep, don't drain completely

export class GasVault {
  private executor: TradeExecutor;
  private lastRefillTime = 0;
  private REFILL_COOLDOWN = 5 * 60 * 1000; // 5 minute cooldown between refills

  constructor(executor: TradeExecutor) {
    this.executor = executor;
  }

  /**
   * Check gas balance and auto-refill from USDC if OKB is critically low.
   * Part of the Earn → Pay → Earn loop.
   */
  async checkAndRefill(): Promise<void> {
    try {
      const balStr = await this.executor.getBalance();
      const bal    = parseFloat(balStr);
      console.log(`[GasVault] 💰 OKB balance: ${bal.toFixed(6)} OKB`);

      if (bal >= MIN_BALANCE) {
        console.log(`[GasVault] ✅ Gas healthy (${bal.toFixed(6)} OKB ≥ ${MIN_BALANCE} threshold).`);
        return;
      }

      // ── Low gas — check cooldown ────────────────────────────────────────
      const now = Date.now();
      if (now - this.lastRefillTime < this.REFILL_COOLDOWN) {
        const waitSec = Math.ceil((this.REFILL_COOLDOWN - (now - this.lastRefillTime)) / 1000);
        console.warn(`[GasVault] ⏳ Low OKB (${bal.toFixed(6)}) but cooldown active. Retry in ${waitSec}s.`);
        return;
      }

      // ── Attempt auto-refill: swap USDC → OKB ────────────────────────────
      console.warn(`[GasVault] ⚠️  LOW GAS: ${bal.toFixed(6)} OKB < ${MIN_BALANCE} threshold.`);
      console.log(`[GasVault] 🔄 AUTO-REFILL: Swapping USDC → OKB to reach ${REFILL_TARGET} OKB...`);

      try {
        // Swap a fixed small USDC amount to OKB (enough for ~10 transactions)
        // Using 1.5 USDC as refill amount (~$1.50 worth of OKB)
        const refillAmount = '1.5';
        const txHash = await this.executor.manualExecuteSwap(TOKENS.USDC, TOKENS.OKB_NATIVE, refillAmount);

        this.lastRefillTime = Date.now();
        console.log(`[GasVault] ✅ GAS REFILL SUCCESS!`);
        console.log(`[GasVault] TX: ${txHash}`);
        console.log(`[GasVault] Explorer: https://www.okx.com/web3/explorer/xlayer/tx/${txHash}`);

        // Verify new balance
        const newBal = parseFloat(await this.executor.getBalance());
        console.log(`[GasVault] New OKB balance: ${newBal.toFixed(6)} OKB`);

      } catch (swapErr: any) {
        console.error(`[GasVault] ❌ Auto-refill failed: ${swapErr.message}`);
        console.warn(`[GasVault] Manual action required: Fund wallet ${this.executor.getAccountAddress()} with OKB.`);
      }

    } catch (e: any) {
      console.error('[GasVault] Balance check failed:', e.message);
    }
  }

  /**
   * Check USDC balance to decide if auto-refill is feasible.
   * Prevents draining the entire USDC reserve.
   */
  async canRefillFromUSDC(): Promise<boolean> {
    try {
      const usdcBal = await this.executor.getBalanceOf(TOKENS.USDC);
      const usdcFloat = parseFloat(usdcBal) / 1e6; // USDC has 6 decimals
      return usdcFloat > USDC_RESERVE + 1.5; // need at least reserve + refill amount
    } catch {
      return false;
    }
  }

  /**
   * Get vault status for UI display.
   */
  async getStatus(): Promise<{ okb: string; healthy: boolean; autoRefillEnabled: boolean }> {
    try {
      const bal     = parseFloat(await this.executor.getBalance());
      const healthy = bal >= MIN_BALANCE;
      const canRefill = await this.canRefillFromUSDC();
      return {
        okb:               bal.toFixed(6),
        healthy,
        autoRefillEnabled: canRefill,
      };
    } catch {
      return { okb: '0', healthy: false, autoRefillEnabled: false };
    }
  }
}
