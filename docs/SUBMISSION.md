# Living Vault: Monad Blitz Pune V3 Submission Kit

Evidence date: October 10, 2026. The organizer's rubric is supplied by the project owner; this document is an evidence checklist, not an award or score guarantee.

## Eligibility: Mention All Four During the Pitch

| Criterion | Evidence | Status |
| --- | --- | --- |
| Public GitHub repository | https://github.com/neelpote/living-vault | Public |
| Proper README with live page and contract address | [README](../README.md), top judge section and full setup instructions | Included |
| Contracts deployed on Monad Testnet | [LivingVault](https://testnet.monadvision.com/address/0x760600d4fdd56b49941fa91b096666d56c08ec5f), [MockUSDC](https://testnet.monadvision.com/address/0x2937e4a29f6a60ee56375f7b3fd9b71542ec6afb), [F1LivingArt](https://testnet.monadvision.com/address/0x1ba990f986e74295b1a4f65c5d654ebaa6ee4451) | Chain 10143 |
| Public hosting | https://living-vault-three.vercel.app | Live Vercel site |

## Advance Points: Working Project

| Criterion | Evidence / Action | Status |
| --- | --- | --- |
| Announced functions work | [Verification](VERIFICATION.md), core vault tests, F1 tests and public-chain evidence | Recorded checks pass; external wallet/RPC availability remains a dependency |
| Live on-chain transaction during demo | Follow the runbook below; show the receipt on the explorer | Must perform during the judged demo; historical receipts do not satisfy this |
| Explorer source published | Original three contracts verified on MonadVision/Monadscan; SharedLivingArt verified on Monadscan at `0x0e0596b392a1808f851bf8fa2476b8c59110e949` | Verified, not audited |
| Someone else can run it | Clone, `npm ci`, `npm run dev`; public config, no private key required | README instructions; clean-install validation recorded in handoff |

## Ninety-Second Pitch

"Most NFT art captures one moment. Living Vault records what happens next.

We built two working collections on Monad Testnet. In the deposit collection, a holder adds test tokens and the artwork changes after confirmation. The NFT carries its balance when transferred, and the current owner can redeem the balance and burn the piece.

The sports collection uses real F1 championship history and race results for all eleven teams. Titles shape its metallic layers, points rotate the composition, and wins change blade orientation. The original SVG is rendered on-chain. You can download the source report and compare its digest and values with the published contract state. This is an explicitly trusted reporter oracle, not a decentralized feed.

Living Together adds 36 ownable fragments of one shared composition. Holders shape their own fragment and vote on artist-proposed chapters; a genuinely newer F1 oracle report activates the winner. The public deployment has a claimed fragment, while vote-to-event activation is tested locally using real historical reports, not claimed as a completed public event.

Our code is public on GitHub under neelpote/living-vault. The README contains the live URL, contract addresses, and complete local setup. The application is publicly hosted on Vercel. All four contracts are deployed on Monad Testnet with source published on explorers.

Now I will send a real testnet transaction and show its confirmation and resulting artwork.

Our first audience is artist-led and sports communities. We plan to test commissioned collections and hosted publishing as paid services. That is a business hypothesis, not claimed revenue. The innovation is the verifiable connection between participation, real-world results, and the collectible itself."

## Live Demo Runbook

### Before Going on Stage

- Open the public application in a normal wallet-enabled browser, not a browser without wallet extensions.
- Connect to **Monad Testnet 10143** and verify that the wallet displays the test network. Never approve a mainnet prompt.
- Keep test MON available. Claim test mUSDC on `/create`, then mint a fresh deposit vault before the pitch. Keep at least 10 mUSDC for the live top-up.
- Note its token ID and open its detail page. Old deposit vault No. 1 is redeemed; it is not the current F1 NFT No. 1.
- Have an explorer tab and `/f1` ready. Select Ferrari, showing 16 completed constructors titles and the original on-chain art.
- Do not publish unchanged oracle data or invent a race result. A fresh result requires the authorized reporter and a genuinely changed source report.

### During the Demo: One Visible Mutation

1. Show the active deposit vault, its current principal and top-up count.
2. Select **Add to vault**, enter 10 mUSDC, and choose **Deposit & evolve**. Approve the exact amount if prompted; confirm the deposit on Testnet.
3. Wait for the receipt. Show increased principal/top-up count and changed artwork. Toggle the original SVG view to demonstrate the actual NFT metadata, not only the richer browser presentation.
4. Open the successful transaction on the explorer. This is the live judged transaction, not a historical screenshot.
5. Switch to `/f1`: choose Ferrari then Mercedes, show 16 versus 8 titles, and explain that these are different real-data outputs, not a newly published oracle mutation.
6. Show source/published values, report download and verified contract link. If time permits, mint an F1 NFT for another real testnet transaction.

If the RPC or wallet fails, show the error honestly, retry once, and present recorded receipts as historical evidence only. Do not claim the live-transaction criterion was completed. Transfer and redemption are irreversible ownership/burn operations: demonstrate them only with a disposable test vault and consenting recipient.

## Build in Public: Owner Actions Still Required

**Ready-to-upload recording:** [61-second product video](videos/living-vault-product-demo.mp4). Actual public-site capture: exhibition, Ferrari/Mercedes on-chain art, all-team records, provenance, and docs. H.264 MP4, 1280x720, silent. This is a read-only walkthrough, not a live transaction demo or an already-published social post. Add narration/captions from the script below and upload with the required tags. The creative ad remains a separate script, not a finished video.

| Criterion | Required evidence | Current evidence |
| --- | --- | --- |
| Project post tagging @monad, @monad_dev, @geeky_kartikey | Public X/LinkedIn post URL; confirm tags resolve on that platform | Not supplied |
| Running product demo video, 30 seconds or longer | Public social post with playable video and real product activity | Not supplied |
| Creative product ad video | Public social post with playable creative ad | Not supplied |
| 5,000 combined views by 5:45 PM IST on October 10, 2026 | Platform analytics/screenshots and post URLs from the event window | Not supplied; no view claim |

### Project Post Draft

Built Living Vault at Monad Blitz Pune V3: art that remembers.

Add test tokens and the NFT evolves after confirmation. Or mint F1 artwork shaped by real championship history and race results for all 11 teams, with the original SVG generated on-chain.

Live: https://living-vault-three.vercel.app
Code + verified contract addresses: https://github.com/neelpote/living-vault

Monad Testnet only. F1 updates use an authorized reporter; no fabricated results.

@monad @monad_dev @geeky_kartikey

### Product Demo Video: 45-60 Seconds

| Time | Screen | Narration |
| --- | --- | --- |
| 0-8s | Homepage then active vault | "An NFT that remembers what happens to it." |
| 8-28s | Real deposit, wallet prompt, pending status | "Add test tokens. Your wallet signs. The piece evolves after the chain confirms." |
| 28-38s | Confirmed art and explorer receipt | "The balance and original SVG are verifiable on Monad Testnet." |
| 38-50s | F1 teams, title counts, source comparison | "A second collection follows real sports results, with every source report inspectable." |
| 50-60s | Live URL, repository and source verification | "Try Living Vault. Public code. Verified contracts. Living art." |

Record the actual confirmation wait; extend the video if needed. Do not speed-edit a failed transaction into apparent success. Hide personal wallet notifications, keys, and unrelated accounts. Add readable captions, the three requested tags, and public links to the post.

### Creative Ad Video: 30 Seconds

Concept: **The artwork has a memory.** Use screen captures of the real product and original exported art, not fake performance claims.

| Time | Visual | On-screen line |
| --- | --- | --- |
| 0-5s | Still original vault art, quiet pause | "Most art remembers a moment." |
| 5-12s | Actual before/after deposit artwork | "This remembers what you do." |
| 12-20s | Ferrari and Mercedes original F1 art | "And what happens in the world." |
| 20-25s | Report digest, verified contract, receipt | "Real state. Verifiable change." |
| 25-30s | Living Vault name and public URL | "Art that remembers. Built on Monad Testnet." |

Label the F1 team comparison as different team artworks; do not suggest a new public oracle publication occurred. The test token has no monetary value. Use rights-cleared audio and original project artwork. This script is not an uploaded video.

### Submission Evidence Register

Fill only after posting. Record views from the platforms at or before the deadline; do not add views from reposts twice or paid/impression metrics unless organizers accept them.

| Evidence | Public URL | Views at cutoff | Screenshot / timestamp |
| --- | --- | --- | --- |
| Project post | Pending | Unverified | Pending |
| Product demo video | Pending | Unverified | Pending |
| Creative ad video | Pending | Unverified | Pending |
| Other event-window posts | Pending | Unverified | Pending |

## Bonus Criteria

- **Mainnet: three contracts deployed and source-verified.** [F1 art/oracle](https://monadvision.com/address/0x80c1ec7f551198586c301fa4bdcdcb51505c06f3), [SharedLivingArt](https://monadscan.com/address/0x9f97dd0db7b6f073c2874641909a512ffb5f9f4e) and [native MON vault](https://monadvision.com/address/0x9a6003f651a04baef93fffc9e853b1fa2cb48d20), chain143. F1 and native vault verified on both explorers; shared on Monadscan. F1 NFT1 and an [actual 0.01 MON vault mint](https://monadvision.com/tx/0x315346fb8e6c6452ee901dd72c9b70614c2f015a72b472361e3d128c8ba3af63) are confirmed. Original mUSDC vault remains Testnet. Native vault has experimental real custody; no audit claim. Mainnet top-up/redemption and community chapter activation remain unrecorded. A recorded mint is not a transaction performed live during the judged demo.
- **Custom domain: live.** [livingvault.pics](https://livingvault.pics) and [www.livingvault.pics](https://www.livingvault.pics) return HTTP200 with valid HTTPS from Vercel. Public-domain checks passed on2026-10-10. Mention the custom domain during the pitch.
- **Pre-market fit: hypothesis only.** Target independent artists and sports communities; validate with interviews and pilot usage. No invented users, partners or conversion numbers.
- **Revenue: proposed services.** Commissioned living collections and optional hosted publishing tools; no current paid customers, fees or yield. Sports branding and commercial data rights require separate review.
- **Innovation: working evidence.** Two different triggers, on-chain generative SVG, portable vault balance, real source/published comparison and explicit oracle trust. Do not claim world-first or decentralized attestation.

## Final Submission Check

Open the live site and repository in a logged-out browser. Check the current F1 report/API is available, prepare a fresh vault, verify all explorer links, and retain the live demo receipt. Attach actual social/video URLs and deadline analytics. Mention all four eligibility items out loud. Submit before the owner's stated 5:45 PM IST cutoff; do not count this document as a social post or video.
