# 💠 PrismPulse — Autonomous Meme-Trading Agent on X Layer

> **OKX Build X Hackathon | X Layer Arena**
> Submitted by: `prismpulse` | Wallet: `0xD4F1a32f9C31F60D79D30E59f2CD27a6C5c7fC23`

PrismPulse is a production-grade **autonomous AI trading agent** on the **X Layer Mainnet**. It applies a unique **Pulse-Refract-Forge** intelligence cycle to discover, vet, and execute meme token trades with institutional-grade precision using the **OKX Onchain OS** core modules.

---

## 🛑 The Problem

The X Layer meme-token ecosystem moves at extreme velocity. Retail traders and other agents face a core structural disadvantage: blindly trading high-momentum tokens carries severe contract risks (honeypots, high-tax rugs, sudden liquidity pulls), but manual vetting is simply too slow. The ecosystem lacks a tool that can bridge **high-speed on-chain signal scanning** with **human-level risk assessment** to provide safe, autonomous entry.

## 💡 The Solution: PrismPulse

PrismPulse acts as the **"Intuition Layer"** for the X Layer ecosystem. It solves the speed vs. safety dilemma by operating a fully autonomous, continuous pipeline:

1. **Intelligent Scanning**: It uses the Onchain OS Market Module to detect high-velocity token momentum before human traders can react.
2. **AI-Driven Vetting**: It pipes those signals into a local Llama 3.2 model to apply a semantic "sanity check" (identifying honeypot patterns and narrative risks) that simple math algorithms often miss.
3. **Micro-Proving**: Before committing capital, it safely routes a micro-transaction (0.001 OKB) via the Onchain OS DEX to empirically verify liquidity and slippage.
4. **Self-Sustaining Economy (Earn → Pay → Earn)**: It monetises its high-confidence alpha via x402 payments, using the revenue to auto-refill its native OKB gas vault, resulting in a true "deploy and forget" sovereign agent.

---
## ⛽ The GasVault Auto-Refill Mechanic

To operate 24/7 on X Layer, PrismPulse requires OKB for gas. Rather than relying on a human commander to constantly top up the wallet, PrismPulse features an autonomous **GasVault**:
- When the agent detects its OKB gas balance dropping below a critical threshold (`0.005 OKB`), it triggers an **emergency pause** on all complex meme token routing.
- It then reaches into its stable profit reserves (`USDC`) and executes an automated, low-gas swap directly to `OKB`.
- Once the gas tank is refilled (target: `0.02 OKB`), normal high-frequency hunting operations resume instantly. 

This creates a closed-loop economy where the agent literally pays its own rent to live on-chain.

