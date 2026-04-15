import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface JournalEntry {
  timestamp: string;
  prismId: string;
  signal_summary: string;
  reasoning_hash: string;
  security_results: string;
  outcome_tx?: string;
}

export class OnchainJournal {
  private logPath: string;

  constructor() {
    this.logPath = path.join(process.cwd(), 'prism_lineage.json');
    if (!fs.existsSync(this.logPath)) {
      fs.writeFileSync(this.logPath, JSON.stringify([]));
    }
  }

  async log(entry: JournalEntry) {
    console.log(`[OnchainJournal] Logging lineage for Prism ${entry.prismId}...`);
    
    // 1. Update Local Storage
    const logs = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
    logs.push(entry);
    fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));

    // 2. Compute On-chain Memo (Simulation - Note: Actual Outcome TX is stored if provided)
    const onchainMemo = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
    console.log(`[OnchainJournal] Proof-of-Reasoning Hash: ${onchainMemo}`);
  }

  getLogs(): JournalEntry[] {
    try {
      return JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
    } catch {
      return [];
    }
  }
}
