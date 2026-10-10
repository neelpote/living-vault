# Living Vault: Agent Handoff

Updated: 2026-10-10. Implemented, deployed, source-verified and publicly hosted. Actual user-wallet mint and top-up confirmed on Monad Testnet. Read this before modifying the project.

## Shared Art and Community Commission Extension

- Latest production deployment: `dpl_BKiwQgCiR8nExf4buVbPrduBSpkL`, READY, URL `https://living-vault-8hweblydc-neelpote44-7832s-projects.vercel.app`. Both `livingvault.pics` and `www.livingvault.pics` are attached to the existing Vercel project with user authorization. DNS remains external at `ns1.dyna-ns.net` / `ns2.dyna-ns.net`, currently parking A `185.53.179.128`; Vercel reports misconfigured. Custom-domain HTTPS/live status is NOT confirmed. Registrar action: root A `76.76.21.21` (accepted Vercel value), www CNAME `cname.vercel-dns.com`, TTL300/default; replace parking records, keep nameservers. Do not claim custom-domain bonus until DNS and HTTPS work.
- Read-only production Playwright check at the existing stable Vercel URL confirms `/together` loads the real shared contract, 1/36 claimed, report digest and oracle revision1, with no page errors or mobile390px horizontal overflow. Composition revision5 was observed; earlier revision4 evidence is historical. No production wallet write was sent by the agent.

- User explicitly requested shared compositions and artist-proposed holder-voted evolution. Added `/together`, `contracts/SharedLivingArt.sol`, `components/shared-gallery.tsx`, generated ABI/deployment bytecode, public `config/shared-deployment.json`, local-only checked deployment persistence, readonly evidence and source verification scripts. Existing deployed contracts remain unchanged.
- A new ERC-721 edition has 36 unique ownable cells (IDs1-36). Full original SVG is a 720x720 composition; each tokenURI image is an exact clipped crop of its cell. Claimed cells become prominent; holder expression0/1/2 (Quiet/Flow/Bold) changes its stroke weight and the collective work. Nine bounded presets combine3 geometries and3 palettes. Renderer output capped; runtime20506bytes.
- Deployer is immutable artist; oracle immutable existing F1 address. Artist publishes3 immutable ASCII-named distinct presets with60seconds-7days deadline, only after a claim and when no prior commission remains open/pending. Eligibility snapshots the minted-cell bitmask, NOT historical owners. One vote per eligible NFT by its current owner; transfers preserve votes, late claims excluded. No Sybil resistance or one-person-one-vote claim.
- Anyone finalizes after deadline. Highest vote total wins; lowest option wins ties; zero turnout closes with no pending chapter. Winner records oracle revision at finalization and waits for a strictly newer revision AND different sourceHash. Anyone can sync authentic newly published oracle state; this applies the winning preset and metadata notifications. No new proposal while winner awaits its report. No synthetic update, deposits, burn/redemption or admin custody rights in the shared edition. Reporting retains the existing F1 single-reporter trust model; activation may wait indefinitely for genuine newer data.
- `npm run shared:test` PASS21 checks: real historical round15/16 report initialization/update, bounds/authorization, holder expression, snapshot/late claims, transfer/double-vote rejection, deadlines, finalize/genuine-new-report gating, original metadata, zero turnout, wallet UI deployment/claim/edit/propose/vote/finalize/apply, exact fragment-vs-whole canvas pixel comparison, responsive1440/768/390/320 no overflow/errors, tie-break and full36 supply. Local EVM18548, temporary app3005; shared real configuration preserved. Screenshots at `test-results/together-*.png` are local tests, not public-chain evidence.
- Build/typecheck PASS; wallet testing caught an editor refresh race and stale-success test assertion, fixed by disabling unloaded controls, resetting selection only on actual expression changes and waiting for the matching transaction label. Per-cell clip paths prevent neighboring paths bleeding into cropped NFT images. Artist names/presets immutable; vote does not change art before its real event.
- Public shared deployment **confirmed**: `0x0e0596b392a1808f851bf8fa2476b8c59110e949`, tx `0xee24e78c5a145c592e0cfc4fa2002dbd215def921ac5233aba1ee8f5bb107600`, block69805772, artistuser `0x3eC0325C7656784f1aDB4b19e670AeAf26a2ecC2`, linked existing F1 oracle. User replied done. Readonly `shared:check` PASS with fragment1 owned byuser, expression2, original image equality; evidence `docs/shared-testnet-evidence.json`. Initial oracle revision1. No public chapter activation is claimed.
- `shared:verify`: HTTP200 success1/2, Monadscan Pass - Verified; MonadVision failed. Initial resolved full input changed AST allocation relative to import-callback compilation. Verification helper preserves original AST parse order via generated source aliases and import-path-only rewrites, checks executable creation/runtime bytes excluding metadata trailers, then submits. Metadata source hashes differ; no perfect match claimed. Actual deployment calldata separately matched original artifact byte-for-byte. Do not edit deployed contract source; source verification method/response persisted in config. No new wallet deployment needed.
- Regression validation after extension: original19 contract checks PASS and22 wallet-browser checks PASS, including pending/refresh/transfer/redemption and desktop/mobile layouts. Shared21 checks also passed including exact crop pixel equality.
- New docs section `#shared-art`, nav, homepage link and concise README extension; original acceptance exclusions for voting are superseded. Existing browser suite now copies complete public config into its isolated temp app so new routes can resolve JSON imports.

