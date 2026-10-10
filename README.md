# Living Vault

**Art that remembers.** Generative NFTs that evolve through holder actions and real-world sports results, built on **Monad Testnet (10143)** and **Monad Mainnet (143)**.

**[Live App](https://livingvault.pics) · [F1 Collection](https://livingvault.pics/f1) · [Documentation](https://livingvault.pics/docs) · [Demo Video](docs/videos/living-vault-product-demo.mp4)**

Public repository: [neelpote/living-vault](https://github.com/neelpote/living-vault). Publicly hosted on Vercel.

![On-chain Ferrari artwork](docs/images/f1-real.png)

## The Idea

Most collectibles capture a single moment. Living Vault gives a piece a history: what its holder does, what it carries, and what happens in the world can change its visual identity.

The project demonstrates two distinct paths to that idea. **Deposit vaults** evolve through confirmed holder actions and carry redeemable balances: test mUSDC on Testnet, native MON on Mainnet. **F1 collectibles** evolve through published real sports results. Both generate original NFT artwork on-chain rather than relying on an external image being quietly replaced.

The demo is simple: send a deposit, wait for confirmation, and watch the piece change. The F1 collection extends the concept beyond wallet activity into an inspectable real-world data pipeline.

## What It Does

- **Holder-driven evolution:** deposit test mUSDC to mint a vault NFT, then top up to change its artwork. Transfer carries the balance; redeem returns it to the current owner and burns the NFT.
- **Real F1 data:** all 11 teams on the 2026 grid, with championship history and race results from Jolpica. Titles, points and wins shape original on-chain metallic artwork.
- **Verifiable outputs:** on-chain SVG/metadata, explorer receipts, downloadable source reports and source/published comparisons.

The F1 collection uses a **trusted single-reporter oracle**: the authorized wallet must publish genuinely changed results. It is not a decentralized feed or automatic updater. The report digest verifies the published report's bytes, not the truth of HTTP data. F1 NFTs have no deposit balance.

The deposit UI includes a richer browser presentation; the original-view toggle and SVG export expose the actual NFT artwork.

| Feature | What is implemented |
| --- | --- |
| Wallet connection | Injected wallets and explicit Monad Testnet/Mainnet switching |
| Test-token faucet | 1,000 mUSDC per claim, six decimals, 60-second cooldown |
| Vault lifecycle | Mint, top up, transfer and full redemption with NFT burn |
| Native MON vault | Separate verified mainnet contract, native deposits, no ERC-20 approval; real mint recorded |
| Collection and history | Wallet-owned gallery, public detail pages and event-derived evolution history |
| Artwork tools | Original SVG view/download and confirmed-state browser presentation |
| Sports collection | Team selection, real records, original on-chain art and free NFT mint |
| Provenance | Source/published comparisons, report digest, observation time and source links |
| Transaction feedback | Wallet signature, pending receipt, confirmation and explorer link |

## Real F1 Data, Living Artwork

The F1 collection covers **all 11 teams on the 2026 grid**, including Audi and Cadillac. Championship counts are derived from **68 completed seasons, 1958-2025**, using exact constructor identities. Predecessor championships are not silently inherited.

| Constructor | Titles through 2025 |
| --- | --- |
| Ferrari | 16 |
| McLaren | 10 |
| Williams | 9 |
| Mercedes | 8 |
| Red Bull | 6 |
| Alpine, Aston Martin, Audi, Cadillac, Haas, RB | 0 under these identities |

**Titles shape the turbine layers, race points rotate the composition, and wins influence blade orientation.** A new published report changes the original SVG of existing team-linked NFTs and emits ERC-4906 metadata-update notifications. A current-season championship is counted only once final scheduled results are available and the race date has passed.

Source: [Jolpica F1 API](https://github.com/jolpica/jolpica-f1/blob/main/docs/README.md). The page links championship years to their source responses and lets anyone download the canonical report. API results may be cached for five minutes; source and published values are shown separately. There is no synthetic result or forced evolution button.

## Shared Art and Community Commissions

[Living Together](https://livingvault.pics/together) adds **36 ownable fragments of one shared composition**. Each holder chooses a bounded expression for their fragment; the original NFT image is a crop of the collective on-chain SVG.

The artist proposes three named chapters from nine fixed artistic presets. Existing fragments vote once each; transfers do not reset votes and late claims cannot vote. Anyone can finalize after the deadline. Highest count wins, ties select the earliest option, and zero turnout causes no change.

**A vote alone cannot activate a chapter.** The winner waits for a genuinely newer report from the linked F1 oracle, published after finalization. Anyone can then apply it, updating the whole artwork and its fragments. Voting never changes custody or vault balances. This is NFT-weighted voting, not Sybil-resistant governance.

This extension is deployed as a separate contract; existing vault/F1 contracts are unchanged. Fragment No. 1 is claimed with its holder's Bold expression confirmed on-chain. Public chapter activation is not yet claimed: it needs a newer genuine oracle report. [Shared-art rules](https://livingvault.pics/docs#shared-art).

## Verified Contracts

### Monad Mainnet (143)

| Contract | Verified Address | Deployment Transaction |
| --- | --- | --- |
| F1LivingArt | [`0x80c1ec7f551198586c301fa4bdcdcb51505c06f3`](https://monadvision.com/address/0x80c1ec7f551198586c301fa4bdcdcb51505c06f3) | [View deployment](https://monadvision.com/tx/0xc4f096f01779ede507e13e893d04fde5020a94115a4f25565de8347d9eb33b2f) |
| SharedLivingArt | [`0x9f97dd0db7b6f073c2874641909a512ffb5f9f4e`](https://monadscan.com/address/0x9f97dd0db7b6f073c2874641909a512ffb5f9f4e) | [View deployment](https://monadvision.com/tx/0x0a52e10d10be6ba410f67b8156b63b2658acadf46908d8a8f3577a96770c6a14) |
| NativeLivingVault (MON) | [`0x9a6003f651a04baef93fffc9e853b1fa2cb48d20`](https://monadvision.com/address/0x9a6003f651a04baef93fffc9e853b1fa2cb48d20) | [View deployment](https://monadvision.com/tx/0x79357b581b8eb3556df8aab9c791e86a623f05fd2c615e4917f29c1a53b89012) |

F1LivingArt and NativeLivingVault are verified on MonadVision and Monadscan; SharedLivingArt is verified on Monadscan. The MON vault accepts native MON, not a mainnet mock token.

**Live mainnet transaction:** [`0x315346fb8e6c6452ee901dd72c9b70614c2f015a72b472361e3d128c8ba3af63`](https://monadvision.com/tx/0x315346fb8e6c6452ee901dd72c9b70614c2f015a72b472361e3d128c8ba3af63) successfully deposited **0.01 MON** and minted **MON Vault No. 1**, block **112180639**. [View the vault](https://livingvault.pics/mainnet/vault/1). Receipt and Minted/Transfer events were checked directly against mainnet; gas is separate from principal. Mainnet top-up and redemption are not yet recorded.

### Monad Testnet (10143)

All four original contracts are deployed on **Monad Testnet**. LivingVault, MockUSDC and F1LivingArt are source-verified on MonadVision and Monadscan; SharedLivingArt is source-verified on Monadscan.

| Contract | Address / Explorer |
| --- | --- |
| LivingVault | [`0x760600d4fdd56b49941fa91b096666d56c08ec5f`](https://testnet.monadvision.com/address/0x760600d4fdd56b49941fa91b096666d56c08ec5f) |
| MockUSDC | [`0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb`](https://testnet.monadvision.com/address/0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb) |
| F1LivingArt | [`0x1ba990f986e74295b1a4f65c5d654ebaa6ee4451`](https://testnet.monadvision.com/address/0x1ba990f986e74295b1a4f65c5d654ebaa6ee4451) |
| SharedLivingArt | [`0x0e0596b392a1808f851bf8fa2476b8c59110e949`](https://testnet.monadscan.com/address/0x0e0596b392a1808f851bf8fa2476b8c59110e949) |

**Recorded public proof:** a deposit vault was minted and topped up twice, with accounting and SVG mutation checked against the deployed renderer. The separate F1 contract published the real round-16 report at deployment; all 11 team values were independently checked, and Ferrari NFT No. 1's image matched the original contract SVG.

[Vault receipts and evidence](docs/testnet-evidence.json) · [F1 evidence](docs/f1-testnet-evidence.json) · [Full verification record](docs/VERIFICATION.md)

These are recorded checkpoints, not promises about future live state. A post-deployment public F1 update has not yet been observed; real round-15 to round-16 evolution was tested locally without manufacturing a public update.

## Try It

Use a wallet-enabled browser with **test MON** for gas.

1. Open [Create](https://livingvault.pics/create), connect on chain **10143**, and claim test mUSDC.
2. Deposit at least **1 mUSDC** to mint a vault, confirming approval and mint.
3. Open your vault, select **Add to vault → Deposit & evolve**, and confirm approval and deposit as required.
4. Watch the confirmed artwork change and open its explorer receipt. Approval alone does not evolve it.

On the [F1 page](https://livingvault.pics/f1), choose a team, inspect its records and original SVG, then mint for test MON gas only. Old deposit vault No. 1 was redeemed; create a fresh vault for the live evolution demo.

**Ownership matters:** transferring a vault preserves its principal and artwork state. Redemption pays the full balance to the current owner and permanently burns that NFT. There are no partial withdrawals or yield strategies; use a disposable test vault for a redemption demo.

## How It Is Built

```mermaid
flowchart LR
    Holder[Holder] --> UI[Next.js application]
    UI --> Wallet[Wallet signs on Monad Testnet]
    Wallet --> Vault[LivingVault + MockUSDC]
    Source[Jolpica real F1 reports] --> Reporter[Authorized reporter wallet]
    Reporter --> F1[F1LivingArt oracle + NFT]
    Vault --> SVG[On-chain JSON and SVG]
    F1 --> SVG
    SVG --> UI
```

The application uses **Next.js, React and TypeScript**, with **Wagmi/Viem** for wallets and contract calls. Contracts use **Solidity 0.8.31 and OpenZeppelin**; Hardhat and Playwright cover contract and browser behavior. Hosting is on Vercel, with no application database or server signing key required.

The deposit contracts are immutable, with no upgrade proxy or vault administrator. F1 publishing is a separate contract with an immutable authorized reporter. The user's wallet retains its key and signs writes; the interface reads confirmed state from RPC. Exact-amount token approvals, network checks and reentrancy protection cover the deposit flow.

**Why Monad:** the product depends on a wallet action becoming visible as refreshed artwork. Monad Testnet is the deployed execution layer for that loop, with direct reads and wallet-signed writes. Gas is estimated against the active network with a 5% limit buffer; no unmeasured speed or throughput claim is made.

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

For the wallet browser suite, run `npx playwright install chromium`, then `npm run test:e2e`. For the F1 suite, keep the development server running and run `npm run f1:test`. Both use isolated local chains, not public signing keys. GitHub Actions is configured for clean installation, contract tests, build and typecheck.

Shared collection: `npm run shared:test` passed 21 local contract/browser checks with two real race reports, including vote-to-event activation and exact fragment crop pixels. `npm run shared:check` verifies the actual public deployment, ownership and original NFT images. [Shared Testnet evidence](docs/shared-testnet-evidence.json).

## Who It Is For

Artists and sports communities can use living collectibles to express ongoing participation rather than a static purchase. The proposed revenue model is **commissioned collections and optional hosted publishing services**, not returns on deposited funds.

Next validation steps are community interviews, artist-led pilots, and measuring independent mints and repeat visits after real results. Revenue and product-market fit are not yet established. Commercial sports branding and data rights require separate review; this prototype is not affiliated with Formula 1 or its teams.

## Scope and Further Reading

**The original mUSDC vault remains Testnet only.** mUSDC has no monetary value or yield. F1 updates require the reporter; API failures never substitute fabricated results. A voted chapter may wait until the next genuine result is published.

### Native MON Vault

**[MON vault](https://livingvault.pics/mainnet/vault)** is deployed separately from existing testnet NFTs at [`0x9a6003f651a04baef93fffc9e853b1fa2cb48d20`](https://monadvision.com/address/0x9a6003f651a04baef93fffc9e853b1fa2cb48d20), source-verified on MonadVision and Monadscan. Exact creation/runtime bytecode and backed principal accounting pass the read-only mainnet check. A real 0.01 MON deposit and NFT mint are confirmed in the receipt above; mainnet top-up and redemption remain unrecorded.

- Deposit at least **0.01 MON** to mint, then top up to evolve. No token approval or wrapping is needed.
- The NFT carries its deposited principal. Transfer moves redemption rights; redemption burns the NFT and returns principal to its current owner. Only the owner can select an alternative payout address.
- Real MON gas is separate from principal. No yield, admin custody controls, upgrades or rescue withdrawals. Failed payouts preserve the NFT and its balance.
- Experimental, not independently audited. Self-review and explorer verification do not establish production safety.
- Smart-account wallets with EIP-7702 delegation must retain Monad's **10 MON reserve**, plus deposit and gas. The app checks this before signing. A regular account can use Monad's separate emptying exception; do not blindly increase gas or retry a reserve rejection.

Run `npm run native:compile` and `npm run native:test` to reproduce 20 native custody checks. `npm run native:test-ui` passes 11 wallet checks, including delegated-account reserve rejection, against an isolated local EVM, never public funds. `npm run native:check` reads the actual mainnet deployment and accounting; `npm run native:verify` submits its exact source. [Mainnet custody evidence](docs/native-mainnet-evidence.json) · [MON vault guide](https://livingvault.pics/docs#native-mon).

### Mainnet Status

**[Mainnet F1 collection](https://livingvault.pics/mainnet) · [Mainnet shared composition](https://livingvault.pics/mainnet/together)**

Both art collections are deployed on chain143. F1 is verified on both explorers; shared art is verified on Monadscan. These collections have no deposit balance or native-value payment; wallets pay real MON gas. The original mUSDC vault remains Testnet only; the separate MON vault has its own custody scope above. Read-only `npm run mainnet:check` passes exact receipts/constructor calldata, immutable oracle links, all11 real team values and original SVG checks. F1 NFT No. 1 is minted to the creator's wallet; shared mainnet claim/chapter activation and independent audit remain unconfirmed. [Mainnet evidence](docs/mainnet-evidence.json). NFT detail pages read actual metadata and ownership directly, without depending on explorer NFT indexing.

[Platform Guide](https://livingvault.pics/docs) · [Verification & Evidence](docs/VERIFICATION.md) · [Pitch & Submission Kit](docs/SUBMISSION.md) · [Artwork Credits](docs/ARTWORK_CREDITS.md) · [Agent Handoff](AGENT_HANDOFF.md)
