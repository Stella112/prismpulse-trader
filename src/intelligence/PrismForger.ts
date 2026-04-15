import { SignalScanner } from './SignalScanner.js';
import { OllamaClient, PrismResult } from '../utils/OllamaClient.js';

export class PrismForger {
  private scanner: SignalScanner;
  public ollama: OllamaClient;

  constructor() {
    this.scanner = new SignalScanner();
    this.ollama = new OllamaClient();
  }

  async forge(userCommand?: string): Promise<PrismResult & { signalData: any }> {
    console.log('[PrismForger] Initiating pulse scan...');
    
    // 1. Gather on-chain pulse
    const signalData = await this.scanner.getConsolidatedSignals();
    
    console.log('[PrismForger] Signals retrieved. Refracting signals...');

    try {
      // 2. Attempt AI Refraction (Timeout protected)
      const prism = await this.ollama.forgePrism(signalData, userCommand);
      
      if (prism.strategy === 'ABORT') {
        throw new Error('Ollama refraction failed or aborted.');
      }

      console.log(`[PrismForger] AI Prism forged. Confidence: ${prism.confidence}%`);
      return { ...prism, signalData };

    } catch (e: any) {
      console.warn(`[PrismForger] AI Refraction failed (${e.message}). Falling back to Heuristic Reasoning.`);
      
      // 3. Fallback: Heuristic Refraction
      // Calculate confidence based on raw momentum and trench score
      const trenches = signalData.pulses.trench_activity || [];
      const topTrench = trenches[0]?.score || 0;
      const sm = signalData.pulses.smart_money || [];
      const topMomentum = Math.max(...sm.map((s: any) => s.momentum), 0);
      
      const heuristicConfidence = Math.min(82, Math.round((topTrench * 0.4) + (topMomentum * 0.6)));
      
      return {
        confidence: heuristicConfidence,
        risk_narrative: "Standard refraction based on raw momentum and trench activity pulse.",
        suggested_size: "0.001 OKB",
        strategy: heuristicConfidence > 75 ? "BULLISH (Heuristic)" : "MONITOR (Heuristic)",
        signalData
      };
    }
  }
}