## Judging Readiness Update

- Owner subsequently requested a much shorter README. Reduced it from 306 to 73 lines: live links/video, product behavior, oracle trust, all three verified addresses, demo steps, reproducible local setup/checks and essential limitations. Detailed evidence, pitch and credits remain linked in existing documents; no application or contract changes.
- Owner found the 73-line version too short. Latest README is the middle-ground version: 143 lines, restoring the product story, feature table, F1 records, public proof, architecture diagram, ownership rules, Monad rationale and audience/business direction. Repetitive logs and deep operational details remain in linked documentation.

- Owner supplied prize rubric and a 5:45 PM IST October 10 cutoff. `docs/SUBMISSION.md` maps every criterion to evidence or a clearly outstanding owner action; includes a 90-second pitch mentioning all four eligibility items, live transaction runbook, social draft and demo/ad scripts. No award, social-view count, revenue, customer traction, mainnet or custom-domain claim is made.
- README now prioritizes the public repo/live site/verified F1 contract, links the submission kit, and distinguishes proposed audience/revenue/validation from measured traction. Default public evidence instructions use the active F1 collection, not burned deposit vault No. 1.
- Fresh public clone of commit `1a0c961bc0ef96082584b409e89a9e66e7c4311d` in an isolated temp directory: `npm ci` PASS (0 reported vulnerabilities), compilation PASS, 19 contract checks PASS, renderer checks PASS, build PASS, sequential typecheck PASS. Started `npm run dev -- --port 3004`; read-only browser verified homepage and configured F1 gallery with exact source digest match, no environment file/private key. Temporary server stopped; original shared server left running.
- `.github/workflows/verify.yml` adds Node 22 clean-install/compile/contract/renderer/build/typecheck checks. No live-data/API-dependent F1 tests or wallet signing in CI. Workflow execution and branch-protection enforcement must not be assumed from the file alone.
- No new on-chain writes, mainnet deployment, domain purchase, or social posting occurred for this readiness update. Historic transactions do not fulfill a live judged transaction; presenter must perform it during the demo.
- `docs/videos/living-vault-product-demo.mp4`: actual public-site read-only Playwright capture, converted to H.264/yuv420p MP4 with fast-start, 1280x720, 61.36 seconds, 947526 bytes, silent. Sample frames visually reviewed (homepage, actual Ferrari original SVG, report provenance). No fabricated data/wallet transaction. This is a ready-to-upload product walkthrough, not a posted social video or finished creative ad. WebM intermediate removed; ad script remains in submission kit.

## User request and scope

Build the complete Living Vault project from the supplied PRD, working on Monad Testnet. Include mint, test-token faucet, top-up evolution, transfer, redemption, gallery, public detail, hypothetical previews, event-derived history, exact SVG download, sharing, and transaction lifecycle. Maintain this handoff so another agent can distinguish verified facts from assumptions.

PRD source: `/Users/neelsubhashpote/.codex/attachments/31e4660e-c855-4f83-a559-d41a11dae93a/Pasted text.txt`.

## Decisions

