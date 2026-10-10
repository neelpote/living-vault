# Living Vault Acceptance Checklist

The supplied PRD ends at section 14 and references a missing section 16. This checklist makes the missing acceptance criteria explicit. Mark PASS only after observing evidence.

## Automated local checks

PASS: 19 contract groups, 22 browser checks, typecheck and production build. The following behaviors were verified locally, not all through the user's public-chain wallet.

- ERC20 uses six decimals; faucet mints exactly 1,000 test tokens and enforces cooldown.
- Only deployer may seed arbitrary wallets.
- Mint rejects zero, sub-minimum and uint128 overflow; records owner, balance, date and enumeration.
- Top-up rejects zero and unauthorized caller; approved operator is allowed.
- Every confirmed top-up changes tokenURI, including counts above eight.
- Identical state yields identical SVG; preview matches tokenURI image exactly.
- Level caps at eight; generated maximum-level SVG stays under 14KB.
- Transfer preserves vault accounting and art state; old owner loses redemption rights.
- Approved redemption pays current owner, burns NFT and removes metadata.
- Token IDs remain monotonic after burn.
- Fee-on-transfer input is rejected; a failed payout rolls back accounting and burn.
- UI blocks invalid amounts and wrong-network writes, handles rejected signatures, refreshes after receipts, and keeps public read-only views.
- Evolution history reflects log arguments; SVG export downloads the exact on-chain image.
- Desktop/tablet/mobile layouts have no horizontal overflow and art images load.

## Public-Testnet Status

PASS: deployed code/asset checks, verified source on both explorers, public renderer reads and actual user-wallet mint/top-up with changed tokenURI artwork. Evidence: `docs/VERIFICATION.md` and `docs/testnet-evidence.json`. Production hosting deployed successfully. Public-chain transfer/redemption, a hosted wallet signing walkthrough, insufficient gas balance and a timed judge demo remain unobserved; no blanket acceptance claim is made for those items.

### Extended manual checklist

- Both contract addresses exist on chain 10143 and vault asset equals deployed mock token.
- Both contracts show verified source on an explorer (not merely verification submission).
- Public RPC can return tokenURI and previewSVG at level eight within its eth_call budget.
- A fresh funded wallet claims mUSDC, mints, tops up, observes mutation, and opens its real transaction link.
- NFT transfer to a second wallet preserves the balance and enables that wallet to redeem.
- Burn transaction pays exact principal; subsequent metadata call fails.
- Browser wallet rejected signature, wrong chain, and insufficient gas funds produce useful error states.
- Public hosting URL is tested from a wallet-enabled browser.
- A judge can complete mint and evolution in under three minutes without developer help.

## PRD completion decisions

- Included P1 transfer and atomic redeem, and P2 log-derived history and exact SVG export/share.
- Minimum initial deposit: 1 mUSDC; subsequent top-ups may be any positive six-decimal amount.
- Faucet cooldown: 60 seconds. Claims per address are unrestricted after cooldown; this is intentionally a public test token.
- No external oracle, DAO vote, AI art generator, real yield, real USDC or mainnet deployment. Those are explicitly excluded by this PRD.
- Website starts as a usable exhibition with interactive labelled artwork study, create action and collection; detail and studio provide working wallet flows.
- Browser deployment uses user's signer and network guards. CLI deployment is optional.
