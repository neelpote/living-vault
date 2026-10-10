# PRD: Living Vault — Evolving Generative Art on Monad

Oct 10, 2026 · @jayram

## 1. Product overview

**Living Vault is an ERC-721 NFT that represents a token vault and redraws its own artwork on-chain whenever the vault's state changes.** The vault supplies verifiable on-chain state; the evolving artwork is the product.

**One-line pitch:** an NFT whose art grows as its vault grows.

**How it works.** A user deposits mock USDC into a new vault and receives an NFT that owns it. Each later deposit adds a ring, makes the geometry more complex and shifts the color palette. The owner can transfer the NFT, and the vault goes with it, or redeem the tokens and burn the NFT.

**Core product loop**

1. **Deposit:** the user locks test tokens in a vault and mints the NFT.
2. **Evolve:** each confirmed top-up changes contract state, and `tokenURI()` returns a visibly different SVG.
3. **Redeem:** the owner withdraws the tokens, the NFT is burned, and the frontend plays a final dissolution animation.

**Product principles**

- **The art is the product.** Every design and engineering decision serves the moment the artwork changes.
- **State is the source of truth.** The SVG is derived from contract state. The frontend may animate it but never invents it.
- **Confirmed means confirmed.** Nothing shows as evolved until the transaction is mined and the contract is re-read.
- **Technically honest.** Test tokens only, no real yield, no real-money assets, no promises the contract does not keep.
- **A gallery, not a dashboard.** The interface should feel like walking into an exhibition, not operating a DeFi terminal.

## 2. Goals, non-goals and success metrics

**The MVP succeeds if a judge with a fresh wallet can mint, top up, see the art change and verify it on the explorer in under three minutes, with no developer help.**

**Goals**

- Ship a working Monad Testnet app: connect, get test tokens, mint, top up, evolve, verify.
- Make every confirmed top-up produce a visibly different, deterministic SVG straight from `tokenURI()`.
- Make the evolution moment memorable enough to carry the demo on its own.
- Make every claim verifiable: transaction links, verified source, readable on-chain state.
- Complete the loop with transfer and redeem if time allows.

**Non-goals**

- Real USDC, real yield or any DeFi strategy.
- Oracles, AI art generation, DAO voting.
- A backend database, IPFS, an indexer or a marketplace.
- Mainnet deployment of any kind.

**Success metrics** (proposed targets for the hackathon)

| Metric | Target | How it is measured |
| --- | --- | --- |
| Wallet connect to first minted vault | 90 seconds or less on a funded wallet | Stopwatch run with a fresh wallet |
| Top-ups that change the SVG | 100% of confirmed top-ups | Foundry test comparing `tokenURI()` output before and after |
| False success messages | 0 | Failure-injection QA: rejected signature, reverted call, wrong network |
| Required acceptance checks passing | All of section 16 | Foundry suite plus manual checklist |
| Contracts verified on the explorer | Both contracts | Explorer check before the demo |
| Cold-start demo without a developer | Pass | One person who has never seen the app completes the flow |

## 3. Users, personas and the judge journey

**The primary user is a hackathon judge: short on time, wanting a clear wow in 30 seconds and proof it is real.** Everything else is secondary.

| Persona | Who they are | What they need | What the product must give them |
| --- | --- | --- | --- |
| Judge | Technical or semi-technical evaluator with minutes per project | A fast, obvious demonstration and verifiable proof | One-screen story, live evolution, explorer links |
| Collector | Holds the NFT and tops it up | Art worth keeping, a sense of progress and ownership | Visible growth, level and history, a gallery view |
| Recipient | Receives a transferred vault NFT | To trust what the NFT holds and be able to redeem it | Clear balance, history that travels with the token |
| Reviewer | Reads the repo and contracts | Small, tested, honest code | Verified source, tests, README, no hidden infrastructure |

**Judge journey**

| Step | Judge does | Judge must see | Proof |
| --- | --- | --- | --- |
| 1 | Opens the live URL | The hero statement and one living artwork | None needed |
| 2 | Connects a wallet and switches to Monad Testnet | Clear network status, no dead ends | Wallet shows chain ID 10143 |
| 3 | Claims mock USDC from the faucet button | Balance appears and is labeled test-only | Transaction link |
| 4 | Mints a vault NFT with an initial deposit | A small geometric core appears | NFT ID and transaction link |
| 5 | Tops up the vault | The artwork visibly mutates after confirmation | Updated level, top-up count, new SVG |
| 6 | Opens the explorer | The same transaction and contract state | Verified source and event logs |
| 7 | Optionally transfers or redeems | Vault follows the token, or the artwork dissolves | Transfer or burn event |