- Next.js App Router, React, TypeScript, Wagmi, Viem; custom injected-wallet connection.
- OpenZeppelin 5.6.1 for ERC20, ERC721Enumerable, reentrancy guard, safe transfers and casts.
- Solidity 0.8.31, optimizer 200, Osaka target; Hardhat 3 local EVM and Node assertions for contract integration tests. Foundry is not installed on this machine.
- On-chain deterministic SVG, no backend/IPFS/indexer. Historical snapshots rebuilt from event arguments and pure renderer.
- Monad Testnet ONLY: chain 10143. Local test EVM: 31337, explicitly separate.
- Preview artwork must be generated from the actual compiled Solidity renderer. Never represent it as an owned/live NFT.
- Confirmation and refreshed state precede visible evolution. Failed refresh must not turn a successful transaction into failure.
- Test assets have no monetary value or yield. F1 sports oracle and shared collection voting are later requested extensions; no mainnet features.

## Deployment facts

### F1 Oracle Extension (2026-10-10)

- User explicitly requested real, verifiable F1 championship oracle data and striking artwork. New `/f1` collection is separate because the existing vault is immutable; no old vault redeployment/custody changes. Contract `contracts/F1LivingArt.sol` combines a custom authorized push oracle with ERC721Enumerable and original on-chain metallic turbine SVG generation. No fabricated data or forced evolution control.
- Public Monad Testnet address: `0x1ba990f986e74295b1a4f65c5d654ebaa6ee4451`; deployment hash `0x0a6302a849fd74cc86a294881a47708ee15cedbc4082ecc9cfbc918dd90f12db`. User confirmed deployment through wallet and minted Ferrari NFT No. 1. Reporter/owner `0x3eC0325C7656784f1aDB4b19e670AeAf26a2ecC2`. Source verification HTTP 200 success/verified 2 of 2: MonadVision perfect match and Monadscan Pass - Verified, persisted in `config/f1-deployment.json`.
- Source: Jolpica F1 API. Fetched and archived all 68 final champion responses from 1958-2025 plus 2026 11-team roster in `config/f1-history.json`; generator `scripts/fetch-f1.mjs`. `lib/f1-data.ts` validates complete championship coverage, uniqueness, exact constructor identities, numeric ranges and current standings. No predecessor inheritance. 2025 totals: Ferrari16, McLaren10, Williams9, Mercedes8, RedBull6; other active identities0.
- `/api/f1` fetches actual 2026 roster/standings/calendar with identifying user-agent and five-minute fetch cache. If final scheduled race is completed and date passed, it includes the final 2026 champion. Missing/invalid data yields 503, no substitute result. Canonical raw report Keccak-256 excludes observation time and includes archive, roster, standings, calendar and identity policy. Contract initialization/publish stores digest and team totals, latest points (milli-units), wins, positions, season/round, observation time and revision.
- Trust boundary: immutable single reporter is trusted to bridge correct HTTP data. Not Chainlink/Pyth, not decentralized, not HTTP attestation. Source digest proves published report bytes, not truth. Source/published values and timestamps, reporter, digest comparison, championship-year links and raw report download are visible. No unattended updater: reporter fetches and signs new `publish` transactions after actual source changes. Duplicates, stale rounds/observations, future observations, invalid lengths and unauthorized writes rejected; corrections within a newer report are possible.
- Championship totals influence blade layers (bucketed/capped); points and titles influence rotation; wins influence blade orientation. `teamSVG` is on-chain original, `tokenURI` encodes exact image and current attributes. Linked NFTs evolve on oracle publication, with ERC4906 BatchMetadataUpdate. Free mint + test gas; no mUSDC vault for F1 NFTs. UI reads chain every15s, offers selected-team art/export and owned token explorer links. Failed/pending writes use shared receipt handling; deployment resumes cached pending tx. No public key/signing secrets extracted.
- Local-only `/api/f1-deployment` validates network, receipt, reporter, on-chain digest and deployment calldata before persisting public configuration and full initial/latest report. Production rejects persistence. Verification uses exact constructor tuples and compiled standard input in `scripts/verify-f1.mjs`. `scripts/check-f1-testnet.mjs` independently derives raw data and compares all11 published teams, source digest, SVGs and (when minted) NFT image. Evidence at `docs/f1-testnet-evidence.json`: checked `2026-10-10T10:07:14.369Z`, revision1, round16, titles through2025, supply1, FerrariNFT1 owneruser. Digest `0xcf41ee292ce6a1e7b1a2fb921f9b08222840a759d7971d9fcd28fe30a1424b55`.
- Tests: `npm run f1:test` with dev server running reads real API reports, isolated Hardhat18547 and temporary Next app3002. Uses actual round15/16 reports to prove transferred NFT metadata changes on update, rejects unauthorized/stale/future/incomplete reports, verifies NFT/render equality, team selection and loaded artwork/no overflow at1440/768/390/320. 14 checks PASS. No test writes public chain or modifies shared config. First browser attempts used mismatched127.0.0.1 dev origin and failed hydration; final isolated test passed. Original vault wallet suite not rerun because custody modules unchanged.
- Public post-deployment oracle update is not yet observed; feed currently matches real round16 source, so publishing a fabricated/replayed increase is forbidden. Do not claim the local race update as a live testnet update. The deposited vault No. 1 remains redeemed as noted below; F1 NFT No. 1 is a different collection and is active.

