import { TradeExecutor, TOKENS } from './trade/TradeExecutor.js';

async function forceTrade() {
  console.log('--- ⚡ Forcing Direct Prove-It Execution ---');
  const executor = new TradeExecutor();
  const bal = await executor.getBalance();
  console.log(`Agent Wallet: ${executor.getAccountAddress()}`);
  console.log(`Current Balance: ${bal} OKB`);

  if (parseFloat(bal) < 0.005) {
    console.log('❌ Insufficient balance for micro-pulse. Need > 0.005 OKB.');
    return;
  }

  try {
    const txHash = await executor.executeMicroPulse(TOKENS.OKB_NATIVE, TOKENS.USDC, '0.001');
    console.log(`\n✅ PROVE-IT EXECUTED SUCESSFULLY!`);
    console.log(`TX Hash:  https://www.okx.com/xlayer/tx/${txHash}`);
    console.log(`Explorer: https://www.okx.com/web3/explorer/xlayer/tx/${txHash}`);
  } catch (e: any) {
    console.error('Execution Failed:', e.message);
  }
}

forceTrade().catch(console.error);
