import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { PrismResult } from '../utils/OllamaClient.js';

dotenv.config();

export interface SecurityReport {
  isSafe: boolean;
  riskScore: number; // 0-100 (lower = safer)
  details: string[];
  memeMode: boolean; // true if approved under meme_trading_mode
}

const NATIVE_TOKEN = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export class SecurityLayer {
  private apiKey:       string;
  private secretKey:    string;
  private passphrase:   string;
  private riskThreshold: number;

  // meme_trading_mode: lowers security threshold for tokens with strong trench momentum
  private MEME_THRESHOLD = 75;
  private CRITICAL_BLOCK  = 90; // above this = always blocked

  constructor() {
    this.apiKey       = process.env.OKX_API_KEY!;
    this.secretKey    = process.env.OKX_SECRET_KEY!;
    this.passphrase   = process.env.OKX_PASSPHRASE!;
    this.riskThreshold = parseInt(process.env.RISK_THRESHOLD || '35');
  }

  private getHeaders(method: string, path: string, body = '') {
    const timestamp = new Date().toISOString();
    const sign = crypto
      .createHmac('sha256', this.secretKey)
      .update(timestamp + method + path + body)
      .digest('base64');
    return {
      'OK-ACCESS-KEY':        this.apiKey,
      'OK-ACCESS-SIGN':       sign,
      'OK-ACCESS-TIMESTAMP':  timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Vet a prism for a given target token.
   * @param prism         The AI-generated trade signal.
   * @param targetAddress The contract address of the target token.
   * @param trenchScore   Optional: momentum score from the signal scanner (0-100).
   *                      If >= 60, meme_trading_mode is activated with a relaxed threshold.
   */
  async vetPrism(prism: PrismResult, targetAddress: string, trenchScore = 0): Promise<SecurityReport> {
    console.log(`[SecurityLayer] 🛡️  Vetting: ${targetAddress.slice(0, 12)}... | TrenchScore: ${trenchScore}`);
    const details: string[] = [];
    let riskScore = 0;
    let memeMode = false;

    // ── 1. Activate meme_trading_mode if strong trench momentum ──────────────
    if (trenchScore >= 60) {
      memeMode = true;
      details.push(`🔥 Meme Trading Mode ACTIVE (trench score: ${trenchScore})`);
    }

    // ── 2. Native token — always safe ─────────────────────────────────────────
    const isNative = targetAddress.toLowerCase() === NATIVE_TOKEN.toLowerCase();
    if (isNative) {
      details.push('Native OKB — no contract risk.');
      riskScore += 5;
    } else {
      // ── 3. OKX Token Security Check ─────────────────────────────────────────
      try {
        const body  = JSON.stringify({ chainIndex: '196', tokenContractAddress: targetAddress });
        const path  = '/api/v6/dex/market/token/basic-info';
        const res   = await fetch(`https://web3.okx.com${path}`, {
          method: 'POST',
          headers: this.getHeaders('POST', path, body),
          body,
        });
        const data  = await res.json() as any;

        if (data.code === '0' && data.data) {
          const info = data.data;
          details.push(`✅ OKX Token verified: ${info.tokenName || targetAddress}`);
          if (!info.tagList?.length) riskScore += 15;
        } else {
          details.push(`OKX Security: unverified (code ${data.code})`);
          // In meme mode, unverified token adds less risk
          riskScore += memeMode ? 20 : 30;
        }
      } catch {
        details.push('OKX security check unavailable — applying caution buffer.');
        riskScore += memeMode ? 15 : 20;
      }
    }

    // ── 4. Ollama Narrative Sanity Check ─────────────────────────────────────
    const narrative = (prism.risk_narrative || '').toLowerCase();
    if (narrative.includes('honeypot') || narrative.includes('rug')) {
      details.push('⚠️  Rug/honeypot pattern in narrative — HARD BLOCK.');
      riskScore += 60; // Always block rugs regardless of mode
    } else if (narrative.includes('risk') || narrative.includes('caution')) {
      details.push('Moderate risk in narrative.');
      riskScore += 10;
    } else {
      details.push('Narrative clean — no red flags.');
    }

    // ── 5. Confidence Penalty ────────────────────────────────────────────────
    if (prism.confidence < 70) {
      riskScore += 20;
      details.push(`Low confidence (${prism.confidence}%) increases risk.`);
    }

    // ── 6. Determine safety based on mode ────────────────────────────────────
    let effectiveThreshold: number;
    if (memeMode) {
      effectiveThreshold = this.MEME_THRESHOLD;
      details.push(`🎯 Meme threshold: ${this.MEME_THRESHOLD}/100`);
    } else {
      effectiveThreshold = this.riskThreshold;
    }

    // Hard block above critical threshold regardless of mode
    const isSafe = riskScore <= effectiveThreshold && riskScore < this.CRITICAL_BLOCK;
    console.log(`[SecurityLayer] Risk: ${riskScore}/100 | Threshold: ${effectiveThreshold} | MemeMode: ${memeMode} | Safe: ${isSafe}`);

    return { isSafe, riskScore, details, memeMode };
  }

  /**
   * Resolve an OKX CEX ticker (e.g., "BASED-USDT") to an X Layer contract address.
   * Uses the OKX DEX token search API.
   */
  async resolveTokenAddress(symbol: string): Promise<string | null> {
    const baseSymbol = symbol.split('-')[0].toUpperCase(); // "BASED" from "BASED-USDT"
    console.log(`[SecurityLayer] 🔍 Resolving ${baseSymbol} → X Layer address...`);

    try {
      const path = `/api/v5/dex/aggregator/search-token?chainId=196&tokenSymbol=${baseSymbol}`;
      const res  = await fetch(`https://www.okx.com${path}`, {
        headers: this.getHeaders('GET', path)
      });
      const data = await res.json() as any;

      if (data.code === '0' && data.data?.length > 0) {
        const token = data.data[0];
        console.log(`[SecurityLayer] ✅ Resolved: ${baseSymbol} → ${token.tokenContractAddress}`);
        return token.tokenContractAddress;
      }
    } catch (e: any) {
      console.log(`[SecurityLayer] Token resolve failed: ${e.message}`);
    }
    return null;
  }
}
