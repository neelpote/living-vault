# Verification Evidence

Checkpoint: 2026-10-10. Values below were observed, not inferred from frontend previews.

## Latest Mainnet Lifecycle and Community Usage

Read-only scan through block112186180 on2026-10-10: nine successful post-deployment actions across the three mainnet contracts, plus initial F1 publication. All receipts and decoded events are in [mainnet-transactions.json](mainnet-transactions.json); wallet-router transactions retain their outer sender separately from event owners. Exact deployment links remain in README and configs; deployments without emitted events are not counted by the activity scan.

Native MON Vault2: mint0.01MON `0xd9cad2f51f58af1914cdb6f87b0d8383ec67f81d5c072fa417e14d5a7c6b4563`, top-up0.01MON `0x9c8fc7f98b96c7eaeec52598d794cfd971fd000beac0771a479323c187c0e69d`, redeem0.02MON `0x8441c1f179920cd7257df393130649c10842b42d9d42fa5fccb61bd76b75a613`. All successful. Principal conservation, distinct original renderer outputs, payout recipient and burned NFT ownership/metadata checked by `node scripts/check-native-lifecycle.mjs`, [proof](native-mainnet-lifecycle.json). Gas separate from principal. Vault1 remains active with0.01MON, fully backed by0.01MON contract balance; nextTokenId3.

F1 supply2, both Ferrari. Shared supply2; fragment1 changed to Flow. Source digest remains the genuine initial round16 report; proposalCount0. No post-deployment oracle update or chapter activation claimed. Earlier mint/claim-pending and Testnet-only custody statements below are historical, superseded by this checkpoint and the later native vault section. Source verification is still not an independent audit.

## Actual Mainnet Art Deployment

User-wallet deployments on chain143: F1LivingArt `0x80c1ec7f551198586c301fa4bdcdcb51505c06f3`, transaction `0xc4f096f01779ede507e13e893d04fde5020a94115a4f25565de8347d9eb33b2f`; SharedLivingArt `0x9f97dd0db7b6f073c2874641909a512ffb5f9f4e`, transaction `0x0a52e10d10be6ba410f67b8156b63b2658acadf46908d8a8f3577a96770c6a14`. Both use the same deploying user as immutable reporter/artist; shared links to the new mainnet oracle, never the Testnet address.

`npm run mainnet:check` PASS: exact receipt/constructor calldata, network, runtime presence, immutable identities, canonical report digest and all11 published real team values, original on-chain SVG. [Public evidence](mainnet-evidence.json) initially records zero minted NFTs/fragments/proposals; do not claim public chapter activation or mainnet mint from local tests. Actual deployment network fees total0.936525852MON, using gas limits and receipt gas prices. No deposit balance or native-value transfer in these art contracts.