## 4. Scope

**Priority 1 is mint, deposit, evolve and verify; transfer and redeem complete the loop if time allows.** The vault idea stays, but no real-money asset or yield is promised.

| Feature | Priority | Notes |
| --- | --- | --- |
| Evolving generative artwork | P0 Must | The core of the product |
| ERC-721 NFT representing a vault | P0 Must | OpenZeppelin implementation |
| Mock ERC-20 test token with faucet | P0 Must | Six decimals, no real value |
| Mint with initial deposit | P0 Must | Approve, then mint |
| Top-up deposit | P0 Must | Evolves state and artwork |
| SVG generated on-chain via `tokenURI()` | P0 Must | No IPFS, no image server |
| Live mutation after a confirmed deposit | P0 Must | Frontend waits for confirmation, then re-reads the contract |
| Wallet connection and network guard | P0 Must | Monad Testnet only |
| Transaction status and explorer links | P0 Must | See section 14 |
| Verified contract source | P0 Must | Explorer verification before the demo |
| Transfer NFT | P1 If time permits | Standard ERC-721 transfer |
| Redeem tokens and burn NFT | P1 If time permits | Atomic; final dissolution animation |
| Exhibition-style landing page and gallery | P1 Should | Added in this PRD, from the design reference |
| Create-vault preview of the next artwork | P1 Should | Added; uses a pure on-chain preview function |
| Evolution history strip | P2 Could | Added; rebuilt from deposit events, no historical state needed |
| Download SVG, copy share link | P2 Could | Added |
| Real USDC, real yield, DeFi strategy | Excluded | Not part of the MVP promise |
| Oracle, AI art generation, DAO voting | Excluded |  |
| Backend database, IPFS, indexer, marketplace | Excluded | Not needed |

Items marked "Added" go beyond the original draft; cut them first if time runs short.

## 6. Functional requirements

**Fourteen requirements cover the product; FR-01 to FR-05 and FR-08 to FR-12 are required for the MVP.** FR-01 to FR-07 come from the original draft; the rest were added.

| ID | Requirement | Priority | Acceptance criteria |
| --- | --- | --- | --- |
| FR-01 | **Connect wallet.** Connect an EVM wallet, show the address, switch to Monad Testnet. | P0 | On any other chain, write buttons are disabled, a network warning shows, and no transaction is submitted. "Switch network" adds or switches to chain ID 10143. |
| FR-02 | **Get test tokens.** Claim mock USDC from a faucet button. | P0 | Balance updates after confirmation. The UI states the token is for testing only. |
| FR-03 | **Mint a vault NFT.** Enter an initial deposit, approve if needed, then mint. | P0 | After success: a new NFT exists, the deposit is recorded, the art shows, and the NFT ID and transaction link are displayed. Approval is skipped when allowance already covers the amount. |
| FR-04 | **Evolve the artwork.** The owner tops up the vault. | P0 | After a confirmed top-up the contract state changes, `tokenURI()` returns a different SVG, and the frontend plays the evolution moment. Same state always yields the same SVG. |
| FR-05 | **Read the artwork.** `tokenURI(tokenId)` generates metadata and SVG. | P0 | No server or IPFS is used. The frontend may animate between old and new SVGs, but the data comes from the contract. |
| FR-06 | **Transfer ownership.** Standard ERC-721 transfer. | P1 | Vault balance, level and top-up count stay with the token ID. The new owner can redeem. |
| FR-07 | **Redeem and burn.** Return the tokens and burn the NFT in one transaction. | P1 | Only the current owner or an approved operator can redeem. If the payout fails, the whole transaction reverts and the NFT is not burned. |
| FR-08 | **Gallery home.** Project explanation, wallet connection, owned NFTs, Create Vault button. | P0 | A connected wallet sees its vaults as framed artworks. A wallet with none sees an empty-gallery state with one clear call to action. |
| FR-09 | **Create and deposit flow.** Enter an amount, preview the result, approve, submit. | P0 | Amount validation covers zero, more than balance, and below the minimum deposit. The preview shows the artwork the new state will produce. |
| FR-10 | **Transaction lifecycle UI.** Five visible stages for every write. | P0 | Wallet confirmation requested, submitted, confirmed or failed, contract data refreshed, explorer link. Evolution is never shown as complete before confirmation. |
| FR-11 | **Explorer and verification links.** Link transactions, contracts and the token. | P0 | Every confirmed write has a working explorer link. Both contracts show verified source. |
| FR-12 | **Vault detail.** Show the artwork and its facts. | P0 | Shows artwork, balance, evolution level, top-up count, mint date, and buttons for add funds, transfer and redeem. |
| FR-13 | **Evolution history strip.** Thumbnails of earlier states. | P2 | Rebuilt from `ToppedUp` event arguments through the pure preview function. No historical state queries. |
| FR-14 | **Share and export.** Download the SVG, copy the vault link. | P2 | Download produces the exact SVG that `tokenURI()` returns. |

