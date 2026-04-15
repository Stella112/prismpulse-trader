import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// ─── Onchain OS API Configuration ────────────────────────────────────────────
// Uses the OKX Onchain OS Market Module (authenticated)
// Docs: https://web3.okx.com/onchainos/dev-docs/market/market-api-introduction.md
const ONCHAINOS_BASE = 'https://www.okx.com';
const API_KEY        = process.env.OKX_ONCHAINOS_API_KEY || '';
const SECRET_KEY     = process.env.OKX_SECRET_KEY || '';
const PASSPHRASE     = process.env.OKX_PASSPHRASE || '';

// XLAYER chain ID for Onchain OS
const XLAYER_CHAIN_ID = '196';

/**
 * Generate OKX Onchain OS authentication headers
 * Required for all authenticated Onchain OS API calls
 * Ref: https://web3.okx.com/onchainos/dev-docs/home/api-access-and-usage.md
 */
function getOnchainOSHeaders(method: string, path: string, body = ''): Record<string, string> {
  const timestamp = new Date().toISOString();
  const prehash   = timestamp + method.toUpperCase() + path + body;
  const sign      = crypto.createHmac('sha256', SECRET_KEY).update(prehash).digest('base64');
  return {
    'Content-Type':       'application/json',
    'OK-ACCESS-KEY':      API_KEY,
    'OK-ACCESS-SIGN':     sign,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': PASSPHRASE,
  };
}

export class SignalScanner {

  /**
   * Scan X Layer token rankings using Onchain OS Market Module.
   * Module: Token Ranking List
   * Endpoint: GET /api/v5/dex/market/token-list
   * Docs: https://web3.okx.com/onchainos/dev-docs/market/market-token-ranking.md
   */
  async scanMemeTrenches(): Promise<any[]> {
    console.log('[SignalScanner] 📡 [Onchain OS Market Module] Fetching X Layer token rankings...');
    try {
      const path = `/api/v5/dex/market/token-price-info?chainId=${XLAYER_CHAIN_ID}`;
      const res = await fetch(`${ONCHAINOS_BASE}${path}`, {
        headers: getOnchainOSHeaders('GET', path)
      });
      const data = await res.json() as any;

      if (data.code === '0' && data.data?.length) {
        const tokens = data.data.slice(0, 10).map((t: any) => ({
          ticker:    `${t.symbol}-USDT`,
          price:     parseFloat(t.price || '0'),
          change24h: (parseFloat(t.priceChange24h || '0') * 100).toFixed(2) + '%',
          vol24h:    parseFloat(t.volume24h || '0').toFixed(0),
          score:     Math.min(99, Math.round(parseFloat(t.volume24h || '0') / 100_000)),
          address:   t.tokenContractAddress,
          chainId:   XLAYER_CHAIN_ID,
          source:    'OnchainOS:Market:TokenRanking'
        }));
        console.log(`[SignalScanner] ✅ Onchain OS returned ${tokens.length} X Layer tokens.`);
        return tokens;
      }
    } catch (e: any) {
      console.warn('[SignalScanner] Onchain OS token ranking unavailable, falling back to CEX tickers.');
    }

    // Fallback: OKX CEX tickers (same underlying OKX infrastructure)
    return this.scanCEXTrenches();
  }

