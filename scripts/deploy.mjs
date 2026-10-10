import { readFileSync, writeFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, encodeDeployData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from 'viem/chains';

if (!process.env.DEPLOYER_PRIVATE_KEY) throw new Error('Set DEPLOYER_PRIVATE_KEY in ignored .env.local, or use /deploy with your browser wallet.');
const transport = http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz');
const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY);
const publicClient = createPublicClient({ chain: monadTestnet, transport });
const wallet = createWalletClient({ account, chain: monadTestnet, transport });
if (await publicClient.getChainId() !== 10143) throw new Error('Refusing deployment: RPC is not Monad Testnet.');
console.log(`Deployer: ${account.address} (Monad Testnet ONLY)`);
const result = { chainId: 10143, deployedAt: new Date().toISOString(), deployer: account.address, verification: { mockUSDC: 'not-submitted', livingVault: 'not-submitted' } };
for (const name of ['MockUSDC', 'LivingVault']) {
  const artifact = JSON.parse(readFileSync(`artifacts/${name}.json`, 'utf8'));
  const args = name === 'LivingVault' ? [result.mockUSDC] : [];
  const gas = await publicClient.estimateGas({ account, data: encodeDeployData({ abi: artifact.abi, bytecode: artifact.bytecode, args }) });
  const hash = await wallet.deployContract({ abi: artifact.abi, bytecode: artifact.bytecode, args, gas: gas + gas / 20n });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== 'success' || !receipt.contractAddress) throw new Error(`${name} deployment reverted: ${hash}`);
  if (!await publicClient.getCode({ address: receipt.contractAddress })) throw new Error('Deployment has no code.');
  result[name === 'MockUSDC' ? 'mockUSDC' : 'livingVault'] = receipt.contractAddress;
  result[`${name}Tx`] = hash;
  result.blockNumber ??= receipt.blockNumber.toString();
  writeFileSync('config/deployment.json', JSON.stringify(result, null, 2));
  console.log(`${name}: ${receipt.contractAddress} / https://testnet.monadvision.com/tx/${hash}`);
}