## 7. Generative art system

**The artwork is a pure function of three recorded values: the token ID, the balance tier and the top-up count.** The same state always renders the same SVG. Nothing depends on block data, so the frontend, the explorer and an auditor all see identical output.

**Inputs**

| Input | Source | Effect on the artwork |
| --- | --- | --- |
| Seed | Hash of `tokenId` | Palette family and starting rotation, so every vault looks different |
| Balance tier (0 to 7) | Number of whole-token digits in `principal`, minus one, capped at 7 | Core size and geometric complexity |
| Top-up count | `topUpCount` | Rings, layers, hue drift and rotation |
| Level (0 to 8) | `min(topUpCount, 8)` | Which layers are unlocked |

**Evolution rules**

| Level | Trigger | What appears |
| --- | --- | --- |
| 0 | Mint | A small geometric core on a deep oxblood ground, one hairline guide ring, a museum label |
| 1 | First top-up | A ring of eight rotated petals around the core |
| 2 | Second top-up | A second, counter-rotated ring; hue shifts 14 degrees |
| 3 | Third top-up | Fine lattice lines tying the two rings together |
| 4 | Fourth top-up | A secondary accent hue enters; a third ring |
| 5 | Fifth top-up | Orbit dots on a hairline circle |
| 6 | Sixth top-up | Mirrored inner rotation and a soft glow |
| 7 | Seventh top-up | A gilded outer frame ring |
| 8 | Eighth top-up | A completion halo and a signature mark |
| 8+ | Every later top-up | Rotation advances 7 degrees and the label tally changes, so every deposit still shows |

**Palette families** (chosen by seed modulo 4): Vermilion (base hue 12), Gilt (38), Verdigris (165), Ultramarine (225). Each level shifts the hue and raises saturation slightly.

**Rendering rules**

- **Deterministic.** No `block.timestamp`, no `prevrandao`, no random input of any kind.
- **No on-chain trigonometry.** Draw rings with `rotate()` transforms and `stroke-dasharray` using integer angles.
- **Bounded size.** At most 8 rings and 12 repeated shapes per ring. Proposed budget: under 14 KB of SVG at level 8 and above. Test `tokenURI()` at the maximum level as an `eth_call` against the public RPC.
- **Safe output.** No user-supplied strings are embedded, only numbers and fixed text, so there is no injection surface.
- **Self-describing.** The SVG carries `<title>` and `<desc>` for accessibility and explorers.
- **Frame-agnostic.** A square `viewBox="0 0 400 400"` with its own dark ground, so it reads on both the cream page and the burgundy surround.
- **Museum label inside the SVG.** A small serif caption such as "No. 0007 · Level 3 · 4 deposits", which also guarantees every top-up changes the bytes.

**Metadata attributes** returned by `tokenURI()`: Level, Top-ups, Balance tier, Palette, Minted (unix time).

## 8. Smart contract specification

**Two contracts and one rendering library: MockUSDC holds the test token, LivingVault holds ownership, accounting and evolution, and the SVG library lives in the same Solidity project.** The vault has no admin, no upgrade path and no pause switch, so nothing can be taken from a vault except by its owner.

**MockUSDC.sol**

- OpenZeppelin ERC-20 with `decimals()` returning 6, name "Mock USDC", symbol "mUSDC".
- `faucet()` mints 1,000 mUSDC to the caller, with a short per-address cooldown (proposed default: 60 seconds).
- A restricted `mint(to, amount)` for the deployer to seed demo wallets.
- No real-world value; the UI and README say so.