- GitHub repository: https://github.com/neelpote/living-vault (public). Created under authenticated `neelpote`; local `main` uses author NEEL POTE and GitHub noreply email `177764465+neelpote@users.noreply.github.com`. README expanded for judges with demo steps, features, art provenance, contract links, transaction evidence, architecture, setup, tests and validation limits. README screenshots live in `docs/images/`.
- Repository preparation live read (2026-10-10): totalSupply=0, nextTokenId=2, ownerOf(1) reverts; hosted vault No. 1 reports redeemed. Prior 21 mUSDC/two-top-up evidence is historical, not current. No redemption transaction hash or payout receipt was independently checked during this preparation. No public-chain writes performed. README directs judges to create a fresh vault and describes this state. Homepage's earlier No. 1 link reaches its redeemed state; it is no longer a live evolution demo.

- Chain: Monad Testnet, 10143. MockUSDC: `0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb`. LivingVault: `0x760600d4fdd56b49941fa91b096666d56c08ec5f`.
- Shared configuration: `config/deployment.json`. Recorded scan start block `69764353`; browser timestamp `2026-10-10T07:21:57.930Z`. Scan start is not asserted to be the exact creation block.
- Both deployed by user's wallet `0x3eC0325C7656784f1aDB4b19e670AeAf26a2ecC2` through `/deploy`. No private key was provided or extracted. Wallet also holds mainnet funds: NEVER deploy to mainnet.
- RPC confirms token runtime exactly matches build; vault asset equals mock token, and vault runtime size/compiler metadata match build.
- Verification API returned HTTP 200, success true, verified 2 / total 2 for each contract: MonadVision perfect match and Monadscan Pass - Verified. Full responses saved in configuration.
- Public app: https://living-vault-three.vercel.app . Vercel project `living-vault`, scope `neelpote44-7832s-projects`; latest production deployment `dpl_FsJrmhdyotUv5jT7kb9ZnbBXnXKa` READY (real F1 oracle collection, on-chain artwork, provenance and documentation, plus existing vault and landing page). Deployment URL: https://living-vault-7m6zb2l4j-neelpote44-7832s-projects.vercel.app . `.vercel/` is ignored.
- F1 production read-only browser validation PASS: exact live/source digest match, all 11 team rows, Ferrari 16 and Mercedes 8 titles, loaded original SVG at 1440/390px, no horizontal overflow or page errors, and published documentation section present. Build and sequential typecheck PASS. Screenshots `test-results/f1-production-1440.png` and `test-results/f1-production-390.png` are local QA files, not committed.
- Initial production deployment built but returned 404 because project preset was Other. Added `vercel.json` explicitly selecting `nextjs`, rebuilt and promoted the corrected deployment. Do not remove this configuration.

## Progress

- Read full supplied PRD (ends at section 14; sections 5, 15 and 16 are absent).
- Inspected workspace: no pre-existing application or contracts.
- Read monskill, scaffold, gas, frontend-design and ponytail guidance.
- Scaffolded root package, TypeScript, Next.js, Hardhat config, ignored secrets and deployment config.
- Built MockUSDC, LivingVault, bounded deterministic renderer and HostileToken test double.
- Built exhibition, wallet selection/network switching, owned gallery, create/deposit studio, public detail, adaptive event history, share/exact SVG download, transfer, keyboard/pointer hold-to-redeem, and two-step wallet deployment.
- Generated public ABI constants, creation bytecode and artwork previews from Solidity. Preview assets are NOT minted testnet NFTs.
- Added optional server-side CLI deploy/verify scripts; public testnet writes are hard-gated to 10143.
- Added localhost-only development helpers to persist checked public deployment configuration and submit source verification. No signing or secrets in these endpoints.
- Copied supplied PRD to docs/PRD.md. Added README and docs/ACCEPTANCE.md to fill missing acceptance criteria and record explicit scope decisions.
- Fixed a dependency audit finding using a patched tmp override; npm install reports zero vulnerabilities.
- Read Next.js generated AGENTS.md and relevant local Next docs.

