import { createWalletClient, createPublicClient, http, Address, PrivateKeyAccount, Hex, parseEther, formatEther, formatUnits, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { xLayer } from 'viem/chains';
import fetch from 'node-fetch';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://www.okx.com';

export const TOKENS = {
  OKB_NATIVE: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  USDC: '0x74b7F16337b8972027F6196A17a631aC6dE26d22',
  USDT: '0x1e4a5963abfd975d8c9021ce480b42188849d41d',
};

export class TradeExecutor {
  private account: PrivateKeyAccount;
  public publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient>;
  private apiKey: string;
  private secretKey: string;
  private passphrase: string;

  constructor() {
    const pk = process.env.X_LAYER_WALLET_PK as Hex;
    if (!pk) throw new Error('X_LAYER_WALLET_PK missing');
    this.account = privateKeyToAccount(pk);

    const rpc = process.env.X_LAYER_RPC_URL || 'https://rpc.xlayer.tech';
    this.publicClient = createPublicClient({ chain: xLayer, transport: http(rpc) });
    this.walletClient = createWalletClient({ account: this.account, chain: xLayer, transport: http(rpc) });

    this.apiKey     = process.env.OKX_API_KEY!;
    this.secretKey  = process.env.OKX_SECRET_KEY!;
    this.passphrase = process.env.OKX_PASSPHRASE!;
  }

  private getHeaders(method: string, requestPath: string, body: string = '') {
    const timestamp = new Date().toISOString();
    const sign = crypto.createHmac('sha256', this.secretKey).update(timestamp + method + requestPath + body).digest('base64');
    return {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': sign,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };
  }

  getAccountAddress(): string { return this.account.address; }

  async getBalance(): Promise<string> {
    const bal = await this.publicClient.getBalance({ address: this.account.address });
    return formatEther(bal);
  }

  private getTokenDecimals(tokenAddress: string): number {
    const addr = tokenAddress.toLowerCase();
    if (addr === TOKENS.USDC.toLowerCase() || addr === TOKENS.USDT.toLowerCase()) return 6;
    return 18;
  }

  async getBalanceOf(tokenAddress: string): Promise<bigint> {
    if (tokenAddress === TOKENS.OKB_NATIVE) {
      return await this.publicClient.getBalance({ address: this.account.address });
    }
    const abi = [{ "inputs": [{ "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }];
    return await this.publicClient.readContract({
      address: tokenAddress as Address,
      abi,
      functionName: 'balanceOf',
      args: [this.account.address]
    }) as bigint;
  }

  async getSwapRoute(fromToken: string, toToken: string, amountWei: string, slippage: string = '2') {
    const params = `chainIndex=196&amount=${amountWei}&fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&userWalletAddress=${this.account.address}&slippagePercent=${slippage}`;
    const path = `/api/v6/dex/aggregator/swap?${params}`;
    const res = await fetch(`${BASE_URL}${path}`, { headers: this.getHeaders('GET', path) });
    const data = await res.json() as any;
    if (data.code !== '0' || !data.data?.length) return null;
    return { tx: data.data[0].tx, estimatedOut: data.data[0].routerResult?.toTokenAmount ?? '0' };
  }

  async approveToken(tokenAddress: string, spender: string): Promise<string | null> {
    try {
      const data = ('0x095ea7b3' + spender.replace('0x','').padStart(64,'0') + 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff') as Hex;
      return await this.walletClient.sendTransaction({ account: this.account, chain: undefined, to: tokenAddress as Address, data });
    } catch (e) { return null; }
  }

  async executeFullTrade(toToken: string, amountOKB: string = '0.005', fromToken: string = TOKENS.OKB_NATIVE) {
    const decimals = this.getTokenDecimals(fromToken);
    const amountWei = parseUnits(amountOKB, decimals).toString();
    // Fetch route as close to broadcast as possible to prevent expiry
    const route = await this.getSwapRoute(fromToken, toToken, amountWei);
    if (!route) throw new Error('No route found — insufficient liquidity or unsupported token.');
    const gasPrice = await this.publicClient.getGasPrice();
    return await this.walletClient.sendTransaction({
      account: this.account,
      chain: undefined,
      to: route.tx.to as Address,
      data: route.tx.data as Hex,
      value: BigInt(route.tx.value || '0'),
      gas: BigInt(Math.ceil(Number(route.tx.gas) * 1.5)),
      gasPrice: BigInt(Math.ceil(Number(gasPrice) * 1.1)),
    });
  }

  async executeMicroPulse(fromToken: string, toToken: string, amount: string) {
    return this.executeFullTrade(toToken, amount, fromToken);
  }

  async manualExecuteSwap(fromToken: string, toToken: string, amount?: string): Promise<string> {
    let amountWei: string;
    const decimals = this.getTokenDecimals(fromToken);
    
    if (amount) {
      amountWei = parseUnits(amount, decimals).toString();
    } else {
      const bal = await this.getBalanceOf(fromToken);
      if (bal === 0n) throw new Error('Token balance is zero.');
      amountWei = bal.toString();
    }

    const route = await this.getSwapRoute(fromToken, toToken, amountWei);
    if (!route) throw new Error('No liquidity route found for this amount.');

    if (fromToken !== TOKENS.OKB_NATIVE) {
      await this.approveToken(fromToken, route.tx.to);
      await new Promise(r => setTimeout(r, 2000));
    }

    // Fetch a fresh route immediately before broadcast to prevent quote expiry
    const freshRoute = await this.getSwapRoute(fromToken, toToken, amountWei);
    if (!freshRoute) throw new Error('Fresh route fetch failed — market moved.');
    const gasPrice = await this.publicClient.getGasPrice();
    
    return await this.walletClient.sendTransaction({
      account: this.account,
      chain: undefined,
      to: freshRoute.tx.to as Address,
      data: freshRoute.tx.data as Hex,
      value: BigInt(freshRoute.tx.value || '0'),
      gas: BigInt(Math.ceil(Number(freshRoute.tx.gas) * 1.5)),
      gasPrice: BigInt(Math.ceil(Number(gasPrice) * 1.1)),
    });
  }
}