**LivingVault.sol**

- OpenZeppelin ERC-721 with Enumerable (so the gallery can list a wallet's vaults without an indexer), ReentrancyGuard and SafeERC20. Pin the OpenZeppelin version in the project.
- Token IDs start at 1 and increase by one.

**Data model** (one packed storage slot per vault)

```solidity
struct Vault {
    uint128 principal;   // mUSDC, 6 decimals
    uint64  mintedAt;    // unix time
    uint32  topUpCount;
    uint32  reserved;    // spare bits
}

mapping(uint256 => Vault) private _vaults;
uint256 public nextTokenId = 1;
```

Evolution level is derived as `min(topUpCount, 8)` rather than stored, so it can never disagree with the count.

**Functions**

| Function | Responsibility | Access |
| --- | --- | --- |
| `mint(amount, recipient)` | Pull tokens, record the vault, mint the NFT, emit `Minted` | Anyone, amount at or above the minimum deposit |
| `topUp(tokenId, amount)` | Pull tokens, add to principal, increment count, emit `ToppedUp` | Token owner or approved operator |
| `redeem(tokenId)` | Delete the vault, burn the NFT, pay the principal to the owner, emit `Redeemed` | Token owner or approved operator |
| `tokenURI(tokenId)` | Return base64 JSON metadata with a base64 SVG image | Public view |
| `vaultInfo(tokenId)` | Return principal, top-up count, level and mint time | Public view |
| `previewSVG(tokenId, principal, topUpCount)` | Render the artwork for any hypothetical state | Public pure or view |

`previewSVG` powers two features without any extra infrastructure: the create-and-deposit preview, and the history strip rebuilt from event arguments.

**Events:** `Minted(tokenId, owner, amount)`, `ToppedUp(tokenId, amount, newPrincipal, newTopUpCount)`, `Redeemed(tokenId, owner, amount)`.

**Custom errors:** `ZeroAmount`, `BelowMinimumDeposit`, `NotAuthorized`, `NonexistentVault`, `UnexpectedReceivedAmount`.

**Security rules**

- The recorded balance rises only after tokens actually arrive: measure the contract's token balance before and after the transfer and require the difference to equal the amount.
- Checks-effects-interactions plus `nonReentrant` on `mint`, `topUp` and `redeem`.
- Redeem deletes the vault and burns the NFT before paying out; if the payout reverts, the whole transaction reverts and the NFT survives.
- Authorization uses the ERC-721 owner-or-approved check, so a transferred NFT moves redemption rights with it.
- Cast amounts to `uint128` with a safe-cast check.
- No unbounded loops: rendering is capped by the ring and shape limits in section 7.
- Monad bills gas by the gas limit rather than gas used, so the frontend sets explicit, modest gas limits instead of padding estimates.

## 9. Monad network and developer environment

**Target Monad Testnet, chain ID 10143.** The values below were checked against [Monad's testnet documentation](https://docs.monad.xyz/developer-essentials/testnet) on 10 October 2026. Testnets get reset (the docs record a reset from genesis on 2025-12-16), so re-check before deploying and keep contract addresses in one config file.

| Setting | Value |
| --- | --- |
| Chain ID | `10143` |
| Network name | Monad Testnet |
| Gas token | MON |
| Primary RPC | `https://testnet-rpc.monad.xyz` (QuickNode; 50 requests per second, 25 for `eth_call` and `eth_estimateGas`; batches of 100) |
| WebSocket | `wss://testnet-rpc.monad.xyz` |
| Fallback RPCs | `https://rpc-testnet.monadinfra.com` (Monad Foundation; 20 requests per second, no batching), `https://rpc.ankr.com/monad_testnet` |
| Explorers | [MonadVision](https://testnet.monadvision.com), [Monadscan](https://testnet.monadscan.com), [Socialscan](https://monad-testnet.socialscan.io) |
| Faucet (for MON gas) | [faucet.monad.xyz](https://faucet.monad.xyz) |
| Multicall3 | `0xcA11bde05977b3631167028862bE2a173976CA11` |
| Mainnet | Chain ID 143. Out of scope; never deploy the demo there. |

**Tooling**

| Choice | Requirement | Template |
| --- | --- | --- |
| Foundry (recommended for tests and fuzzing) | v1.8 or later with `network = "monad"` in `foundry.toml`; run tests with `forge test --network monad` | [foundry-monad](https://github.com/monad-developers/foundry-monad), configured for testnet |
| Hardhat 3 | Node.js 22.13.0 or later; set `evmVersion: "osaka"`; deploy with Hardhat Ignition and `--network monadTestnet` | [hardhat3-monad](https://github.com/monad-developers/hardhat3-monad) |
| Hardhat 2 | Node.js 20 or later; same `osaka` setting | [hardhat-monad](https://github.com/monad-developers/hardhat-monad) |

The original draft names Solidity 0.8.31. The official Hardhat guide confirms the `osaka` target and the Node versions above but does not state a compiler version in the part reviewed, so take the compiler version from the template you choose and pin it.

**Verification commands** (from the [Foundry verification guide](https://docs.monad.xyz/guides/verify-smart-contract/foundry))

```sh
# MonadVision, via Sourcify
forge verify-contract <address> <ContractName> \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org/

# Monadscan, Etherscan-style (needs an API key)
forge verify-contract <address> <ContractName> \
  --chain 10143 --verifier etherscan \
  --etherscan-api-key <KEY> --watch
```

**Monad behaviors that shape this product** (from [Differences between Monad and Ethereum](https://docs.monad.xyz/developer-essentials/differences))

- **Gas is charged on the gas limit, not gas used.** Set explicit, modest limits per action and show the maximum cost before the user signs.
- **Full nodes do not serve arbitrary historical state.** Do not plan to call `tokenURI()` at an old block. Cache the previous SVG in the browser before sending a transaction, and rebuild history from events with `previewSVG`.
- **Public RPCs are rate limited.** Batch reads through Multicall3, refetch once after a receipt, and avoid tight polling.
- **Contract size limit is 128 KB** (24 KB on Ethereum), which is ample for the renderer. Keep it small anyway.
- **Reserve balance rules** can make a transaction revert if the wallet holds too little MON. Show a low-MON warning with a link to the faucet.
- **No blob transactions and no global mempool.** Neither affects this app.

## 10. System architecture and frontend stack

**One Next.js app talks straight to two contracts through the user's wallet; there is no backend, database, indexer or image host.** The contract is the single source of truth, and the frontend only reads, signs and animates.

**Stack**

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js App Router, React, TypeScript | Specified in the original draft; easy Vercel deploy |
| Styling | Tailwind CSS with the design tokens as CSS variables | Fast iteration; tokens keep the museum look consistent |
| Wallet and chain | Wagmi and Viem; MetaMask and other injected wallets, WalletConnect optional | Standard for EVM dapps; use Viem's built-in `monadTestnet` chain if the installed version has it, otherwise define chain ID 10143 |
| Wallet UI | A small custom connect control built on Wagmi connectors | Off-the-shelf modals clash with the gallery look |
| Reads | Wagmi hooks with Multicall3 batching and React Query caching | Respects public RPC rate limits |
| Motion | CSS and the Web Animations API, plus Motion (Framer Motion) for orchestrated sequences | See section 13 |
| Contracts | Foundry, or Hardhat 3 | Section 9 compares them |
| Hosting | Vercel or another compatible host | Public URL for judges |

**Data rules**

- **Re-read after confirmation.** After a receipt arrives, refetch `vaultInfo` and `tokenURI`. Never infer the new state locally.
- **Cache before you send.** Keep the current SVG in memory before submitting a top-up so the before-and-after animation does not need historical state.
- **Decode `tokenURI` in the browser.** Parse the base64 JSON, then the `image` data URI.
- **Render the SVG as an image by default.** Use `<img src="data:image/svg+xml;base64,...">` so no script in an SVG can run. Inline the SVG for per-element animation only after parsing it and keeping a whitelist of element names.
- **Public configuration only.** Chain ID, RPC URL and contract addresses live in client-readable variables. The deployer's private key never leaves the contracts project.

## 11. Visual design direction

**Design concept: the vault as a gallery. Each vault is a painting in a gilded frame, and the site is an exhibition hall, not a DeFi dashboard.** The direction is adapted from the [Dribbble museum landing page](https://dribbble.com/shots/27001570-Modern-Art-Museum-Website-Exhibition-Landing-Page) and the screenshot attached to the brief.

*Source note: the Dribbble page needs JavaScript and would not load for the tools used here, so this section is built from the attached screenshot. If the shot has motion or further screens, share them and this section can be refined.*

**What the reference does well**

- **A floating cream sheet on a deep oxblood backdrop.** The page reads as a paper plane lifted off a dark room, with a soft shadow beneath it.
- **Frames that break the sheet.** Ornate gilded frames hang over the sheet's edges, giving collage-like depth.
- **A huge condensed serif headline in one saturated vermilion.** Three stacked lines, tight leading, all caps.
- **Type and frame interleaved.** A large oval frame sits between the letters, with some letters behind it and some in front.
- **Scale contrast.** Giant display type against tiny uppercase sans labels such as the two-line captions flanking the headline.
- **Minimal chrome.** A thin plus icon for the menu, a script wordmark in the center, one text link at the right.
- **A vermilion exhibition panel** anchored bottom left, with a staggered two-line serif title, small caps copy and a long thin arrow.
- **Color echo.** The red grounds of the paintings repeat the vermilion of the type.

**What to borrow, adapt and avoid**

| Reference element | Living Vault adaptation | Rule |
| --- | --- | --- |
| Cream sheet over dark backdrop | Same structure on every page | Borrow |
| Headline: three lines of vermilion display serif | "THE ART THAT KEEPS GROWING" in our own wording | Adapt |
| Central tilted oval frame with a painting | The live vault artwork in a gilded oval frame | Adapt: the product is the painting |
| Small frames in the corners | Other vaults in the gallery, or earlier evolution states | Adapt |
| Flanking micro-labels | "FULLY ON-CHAIN" at left, "MONAD TESTNET · 10143" at right | Adapt |
| Script wordmark, plus icon, one nav link | Own script wordmark, plus icon for the menu, "CONNECT" in place of "TICKETS" | Adapt |
| "Current Exhibition" red panel with arrow | "Your Collection" panel with a "Create a vault" arrow | Adapt |
| The reference's paintings, logo, name and copy | None of it | Avoid: use only original assets and wording |
| Neon gradients, glass cards, candlestick motifs, dense tables | None of it | Avoid: wrong genre for this product |

**Design tokens** (proposed; hex values were approximated by eye from the screenshot, so confirm them in the browser)

| Token | Value | Use |
| --- | --- | --- |
| Oxblood | `#2B0709` | Page backdrop, art ground |
| Cream | `#FAF4EE` | The floating sheet |
| Vermilion | `#F2330A` | Display type and large fills, 24 px and above |
| Vermilion Deep | `#C8240A` | Small text, links, buttons |
| Gilt | `#B8864B`, `#E3B778`, `#8A5A2B` | Frame gradients |
| Ink | `#140A0A` | Body text |
| Muted | `#6F6560` | Micro-labels and captions |
| Verdigris | `#2E7D6B` | Success states |

Contrast checked by hand: Vermilion on Cream is about 3.6:1, which suits only large display text. Vermilion Deep on Cream is about 5.1:1, which passes for small text. Verify both with a contrast checker before shipping.

**Typography** (candidates; load through `next/font` and test in the browser)

| Role | Suggested family | Treatment |
| --- | --- | --- |
| Display | A high-contrast condensed serif such as Instrument Serif or Bodoni Moda | All caps, tracking about -0.02em, line height about 0.85, size from roughly 4rem to 15rem fluid |
| Wordmark | A formal script such as Pinyon Script | Wordmark only, never body text |
| Interface and labels | Inter or Inter Tight | Uppercase 12 to 13 px for labels, 16 to 18 px for body |
| Data | A monospace such as IBM Plex Mono | Addresses, hashes, token IDs, amounts |

**Frames and imagery**

- Build frames as an `ArtFrame` component with oval and rectangular variants, using layered gold gradients, inner bevels and a drop shadow, or a nine-slice ornate border.
- Use only frame assets that are original, public domain or openly licensed, and record the license in the README.
- The artwork inside the frame is always the live SVG from the contract, never a static image.

## 12. Pages, components and layouts

**Three screens carry the product: the gallery home, the vault detail and the create-and-deposit studio.** Each is composed like an exhibition wall: a cream sheet over the oxblood backdrop, framed art, and small uppercase placards.

**Home and gallery** (`/`)

- **Header:** a thin plus icon at left opens the menu, the script wordmark sits at center, and `CONNECT` sits at right. After connecting, the right link shows the shortened address.
- **Hero:** three lines of vermilion display type, "THE ART / THAT KEEPS / GROWING". A tilted gilded oval frame sits between the lines and holds a live artwork. Two smaller frames overlap the sheet edges, showing other evolution levels. Micro-labels flank the headline: "FULLY ON-CHAIN" and "MONAD TESTNET · 10143".
- **Demo artwork:** a looping sequence through levels 0 to 8 drawn from pre-rendered SVGs bundled with the app, so the hero works before a wallet is connected or if the RPC is slow.
- **Vermilion panel** at bottom left: "Your Collection", a short line of copy, and a long thin arrow to "Create a vault".
- **How it works:** three exhibition placards numbered I Deposit, II Evolve, III Redeem, each with a small framed artwork.
- **Gallery wall:** the connected wallet's vaults as framed artworks in mixed frame sizes. Each card shows the number, level and balance. The empty state is a bare wall with one call to action.
- **Footer:** "Test tokens only · Monad Testnet", contract links on the explorer, repository link.

**Vault detail** (`/vault/[tokenId]`, viewable without a wallet so it can be shared)

- **Left:** the artwork in a large frame on a dark wall.
- **Right, a museum placard:** title "Living Vault No. 0007", balance in mUSDC, level meter showing 3 of 8 and the next unlock ("Next: fine lattice at level 4"), top-up count, mint date, owner as a copyable address chip, explorer link.
- **Actions:** `Add to vault` (primary, vermilion), `Transfer`, `Redeem` (secondary). Non-owners see a read-only page with no action buttons.
- **Below the art:** the evolution history strip (P2).
- **Transfer dialog:** validates the address, warns on self-transfer and states "The vault and its balance go with the NFT."
- **Redeem dialog:** shows the exact payout, warns that the artwork is burned permanently, and uses a hold-to-confirm button.

**Create and deposit studio** (`/create`; top-ups open the same studio as a drawer on the vault page)

- **Amount field:** large serif numerals, a Max button, the wallet balance, and a "Get test tokens" link when the balance is low.
- **Live preview:** a frame showing the artwork the new state will produce, from `previewSVG`, updating as the amount changes. For a top-up it shows before and after side by side.
- **Step tracker:** `1 Approve` then `2 Mint` (or `2 Deposit`), each with its own state. Approve the exact amount by default, not an unlimited allowance.
- **Cost line:** the maximum MON gas cost, computed from the explicit gas limit.

**Component inventory**

| Component | Purpose |
| --- | --- |
| `AppShell` | Oxblood backdrop, cream sheet, shadow, overlapping frame slots |
| `SiteHeader`, `WalletButton`, `NetworkGuard` | Navigation, connection, wrong-network banner that blocks writes |
| `ArtFrame` | Gilded oval and rectangular frames around any artwork |
| `VaultArt` | Loads and decodes `tokenURI`, shows a skeleton, exposes the previous and next image |
| `EvolutionStage` | Orchestrates the evolution animation (section 13) |
| `VaultCard`, `PlacardPanel`, `LevelMeter` | Gallery card, detail facts, progress toward the next unlock |
| `AmountField`, `StepTracker`, `TxPanel` | Amount entry, approval and mint steps, the five-stage transaction display |
| `FaucetButton`, `ExplorerLink`, `AddressChip` | Test tokens, explorer links, copyable addresses |
| `TransferDialog`, `RedeemDialog`, `HistoryStrip`, `EmptyGallery` | Remaining flows and empty state |

**Responsive behavior**

- **Desktop, 1280 px and up:** the full overlapping composition.
- **Tablet, 768 to 1279 px:** the oval frame stays central; corner frames move inside the sheet.
- **Mobile, under 768 px:** the sheet inset shrinks to 12 px, the headline scales fluidly, the oval frame sits above the headline, the corner frames are cropped, and the vault page gets a sticky bottom action bar. The wallet can be a mobile wallet browser or WalletConnect.

## 13. Motion and the evolution moment

**The evolution moment is the signature interaction: after a confirmed top-up, new rings grow outward from the core inside the frame, in about two seconds.** Everything else in the motion system stays quiet so this moment lands.

**Evolution sequence** (after the receipt is confirmed and the contract data is re-read)

| Time | What happens |
| --- | --- |
| 0 ms | A "Confirmed" pill appears; the refetch has already started |
| 0 to 400 ms | The frame "inhales": the artwork scales from 100% to 98% and a soft vignette darkens the edges |
| 400 to 1300 ms | The new SVG is revealed over the old one through an expanding circular mask from the core, so new rings appear to grow outward |
| 700 to 1400 ms | A gilt shimmer sweeps once across the frame |
| 800 to 1400 ms | The level meter fills, the balance counts up, and the label reads "Level 2 to 3" |
| 1400 to 2000 ms | The artwork settles back to 100% and a toast offers the explorer link |

The sequence never blocks the page, and a click or key press skips to the final state.

**Other states**

- **Pending (before confirmation):** the frame breathes slowly. The new artwork is not shown yet.
- **Failed:** the frame dims briefly, then returns to the current artwork with a plain explanation.
- **Mint:** the artwork "develops" like a photograph. The core draws itself with a stroke animation and the ground fades in over about 1.2 seconds.
- **Redeem:** after the burn is confirmed, the rings peel away in reverse order and fade over about 1.6 seconds. The empty frame stays with a label such as "Returned 120.00 mUSDC", then slides off the wall.

**Page-level motion**

- **Hero:** headline lines reveal upward through a mask, staggered by about 80 ms. Frames drift in with slight parallax.
- **Oval frame:** on desktop it tilts up to 3 degrees toward the cursor.
- **Scroll:** the sheet holds still while frames move at about 90% of scroll speed.
- **Hover:** gallery cards lift 4 px and catch a quick highlight on the frame.

**Implementation rules**

- Animate only `transform`, `opacity` and `clip-path`. Avoid animating large SVG filters. Target 60 frames per second on a mid-range laptop.
- Stack two `<img>` layers, old and new, and animate the mask on the top layer. Orchestrate with Motion (Framer Motion) and keep durations and easing curves as shared tokens.
- Respect `prefers-reduced-motion`: replace the sequence with a 200 ms crossfade and an instant counter, and disable tilt and parallax.
- Sound is optional, off by default and muted until the user opts in.

## 14. Transaction lifecycle and states

**Every write follows the same five stages, and the artwork changes only at stage 4.** Clicking a button never counts as success.

| Stage | What the user sees | Rule |
| --- | --- | --- |
| 1. Wallet confirmation requested | "Confirm in your wallet", buttons disabled | A rejected signature ends here with a neutral message |
| 2. Transaction submitted | Short transaction hash with an explorer link; the frame breathes | No new artwork yet |
| 3. Confirmed or failed | "Confirmed" or "Failed" | Success only when the receipt status is success; a revert is shown as failed |
| 4. Updated contract state | Numbers and artwork refresh, then the evolution moment plays | Refetch `vaultInfo` and `tokenURI` before showing "Evolved" |
| 5. Explorer link | A persistent link to the transaction | Shown in the toast and on the vault page |

**Two-transaction flows.** Mint and first deposit need an approval and then the main call. The step tracker shows both. After the approval is confirmed, re-read the allowance before sending the second transaction.

**Amounts.** Display mUSDC with two decimals, show full six-decimal precision on hover or focus, and format with the token's `decimals()`.

**Error and edge states**

| Situation | Behavior |
| --- | --- |
| Wrong network | Banner, write buttons disabled, "Switch to Monad Testnet" button; nothing is submitted |
| No wallet installed | Install link plus a WalletConnect option |
| Signature rejected | "Cancelled in your wallet. Nothing was sent." |
| Transaction reverted | "Transaction reverted: \<reason>. No funds moved." The reason maps the contract's custom errors to plain language, with an explorer link |
| Not enough mUSDC | Show the balance and a "Get test tokens" button |
| Not enough MON for gas | Warning with a link to the faucet |
| RPC error or rate limit | Retry with backoff, fall back to a second RPC, say "The network is busy"; never show success |
| Receipt takes long | "Still pending" with an explorer link; a timeout alone never marks a transaction failed |
| Confirmed but refresh failed | "Confirmed. Refreshing the artwork…" with a retry; the transaction stays marked successful |
| Viewing someone else's vault | Read-only page; action buttons hidden |
| Token burned or never existed | "This vault was redeemed" with an empty ghost frame |
| No contract code at the saved address | Banner: "Contracts not found on this network. The testnet may have been reset." |
| Empty gallery | A bare wall and one "Create a vault" call to action |