  /**
   * CEX fallback — OKX Spot market tickers for momentum signals.
   * Correlated with X Layer activity via OKB/USDC bridging pairs.
   */
  async scanCEXTrenches(): Promise<any[]> {
    console.log('[SignalScanner] 📡 [Onchain OS Market Module] Fetching OKX SPOT tickers...');
    try {
      const path = '/api/v5/market/tickers?instType=SPOT';
      const res  = await fetch(`${ONCHAINOS_BASE}${path}`, {
        headers: getOnchainOSHeaders('GET', path)
      });
      const data = await res.json() as any;

      if (data.code !== '0' || !data.data) return this.fallback();

      const sorted = [...data.data]
        .sort((a: any, b: any) => parseFloat(b.volCcy24h) - parseFloat(a.volCcy24h))
        .slice(0, 10)
        .map((t: any) => ({
          ticker:    t.instId,
          price:     parseFloat(t.last),
          change24h: ((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100).toFixed(2) + '%',
          vol24h:    parseFloat(t.volCcy24h).toFixed(0),
          score:     Math.min(99, Math.round(parseFloat(t.volCcy24h) / 10_000_000)),
          source:    'OnchainOS:Market:CEXTicker'
        }));

      console.log(`[SignalScanner] Got ${sorted.length} tickers. Top: ${sorted[0]?.ticker} (vol: $${sorted[0]?.vol24h})`);
      return sorted;
    } catch {
      return this.fallback();
    }
  }

  /**
   * Wallet balance check via Onchain OS Wallet Module.
   * Module: Get Total Token Balances
   * Docs: https://web3.okx.com/onchainos/dev-docs/wallet/balance-api-all-token-balances.md
   */
  async getWalletBalances(address: string): Promise<any[]> {
    console.log('[SignalScanner] 💰 [Onchain OS Wallet Module] Fetching wallet balances...');
    try {
      const path = `/api/v5/wallet/asset/all-token-balances?address=${address}&chains=${XLAYER_CHAIN_ID}`;
      const res = await fetch(`${ONCHAINOS_BASE}${path}`, {
        headers: getOnchainOSHeaders('GET', path)
      });
      const data = await res.json() as any;
      if (data.code === '0' && data.data) {
        return data.data;
      }
    } catch (e: any) {
      console.warn('[SignalScanner] Onchain OS wallet balance unavailable.');
    }
    return [];
  }

  /**
   * Transaction history via Onchain OS Wallet Module.
   * Module: Get History by Address
   * Docs: https://web3.okx.com/onchainos/dev-docs/wallet/tx-history-api-history.md
   */
  async getTxHistory(address: string): Promise<any[]> {
    console.log('[SignalScanner] 📜 [Onchain OS Wallet Module] Fetching TX history...');
    try {
      const path = `/api/v5/wallet/post-transaction/transactions?address=${address}&chains=${XLAYER_CHAIN_ID}&limit=20`;
      const res = await fetch(`${ONCHAINOS_BASE}${path}`, {
        headers: getOnchainOSHeaders('GET', path)
      });
      const data = await res.json() as any;
      if (data.code === '0' && data.data) return data.data;
    } catch {
      console.warn('[SignalScanner] Onchain OS TX history unavailable.');
    }
    return [];
  }

  /**
   * Smart money momentum scan (price movement proxy).
   */
  async scanSmartMoney(): Promise<any[]> {
    console.log('[SignalScanner] 🧠 Scanning smart money signals...');
    try {
      const path = '/api/v5/market/tickers?instType=SPOT';
      const res  = await fetch(`${ONCHAINOS_BASE}${path}`, {
        headers: getOnchainOSHeaders('GET', path)
      });
      const data = await res.json() as any;
      if (data.code !== '0' || !data.data) return [];

      const movers = [...data.data]
        .map((t: any) => ({
          ticker:    t.instId,
          momentum:  Math.abs((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100),
          direction: parseFloat(t.last) > parseFloat(t.open24h) ? 'BUY' : 'SELL',
          price:     t.last,
          source:    'OnchainOS:Market:MomentumScan'
        }))
        .filter((t: any) => t.momentum > 3)
        .sort((a: any, b: any) => b.momentum - a.momentum)
        .slice(0, 5);

      console.log(`[SignalScanner] Found ${movers.length} strong movers.`);
      return movers;
    } catch {
      return [];
    }
  }

  async getConsolidatedSignals(): Promise<any> {
    const [trenches, smartMoney] = await Promise.all([
      this.scanMemeTrenches(),
      this.scanSmartMoney(),
    ]);
    return {
      timestamp:  Date.now(),
      network:    'X Layer (ChainID 196)',
      chainId:    XLAYER_CHAIN_ID,
      modules:    ['OnchainOS:Market', 'OnchainOS:Wallet'],
      pulses: {
        trench_activity: trenches,
        smart_money:     smartMoney,
      },
    };
  }

  private fallback() {
    return [
      { ticker: 'OKB-USDT',  price: 0, change24h: '0%', vol24h: '0', score: 50, source: 'fallback' },
      { ticker: 'BTC-USDT',  price: 0, change24h: '0%', vol24h: '0', score: 50, source: 'fallback' },
    ];
  }
}
