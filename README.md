# Living Vault

**Art that remembers.** Generative NFTs that evolve through holder actions and real-world sports results, built on **Monad Testnet (10143)**.

**[Live App](https://living-vault-three.vercel.app) · [F1 Collection](https://living-vault-three.vercel.app/f1) · [Documentation](https://living-vault-three.vercel.app/docs) · [Demo Video](docs/videos/living-vault-product-demo.mp4)**

Public repository: [neelpote/living-vault](https://github.com/neelpote/living-vault). Publicly hosted on Vercel.

![On-chain Ferrari artwork](docs/images/f1-real.png)

## What It Does

- **Holder-driven evolution:** deposit test mUSDC to mint a vault NFT, then top up to change its artwork. Transfer carries the balance; redeem returns it to the current owner and burns the NFT.
- **Real F1 data:** all 11 teams on the 2026 grid, with championship history and race results from Jolpica. Titles, points and wins shape original on-chain metallic artwork.
- **Verifiable outputs:** on-chain SVG/metadata, explorer receipts, downloadable source reports and source/published comparisons.

The F1 collection uses a **trusted single-reporter oracle**: the authorized wallet must publish genuinely changed results. It is not a decentralized feed or automatic updater. The report digest verifies the published report's bytes, not the truth of HTTP data. F1 NFTs have no deposit balance.

The deposit UI includes a richer browser presentation; the original-view toggle and SVG export expose the actual NFT artwork.

## Verified Contracts

All three contracts are deployed on **Monad Testnet**, with source verified on MonadVision and Monadscan.

| Contract | Address / Explorer |
| --- | --- |
| LivingVault | [`0x760600d4fdd56b49941fa91b096666d56c08ec5f`](https://testnet.monadvision.com/address/0x760600d4fdd56b49941fa91b096666d56c08ec5f) |
| MockUSDC | [`0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb`](https://testnet.monadvision.com/address/0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb) |
| F1LivingArt | [`0x1ba990f986e74295b1a4f65c5d654ebaa6ee4451`](https://testnet.monadvision.com/address/0x1ba990f986e74295b1a4f65c5d654ebaa6ee4451) |

## Try It

Use a wallet-enabled browser with **test MON** for gas.

1. Open [Create](https://living-vault-three.vercel.app/create), connect on chain **10143**, and claim test mUSDC.
2. Deposit at least **1 mUSDC** to mint a vault, confirming approval and mint.
3. Open your vault, select **Add to vault → Deposit & evolve**, and confirm approval and deposit as required.
4. Watch the confirmed artwork change and open its explorer receipt. Approval alone does not evolve it.

On the [F1 page](https://living-vault-three.vercel.app/f1), choose a team, inspect its records and original SVG, then mint for test MON gas only. Old deposit vault No. 1 was redeemed; create a fresh vault for the live evolution demo.

## Run Locally

Requires **Node.js 22.10+** and npm. No private key or environment file is needed; committed configuration points to the deployed testnet contracts.

```sh
git clone https://github.com/neelpote/living-vault.git
cd living-vault
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Stack: Next.js, React, TypeScript, Wagmi/Viem, Solidity and OpenZeppelin.

## Check the Project

```sh
npm run contracts:compile
npm run contracts:test
npm run build
npm run typecheck
npm run f1:check
```

Fresh-clone setup, 19 contract checks, build and typecheck passed. Recorded browser checks cover the vault lifecycle; 14 F1 checks cover real-report evolution locally. Public evidence confirms vault deposits and the F1 deployment/mint. No public post-deployment F1 update or security audit is claimed.

## Scope and Further Reading

**Testnet only.** mUSDC has no monetary value or yield. No mainnet deployment or community voting. F1 updates require the reporter; API failures never substitute fabricated results.

For artists and sports communities, the proposed business model is commissioned living collections and hosted publishing services. This is a hypothesis, not claimed revenue or product-market fit.

[Platform Guide](https://living-vault-three.vercel.app/docs) · [Verification & Evidence](docs/VERIFICATION.md) · [Pitch & Submission Kit](docs/SUBMISSION.md) · [Artwork Credits](docs/ARTWORK_CREDITS.md) · [Agent Handoff](AGENT_HANDOFF.md)