## Verification

- `npm run contracts:compile`: PASS, Solidity 0.8.31 / Osaka / viaIR / optimizer 200. Runtime sizes: MockUSDC 2,354 bytes, LivingVault 13,853 bytes (both below Ethereum's stricter 24KB limit too).
- `npm run contracts:test`: PASS, 19 assertions/groups covering faucet cooldown/ownership, minimum/zero/overflow, authorization, operator deposits, deterministic previews, URI mutation for counts 0 through 12, <14KB SVG, transfer state, owner payout, burns, monotonic IDs, fee input and payout rollback.
- `npm run typecheck`: PASS.
- `npm run build`: PASS; all app/API routes generated.
- Public Monad RPC `eth_chainId`: actual response `0x279f` = 10143.
- Browser suite: PASS, 22 checks and zero page errors. Includes MetaMask direct-account connection, actual local deployment, faucet, rejection, mint, top-up, pending state, failed refresh/retry, history/export, transfer, keyboard hold redemption and responsive layout.
- Initial local fixture lacked Multicall3; fixed by installing Viem's bundled bytecode on local test EVM. Transaction refresh throws on failed active queries while preserving confirmed transaction success and exposing retry.
- Desktop/mobile screenshots reviewed at 1440, 768, 390 and 320px. Fixed 320px header overlap with icon-only accessible wallet button.
- `npm run test:testnet`: PASS at `2026-10-10T07:35:13.920Z`. Durable generated evidence: `docs/testnet-evidence.json`. Token 1 principal 21,000,000 raw units (21 mUSDC), topUpCount 2, level 2. Current SVG matches current on-chain preview and differs from mint. Contract custody balance covers this principal.
- Token 1 mint: `0x743c3291242b2fa31c18037b770268bab8e02eedf222e0a440b2af9f692b26a2`, block 69764610, initial 1 mUSDC.
- Token 1 top-up: `0x847433ee321458f270d8c90988ca2598681220adb20649d137b93120b0e0f161`, block 69765774, 10 mUSDC. Both receipts confirmed. User initially completed mint without deposit; later confirmed deposit and RPC independently verified it.
- Second top-up: `0x4b0aa0f91fe89e8bad4f9e00300c15f332013ded42e455f7910df96ded5399af`, block 69765905, another 10 mUSDC. All three receipts confirmed.
- Public unauthenticated browser checks: `/`, `/create`, `/vault/1` HTTP 200, artwork loaded, zero page errors, 390px no horizontal overflow. Hosted detail independently displayed 21 mUSDC and two top-ups. Narrow header wallet label was hidden below 600px after screenshot review; accessible label/title remain.

## File Map

- `app/`: Next App Router gallery, create, vault/[tokenId], deploy and dev-only deployment/verification handlers.
- `components/`: app shell, providers, art frames/evolution, collection, studio, detail/history and wallet deployment.
- `lib/chain.ts`: testnet client, explorer and public types; `lib/hooks.ts`: reads, query caching and receipt-driven writes.
- `contracts/`: deployed production sources plus test double.
- `scripts/`: compile, local contract checks, CLI deploy/verify, browser integration checks.
- `config/deployment.json`: the only shared deployment config. Browser uses localStorage only when shared config is empty.
- `lib/generated/`, `public/deploy/`, `public/art/`: generated, safe public artifacts. Regenerate compilation and local tests after Solidity changes.
- `test-results/`: ignored screenshots and actual test reports. Never treat local test addresses as real testnet addresses.

## Operational Facts

- Development server running at http://localhost:3000 (port 3000).
- Browser wallet test runs use local Hardhat on 18546 with RPC interception inside a headless test context only. This is absent from shipped app code.
- Contract checks start/stop a separate local Hardhat node on 18545.
- .env.local and any keys are ignored. No secret has been created.
- Normal app activity needs no server/database/indexer. Deployment helpers only write public config on localhost during development; production rejects persistence/verification helpers.
- Fonts loaded from Google Fonts; original SVG art and original CSS gold frames. Respect reduced motion and accessible modal/hold interactions.

## Next work

Core implementation, local verification, deployment, source verification, hosting and actual mint/top-up are complete. Public-chain transfer/redeem remain unexercised with the user's wallet; both passed local contract/browser tests. Do not redeem the display NFT without user authorization. No independent security audit, real-asset readiness, mainnet deployment, oracle, DAO or yield is claimed. Public testnet can reset; recheck chain/code before relying on stored evidence. A timed judge walkthrough has not been measured.

## Demo Art and Platform Documentation Update

### Latest Landing Direction: Real Paintings Around Clear Typography

User requested the obstructing center piece moved away from the text and real art in all landing frames. The oval frame is now at upper left, Monet at lower left, and Hokusai to the right. On mobile the three paintings form a band above the headline. `museum-composition` CSS keeps frames outside the headline bounds. Images: Van Gogh Self-Portrait (1887), Monet Water Lilies (1906), Hokusai Great Wave (1830-1833); locally hosted JPEG reproductions with source records in `docs/ARTWORK_CREDITS.md` and public credits at `/docs#art-credits`.

The historical paintings are editorial images, not evolving NFTs. Landing preview controls were replaced with a direct link to real evolving vault No. 1. Actual NFT art in collection/studio/detail/history, deposits, metadata and original export remain unchanged. ArtFrame gained an optional `alt` override for accurate painting descriptions. The existing browser suite's first assertion now checks the live-vault link instead of removed preview controls.

Focused validation: typecheck PASS; screenshots and geometry checks at widths 1440, 1024, 768, 390 and 320 show all three images loaded, zero image/headline bounding-box overlap and no horizontal overflow. No public-chain writes were sent for this visual revision.

### Earlier Direction: First Iteration Restored

The user's latest instruction was to restore the FIRST iteration, explicitly including evolving artwork. This supersedes the intervening text-only hero request. Exhibition is restored in `components/art.tsx`: oversized vermilion LIVING / VAULT typography, central angled oval gold frame, two smaller angled artworks, ivory/burgundy palette, captions, preview minus/plus controls and create CTA. The three hero images use original compiled Solidity preview assets, with `original` enabled on ArtFrame. Preview changes crossfade/reveal through the existing evolution animation; controls are bounded to levels 0-8. Removed `components/living-stage.tsx` and its stylesheet. Removed the later bloom-hero/minimal-frame CSS overrides, restoring original gold frames. No generated portrait asset is used.

The demo bloom presentation on actual vault/collection/studio/history pages and illustrations in `/docs` remain as implemented below; the request applied to restoring the original gallery presentation. ArtFrame and Exhibition are both exported directly from `components/art.tsx`. Existing wallet and contract logic is unchanged.

Verification for this restoration: typecheck passed; screenshots at 1440, 390 and 320px show the three original artworks, original composition and no horizontal overflow. The full local wallet browser suite was rerun for the restored preview, deposit evolution and transaction-state handling. See current `test-results/browser-report.json` for exact results.

- User rejected the original sparse geometric artwork and requested appealing demo visuals plus a complete production-style documentation page.
- Added `lib/demo-art.ts`: deterministic sculptural bloom SVG presentation with layered colored petals, engraving veins, seeded palettes and a phyllotactic center. Token number, confirmed top-up count and balance tier come from the original SVG title/description, parsed with DOMParser. Count/level and tier affect the art; it is bounded below 150KB, intentionally a browser presentation rather than a replacement on-chain renderer.
- `components/art.tsx` applies this presentation across landing, collection, studio, public detail and event history. On presentation failure the original remains available. Existing transaction lifecycle is untouched; pending/failed state does not invent a deposit. Landing study controls remain hypothetical.
- Vault detail eye control toggles original on-chain SVG. Label identifies DEMO ART / ON-CHAIN STATE. Download exact SVG continues to export the original metadata image. NO contract edits, redeployments, metadata updates or migration occurred in this artwork revision. Existing custody and wallet permissions are unchanged.
- Landing composition now features a larger uncropped bloom with clear product title; simplified thin frames replace ornate gilding. Main app fonts/navigation/workflows retained.
- Added `app/docs/page.tsx`: nine chapters (overview, quick start, lifecycle, provenance, architecture/contracts, token/fee model, safety, troubleshooting and FAQ), sticky desktop chapter navigation, responsive mobile navigation, contract addresses from shared config, interaction accordions, bloom examples and two original topographic landscape illustrations. Documentation artwork is explicitly not an NFT. Linked from main menu/footer.
- `.vercelignore` uses `/docs` to exclude only root engineering documents, not the new `app/docs` route. Do not change this back to an unanchored `docs` entry.
- Post-change verification: typecheck PASS; full 22-check browser wallet suite PASS with zero page errors; `node scripts/test-demo-art.mjs` PASS deterministic/seed/tier/distinct count/bounds assertions; read-only browser checks PASS original/demo toggle, 8 substantive docs sections plus overview, FAQ and valid SVG XML.
- Screenshot/layout checks: landing 1440/390, vault 1440, docs 1440/390/320 have loaded images and no horizontal overflow. See ignored `test-results/redesign-*.png`. No real-wallet writes were sent during this update.

## Maintenance Commands

### Landing Expansion (2026-10-10)

- Added `components/landing-story.tsx` as server-rendered homepage content: platform introduction, three illustrative evolution studies, four-step create/top-up/transfer/redeem journey, ownership and testnet facts, five native FAQ disclosures, and a closing create/docs call to action.
- `app/page.tsx` now wraps the exhibition, story, existing wallet collection, and FAQ in `.home-page`. Scoped CSS enlarges homepage supporting text and collection text without changing transaction screens. New sections use unframed layouts and existing ivory/vermilion museum typography. Existing real paintings remain clear of the hero headline.
- Evolution studies use deterministic `demoArtwork` at top-up counts 0, 3, 8 and explicitly identify themselves as illustrative browser art. No simulated transaction or live balance claims. Original metadata and contracts remain unchanged.
- Added subtle 16px scroll-entry movement for study images only where native view timelines are supported; reduced-motion disables it. No growing/zooming animation. FAQ uses native details/summary without extra client code or dependencies.
- Published to the stable alias above. Production mobile check PASS: new content present, all homepage images loaded, no horizontal overflow, and documentation navigation succeeds.
- Verification: production build PASS; typecheck PASS after build (initial parallel typecheck saw transient missing generated Next routes, resolved on sequential rerun). Read-only Playwright checks at 1440, 1024, 768, 390, 320px PASS: all six homepage images load, no horizontal overflow, FAQ opens, zero browser page errors. Visually reviewed full-page desktop/mobile screenshots, saved as `test-results/extended-*.png`. No wallet writes or contract changes; full wallet suite not rerun for this content-only revision.

- `npm ci`, `npm run contracts:compile`, `npm run contracts:test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`, `npm run test:testnet`.
- Browser suite creates an isolated temporary app on port 3001, preserving shared deployment config, and uses local Hardhat on 18546. Contract suite uses 18545. Tests stop their temporary services.
- Public RPC event queries are limited to 100 blocks; application history and testnet evidence script use compatible chunks. Avoid unbounded event queries.
- After any Solidity edit, regenerate ABIs/creation artifacts/art and retest. Existing immutable deployment will not automatically change; new contracts/config and production rebuild are required.
- Redeploy frontend with `vercel deploy --prod --yes --scope neelpote44-7832s-projects`. No database or server secrets required. Production helpers reject development config persistence/verification.
- Preview art assets are generated local examples, not owned testnet NFTs. Never confuse headless test receipts with public-chain evidence.

## MetaMask Connection Issue (User Report)

- User reports MetaMask extension crash `Cannot read properties of undefined (reading 'origin')` WHEN CONNECTING the app; not an observed contract revert.
- Matching upstream OPEN issue: https://github.com/MetaMask/metamask-extension/issues/46887 (opened 2026-10-06; Chrome/macOS; internal 13.52.0 main build). Report describes full-screen crash during connect/switch; side panel did not crash. User's installed version has NOT been established; don't claim it is 13.52.0.
- Wagmi injected connector with default shimDisconnect first invokes wallet_requestPermissions. Added explicit MetaMask connector plus fallback with shimDisconnect false, which uses eth_requestAccounts directly. This is a reduced-prompt connection path, NOT a verified fix to MetaMask itself.
- Browser test chooses this MetaMask path and asserts no wallet_requestPermissions prompt; final 22-check suite passed after this change.
- User advised to close crashed full-screen view and try toolbar popup. If needed, restart extension/browser only with password available; do not reset/delete/reinstall wallet as a first troubleshooting step. Official restart guide: https://support.metamask.io/configure/troubleshooting/how-to-restart-metamask/.
- User subsequently connected, deployed both contracts, minted and deposited successfully. This does not establish that the upstream extension defect is globally fixed.