---
## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PrismPulse Agent                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ SignalScanner│  │  PrismForger │  │ TradeExecutor│  │
│  │[Onchain OS   │─▶│  [Llama 3.2] │─▶│[Onchain OS   │  │
│  │ Market+Wallet│  │  AI Reason   │  │ DEX Module]  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                                     │         │
│  ┌──────────────┐                   ┌──────────────┐   │
│  │SecurityLayer │                   │OnchainJournal│   │
│  │[OKX Web3 Sec]│                   │[Lineage Proof]│  │
│  └──────────────┘                   └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   GasVault   │  │ x402 Handler │                    │
│  │[Onchain OS   │  │[Onchain OS   │                    │
│  │  Payments]   │  │  Payments]   │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
         │                    │
   X Layer Mainnet     Glassmorphic UI
   (ChainID 196)       (React + Vite)
```

### The Pulse-Refract-Forge Cycle

1. **Pulse** — `SignalScanner` queries the **Onchain OS Market Module** for real-time token rankings, price momentum, and wallet balances on X Layer.
2. **Refract** — `PrismForger` feeds signals to a local **Llama 3.2** model, which refracts data into a structured "Prism" (confidence-weighted trade plan).
3. **Forge** — `TradeExecutor` executes the Prism via the **Onchain OS DEX Module** and logs every decision to `OnchainJournal`.

---

## 🔌 Onchain OS / Uniswap Integration

| Module | Usage | Endpoint |
|--------|-------|----------|
| **Market Module** — Token Rankings | `SignalScanner.scanMemeTrenches()` | `GET /api/v5/dex/market/token-price-info?chainId=196` |
| **Market Module** — Price & Momentum | `SignalScanner.scanSmartMoney()` | `GET /api/v5/market/tickers` (HMAC-auth) |
| **Wallet Module** — Balances | `SignalScanner.getWalletBalances()` | `GET /api/v5/wallet/asset/all-token-balances?chains=196` |
| **Wallet Module** — TX History | `SignalScanner.getTxHistory()` | `GET /api/v5/wallet/post-transaction/transactions?chains=196` |
| **Trade Module** — DEX Swap | `TradeExecutor` all on-chain swaps | `GET /api/v5/dex/aggregator/swap?chainId=196` |
| **Trade Module** — Quote | Route optimisation before every swap | `GET /api/v5/dex/aggregator/quote?chainId=196` |
| **Payments Module** — x402 | Agent-to-agent alpha signal paywall | `POST /api/v5/payments/...` |

All API calls use **HMAC-SHA256 authentication** (`OK-ACCESS-KEY`, `OK-ACCESS-SIGN`, `OK-ACCESS-TIMESTAMP`, `OK-ACCESS-PASSPHRASE`).

---

## ⚙️ Working Mechanics

```
User / Autonomous Loop (every 75s)
       │
       ├─ Onchain OS Wallet Module  →  Check OKB gas balance
       ├─ Onchain OS Market Module  →  Scan X Layer token rankings
       ├─ Llama 3.2 Local LLM       →  Refract signals → Prism{confidence, strategy, size}
       ├─ OKX Web3 Security API     →  Vet contract risk score
       ├─ Onchain OS DEX Module     →  Micro prove-it swap (0.001 OKB) if confidence ≥ 80%
       ├─ Onchain OS DEX Module     →  Full trade if confidence ≥ 85%
       └─ OnchainJournal            →  Log TX hash + reasoning lineage
```

**Commander Override**: Manual directives (e.g. "swap USDC to OKB") bypass autonomous thresholds and execute immediately via Onchain OS DEX.

---

## 🏆 Deployment

- **Network**: X Layer Mainnet (ChainID 196)
- **Agentic Wallet**: `0xD4F1a32f9C31F60D79D30E59f2CD27a6C5c7fC23`
- **Explorer**: [OKX Explorer](https://www.okx.com/web3/explorer/xlayer/address/0xD4F1a32f9C31F60D79D30E59f2CD27a6C5c7fC23)

### On-Chain TX Examples (via Onchain OS DEX)
- [0xee571c85...2c95](https://www.okx.com/web3/explorer/xlayer/tx/0xee571c85cbe3b279c2595ff1fa5ddf8efee293df03fba3321884f584ef612c95)

---

## 🚀 Running Locally

```bash
git clone https://github.com/Stella112/prismpulse-trader
cd prismpulse-trader && npm install
cp .env.example .env   # Add OKX_API_KEY, OKX_SECRET_KEY, OKX_PASSPHRASE, X_LAYER_WALLET_PK
ollama pull llama3.2:1b
npm start              # Backend on :4002
cd ui && npm run dev   # Frontend on :5173
```

---

## 👤 Team

Solo developer + PrismPulse autonomous agent.

---

## 🌐 X Layer Ecosystem Positioning

PrismPulse is the **Intuition Layer** for X Layer — combining Onchain OS infrastructure with local LLM reasoning to make meme-token trading safe, smart, and autonomous.

**Special Prize Targets:**
- 🏆 **Most Active On-Chain Agent** — Legitimate Onchain OS DEX txns every 75s
- 💸 **Best Economy Loop** — Earn (x402 signals) → Pay (gas vault) → Earn cycle