F1 source verified on [MonadVision](https://monadvision.com/address/0x80c1ec7f551198586c301fa4bdcdcb51505c06f3) (perfect match) and Monadscan. Shared source verified on [Monadscan](https://monadscan.com/address/0x9f97dd0db7b6f073c2874641909a512ffb5f9f4e); MonadVision failed and is not claimed. Responses retained in the separate mainnet config files. Source verification is not an independent security audit. Deposit custody remains Testnet only.

Mainnet wallet/browser tests use an isolated local EVM, not real funds. Navbar tests cover wallet-chain and collection-route switching, rejection preserving the current edition, and no transaction on a network switch. Header geometry checks at1440/1024/768/390/320 show no brand/control overlap or overflow. Dev output was isolated into `.next-dev`; repeated mainnet/testnet reloads after a production build show no hydration errors.

## Shared Composition and Voting

`npm run shared:test`: 21 checks passed on isolated local EVM18548 with two genuine Jolpica round15/16 reports. Covers 36-piece bounds, holder expression, artist-only bounded proposals, eligibility snapshot, duplicate votes after transfer, deadline/finalization, zero turnout, deterministic tie, newer-report activation, original metadata and ERC-4906. Browser wallet exercised deployment, claim, edit, propose, vote, finalize and apply; exact fragment pixels matched their full composition crop. Screenshots at1440/768/390/320 show loaded art, no overflow/page errors. Local application3005 and chain shut down; public config preserved. Build/typecheck passed.

User-wallet deployment confirmed: `0x0e0596b392a1808f851bf8fa2476b8c59110e949`, transaction `0xee24e78c5a145c592e0cfc4fa2002dbd215def921ac5233aba1ee8f5bb107600`, block69805772. Public readonly check confirmed fragment1 owned by the deploying wallet with expression2 (Bold), exact NFT image equality, consumed real source hash and initial oracle revision1. [Evidence](shared-testnet-evidence.json). No public post-vote chapter activation is claimed.

Source verification: Monadscan **Pass - Verified**; MonadVision verification failed and is not claimed. Initial full resolved input changed compiler AST allocation compared with the original import-callback build. The verification script derives AST-order-preserving source aliases, changes import paths only, and checks creation/runtime executable bytes (excluding their metadata hash trailers) before submission. Source path hashes differ, so no perfect metadata match is claimed. Original creation calldata independently equals the original artifact plus oracle constructor argument. API response and method are preserved in `config/shared-deployment.json`. Existing contracts and source are unchanged.

## Actual Monad Testnet Deployment

Chain RPC reports `0x279f` (10143).

| Contract | Address | Runtime bytes | Source verification |
| --- | --- | --- | --- |
| MockUSDC | 0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb | 2,354 | MonadVision perfect match; Monadscan Pass - Verified |
| LivingVault | 0x760600d4fdd56b49941fa91b096666d56c08ec5f | 13,853 | MonadVision perfect match; Monadscan Pass - Verified |

- Deployer/token owner: `0x3eC0325C7656784f1aDB4b19e670AeAf26a2ecC2`.
- Deployment scan start: `69764353` (from user-exported configuration; not claimed to be the vault's precise creation block).
- Deployment completed timestamp from user's browser: `2026-10-10T07:21:57.930Z`.
- Token runtime exactly equals compiled local runtime.
- Vault's immutable asset points to the deployed mock token; runtime length and metadata trailer match compiled build.
- Verification endpoint `https://agents.devnads.com/v1/verify` returned HTTP 200 with `success: true`, `verified: 2`, `total: 2` separately for both contracts.
- Verification responses and timestamps are persisted in `config/deployment.json`.

Explorer source links: [token](https://testnet.monadvision.com/address/0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb), [vault](https://testnet.monadvision.com/address/0x760600d4fdd56b49941fa91b096666d56c08ec5f).

## Public RPC Renderer

Calls to deployed `previewSVG(1, 100000000, count)` succeed on the public RPC:

| Count | SVG bytes |
| --- | --- |
| 0 | 1,355 |
| 1 | 2,085 |
| 8 | 6,744 |
| 9 | 6,743 |

This validates the deployed renderer's read budget, not a deposit transaction or NFT ownership.

## Local Checks

- 19 contract check groups passed on Hardhat Osaka EVM.
- Final browser suite passed 22 checks with zero page errors, including the simplified MetaMask connection change.
- TypeScript and Next production builds pass.
- Dependency audit reports zero vulnerabilities, including production-only audit.
- Desktop/mobile screenshots were reviewed at 1440, 768, 390 and 320px. A 320px header overlap was corrected by using an icon-only wallet control with an accessible label.
- Browser suite uses an isolated temporary application copy and local-chain-only RPC interception. Its addresses and receipts are NOT public-testnet evidence.

## Known Wallet Incident

The user saw MetaMask `Cannot read properties of undefined (reading 'origin')` when connecting. A matching [open upstream bug](https://github.com/MetaMask/metamask-extension/issues/46887) exists. A direct-account connection path was added to avoid a forced wallet_requestPermissions prompt. The user subsequently deployed both contracts successfully. This does not prove the extension bug is fixed globally.

## Actual Mint and Evolution

`npm run test:testnet` passed at `2026-10-10T07:35:13.920Z`; full evidence is in `docs/testnet-evidence.json`.

- Vault No. 1: 21 mUSDC principal, two top-ups, level two. Current SVG exactly matches deployed preview and differs from mint SVG.
- Mint: `0x743c3291242b2fa31c18037b770268bab8e02eedf222e0a440b2af9f692b26a2`, block 69764610, 1 mUSDC.
- Top-up: `0x847433ee321458f270d8c90988ca2598681220adb20649d137b93120b0e0f161`, block 69765774, 10 mUSDC.
- Second top-up: `0x4b0aa0f91fe89e8bad4f9e00300c15f332013ded42e455f7910df96ded5399af`, block 69765905, another 10 mUSDC. All receipts confirmed; custody balance covers the vault principal.
- Production build deployed successfully at https://living-vault-three.vercel.app .
- Unauthenticated Playwright reads of homepage, create and vault 1 returned HTTP 200 with loaded artwork and zero page errors. Mobile vault page had no horizontal overflow at 390px. Wallet signing on hosted origin remains untested.

## Demo Art and Documentation Revision

- Typecheck and Vercel production build passed after adding browser-only sculptural bloom presentation and `/docs`.
- Full 22-check local wallet browser suite rerun: PASS, zero page errors. Original metadata export, pending/failed refresh handling, transfer and redemption remained covered.
- `node scripts/test-demo-art.mjs`: PASS deterministic seed/tier rendering, distinct images at counts 0 through 12, bounded browser SVG size below 150KB. This limit is for presentation, not the original <14KB on-chain renderer.
- Read-only browser checks passed demo/original toggle, FAQ interaction and valid XML for documentation SVG illustrations.
- Hosted homepage and documentation returned HTTP 200; all images loaded, zero browser errors, no horizontal overflow at docs widths 1440, 390 and 320px.
- No contract redeployment or public-chain write occurred for this revision. The richer art is not the immutable NFT metadata; original remains accessible and exportable.

## Remaining Validation Limits

## F1 Oracle Extension

Public check at `2026-10-10T10:07:14.369Z` passed against real Monad Testnet, chain 10143. Contract: `0x1ba990f986e74295b1a4f65c5d654ebaa6ee4451`. Deployment: `0x0a6302a849fd74cc86a294881a47708ee15cedbc4082ecc9cfbc918dd90f12db`. Source verified by MonadVision (perfect match) and Monadscan (Pass - Verified), HTTP 200, verified 2/2. Configuration retains exact constructor/latest reports and verification response.

All11 team identities, championship counts/last title, current points/wins/positions and original SVGs were independently compared against the canonical Jolpica source report. Digest: `0xcf41ee292ce6a1e7b1a2fb921f9b08222840a759d7971d9fcd28fe30a1424b55`; season2026 round16, championship history through2025, oracle revision1. Public totalSupply1: Ferrari NFT No.1 owned by the user's wallet. Decoded NFT SVG exactly equals the contract's teamSVG. Full record: `docs/f1-testnet-evidence.json`.

14 local checks passed using actual race-round15 and round16 source responses; their publication changes an already-transferred NFT's tokenURI. Includes unauthorized/stale/future/incomplete rejection and responsive original-art gallery at1440/768/390/320. These receipts are local-only. Public post-deployment oracle update has not been observed; unchanged current data is not republished to manufacture evolution. This is a single trusted reporter, not decentralized consensus or HTTP attestation, and no unattended publisher is claimed.

### Later Repository Preparation Check (2026-10-10)

A read-only public RPC check during GitHub preparation returned `totalSupply() = 0`, `nextTokenId() = 2`, and a reverted `ownerOf(1)`. The hosted detail page reports vault No. 1 redeemed. The mint/two-top-up evidence above remains a historical checkpoint; no active NFT is claimed at this later check. A redemption transaction hash and payout receipt were not independently inspected. Create and evolve a fresh token for a live demo; pass its ID to `npm run test:testnet -- <token-id>` when refreshing evidence. Do not overwrite historical evidence with inferred values.

Live transfer/redeem are covered locally, but not yet observed through the user's public-chain wallet. No independent security audit or timed judge walkthrough is claimed. Testnet resets can invalidate recorded deployments.
## Native MON Mainnet Vault

Contract: `0x9a6003f651a04baef93fffc9e853b1fa2cb48d20`, chain143. Deployment transaction `0x79357b581b8eb3556df8aab9c791e86a623f05fd2c615e4917f29c1a53b89012`, block112177778. MonadVision perfect match and Monadscan Pass-Verified; exact source response saved in `config/native-mainnet.json`.

`npm run native:check` validates the actual receipt, zero-value creation, exact creation/runtime code, balance backing, all live principal and original tokenURI artwork; evidence in `docs/native-mainnet-evidence.json`. Initial creator-account deposit was blocked before signing by the delegated-account reserve rule. The user then minted from another account: [actual successful 0.01 MON mint](https://monadvision.com/tx/0x315346fb8e6c6452ee901dd72c9b70614c2f015a72b472361e3d128c8ba3af63), block112180639, NFT1. Transfer and Minted events checked; [receipt evidence](native-mainnet-mint.json). Fresh supply1/principal0.01MON/backing0.01MON/topups0. Mainnet top-up/redemption remain unrecorded. Local custody20 and isolated wallet11 checks passed. No independent audit claimed.
