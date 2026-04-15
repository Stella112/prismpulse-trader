import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

export interface PrismResult {
  confidence: number;
  risk_narrative: string;
  suggested_size: string;
  strategy: string;
}

export class OllamaClient {
  private apiUrl: string;
  private model: string;
  private static isRefracting = false;

  constructor() {
    this.apiUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:latest';
  }

  /**
   * Conversational turn for natural language chat.
   */
  async chat(userMessage: string): Promise<string> {
    const systemPrompt = `You are the master of PRISM PULSE, a production-grade Autonomous Asset Manager on X Layer.
Your persona is: 💠 AUTHORITATIVE, PRECISE, and DIRECT.
Your mission is to manage the user's mainnet assets and provide intelligence on the X Layer ecosystem.

Guidelines:
1. Explain your logic but keep responses under 4 sentences.
2. If asked about trades, mention your "FORGER" module.
3. Keep the tone professional but agentic (use 💠 occasionally).
4. No markdown headers. Use plain text or subtle symbols.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s chat timeout

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal as any,
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMessage }
          ],
          stream: false,
          options: { temperature: 0.7, num_predict: 256 },
          keep_alive: '5m'
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json() as any;
      return data.message?.content || "Commander, my refraction is currently unstable. Please re-pulse.";
    } catch (e: any) {
      return "💠 REASONING_PULSE: I am currently focusing all intelligence on the mainnet trenches. (Llama offline)";
    }
  }

  async forgePrism(signals: any, userCommand?: string): Promise<PrismResult> {
    if (OllamaClient.isRefracting) {
      throw new Error('System busy: A prism refraction is already in progress.');
    }

    OllamaClient.isRefracting = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second kill-switch

    const systemPrompt = `You are PRISM PULSE, a high-fidelity Autonomous Asset Manager on X Layer.
Your objective is to identify and execute high-confidence trade opportunities.

Core Intelligence Patterns:
1. WHALE/KOL: Prioritize signals with smart money inflow.
2. TRENCH SCAN: Identify new high-liquidity meme launches.
3. SECURITY FIRST: Never suggest strategies that bypass the Security Layer.

Analyze the provided signals and user command. Respond ONLY with a single JSON object.
No preamble, no explanation, no markdown.

Required JSON Structure:
{
  "confidence": <integer 0-100>,
  "risk_narrative": "<1-sentence technical analysis>",
  "suggested_size": "<allocation amount in OKB, e.g., '0.005'>",
  "strategy": "<BULLISH/BEARISH/NEUTRAL and 3-word reasoning>",
  "policy_override": {
    "min_security_score": <null or integer 0-100>,
    "max_balance_percent": <null or integer 0-100>
  }
}`;

    const prompt = `User Command: ${userCommand || 'Find best X Layer trade opportunity'}
Signals: ${JSON.stringify(signals, null, 2)}`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal as any,
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: prompt }
          ],
          stream: false,
          options: {
            num_predict: 1024,
            num_ctx: 1024,
            num_thread: 2,
            temperature: 0.1,
          },
          keep_alive: -1
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      let content: string = data.message?.content || '';

      // Strip markdown fences if present
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Extract first JSON object using a more robust search
      let jsonStart = content.indexOf('{');
      let jsonEnd = content.lastIndexOf('}');
      
      // Self-healing: If it starts but doesn't end, try to close it
      if (jsonStart !== -1 && jsonEnd === -1) {
        content = content + '}';
        jsonEnd = content.lastIndexOf('}');
      }

      if (jsonStart === -1 || jsonEnd === -1) {
        console.error('[OllamaClient] Raw content failed parse:', content);
        throw new Error('No JSON object found in response');
      }

      const jsonStr = content.substring(jsonStart, jsonEnd + 1);
      const result = JSON.parse(jsonStr) as PrismResult;
      
      // Auto-remedy missing fields
      return {
        confidence: typeof result.confidence === 'number' ? result.confidence : 50,
        risk_narrative: result.risk_narrative || 'Strategy refracted from current market pulse.',
        suggested_size: result.suggested_size || '0.001 OKB',
        strategy: result.strategy || 'MONITOR'
      };

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('[OllamaClient] Refraction Timeout (>60s). Failover triggered.');
      } else {
        console.error('[OllamaClient] Prism forging failed:', error.message);
      }
      
      return {
        confidence: 0,
        risk_narrative: 'Ollama reasoning unavailable: ' + error.message,
        suggested_size: '0',
        strategy: 'ABORT',
      };
    } finally {
      OllamaClient.isRefracting = false;
    }
  }
}
