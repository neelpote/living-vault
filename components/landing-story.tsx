import Link from 'next/link';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { demoArtwork } from '@/lib/demo-art';

const journey = [
  ['01', 'Give it a beginning.', 'Claim test mUSDC and deposit at least 1 mUSDC. Your wallet receives an NFT with its own vault, balance, and first artwork.'],
  ['02', 'Leave your mark.', 'Add a deposit to your vault. Once the transaction confirms, its balance grows and the artwork takes on a new composition. Every top-up becomes part of its history.'],
  ['03', 'Pass the story on.', 'Transfer the NFT to another wallet. The vault balance and its history travel with it, and the new owner gains the right to redeem.'],
  ['04', 'Close the edition.', 'Redeem when you are ready. The current owner receives the full deposited balance, and the NFT is permanently burned. There are no partial withdrawals.'],
];

export function LandingStory() {
  return <>
    <section className="landing-intro landing-section" aria-labelledby="idea-title">
      <span className="landing-label">01 / THE IDEA</span>
      <div className="landing-intro-grid">
        <h2 id="idea-title">An artwork with<br/>a life <em>of its own.</em></h2>
        <div className="landing-copy"><p>A Living Vault brings an NFT and a deposit vault together. The piece you own holds a balance, remembers its evolution, and changes as you add to it.</p><p>Your actions give it character. A new deposit changes its visual state. A new owner carries its story forward. Everything starts with one small beginning.</p><Link href="/docs" className="landing-link">Explore the platform<ArrowUpRight size={20}/></Link></div>
      </div>
      <div className="landing-facts"><div><strong>One NFT</strong><span>Your artwork and its vault, together.</span></div><div><strong>Every deposit</strong><span>A new chapter in the piece's history.</span></div><div><strong>Real-world results</strong><span>Explore the <Link href="/f1" style={{textDecoration:'underline',color:'var(--green)'}}>F1 oracle collection</Link>, shaped by real championship and race data.</span></div></div>
    </section>
    <section className="landing-evolution landing-section" aria-labelledby="evolution-title">
      <div className="landing-section-heading"><div><span className="landing-label">02 / A WORK IN PROGRESS</span><h2 id="evolution-title">Same seed.<br/><em>Different chapters.</em></h2></div><p>The bloom gathers new layers, shifts its composition, and reveals a richer pattern as the vault evolves. Each piece begins from its own token seed.</p></div>
      <div className="landing-studies">{[0, 3, 8].map((count, index) => <figure key={count}><img src={demoArtwork(1n, 21_000_000n, count)} alt={`Illustrative sculptural bloom after ${count} top-ups`} loading="lazy"/><figcaption><span>STUDY {String(index + 1).padStart(2, '0')}</span><strong>{['The beginning', 'Taking shape', 'In full bloom'][index]}</strong><span>{count} top-ups / illustrative state</span></figcaption></figure>)}</div>
      <div className="landing-study-note"><p>These are illustrative browser art studies. Live vaults use confirmed on-chain state; their original on-chain SVG is also available to view and download.</p><Link href="/f1" className="landing-link">Explore real F1 artwork<ArrowUpRight size={20}/></Link></div>
    </section>
    <section className="landing-journey landing-section" aria-labelledby="journey-title"><div className="landing-section-heading"><div><span className="landing-label">03 / FROM FIRST DEPOSIT TO FINAL EDITION</span><h2 id="journey-title">A piece you can<br/><em>do something with.</em></h2></div><p>Create it. Grow it. Pass it on. Every action has a visible result and a place in the vault's story.</p></div><div className="landing-steps">{journey.map(([number, title, description]) => <article key={number}><span className="landing-step-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></section>
    <section className="landing-principles landing-section" aria-labelledby="ownership-title"><span className="landing-label">04 / WHAT OWNERSHIP MEANS</span><h2 id="ownership-title">The art is yours.<br/><em>So is what it holds.</em></h2><div className="landing-principle-grid"><div><h3>A balance you can follow.</h3><p>Your deposited mUSDC stays in the vault until redemption. The piece's detail page shows its balance, top-ups, and recorded activity.</p></div><div><h3>A record on-chain.</h3><p>The NFT's original artwork and metadata live on-chain. The vault has no admin controls or upgrades. Ownership determines who receives the balance on redemption.</p></div><div><h3>A testnet exhibition.</h3><p>This edition runs on Monad Testnet. mUSDC is a free test token with no real monetary value or yield. Transactions use test MON for network fees.</p></div></div><Link href="/docs#contracts" className="landing-link">Read the full documentation<ArrowUpRight size={20}/></Link></section>
  </>;
}

export function LandingQuestions() {
  return <>
    <section className="landing-questions landing-section" aria-labelledby="questions-title"><div><span className="landing-label">BEFORE YOUR FIRST PIECE</span><h2 id="questions-title">A few things<br/><em>worth knowing.</em></h2><Link href="/docs" className="landing-link">More in the documentation<ArrowUpRight size={20}/></Link></div><div className="landing-faq">
      <details><summary>What do I need to get started?</summary><p>A wallet connected to Monad Testnet and test MON for fees. You can claim 1,000 test mUSDC from the faucet on the create page, then create your first vault with a deposit of at least 1 mUSDC.</p></details>
      <details><summary>What actually makes the artwork evolve?</summary><p>A confirmed top-up increases the vault's deposit count and updates its on-chain artwork. The browser bloom interprets that state as a new visual composition. Simply viewing a piece does not change it.</p></details>
      <details><summary>Can I get my deposit back?</summary><p>Yes. Redeeming returns the full deposited balance to the current NFT owner and permanently burns the NFT. You cannot withdraw a portion of the balance or restore a redeemed piece.</p></details>
      <details><summary>What happens when I transfer my NFT?</summary><p>The NFT's vault balance, artwork state, and history stay with the piece. The receiving wallet becomes its owner and receives the right to redeem that balance.</p></details>
      <details><summary>Are the paintings above part of the collection?</summary><p>The museum paintings are public-domain works used for this exhibition's visual identity. Living Vault NFTs have their own generative artwork. Artist names and image sources are listed in the documentation's art credits.</p></details>
    </div></section>
    <section className="landing-finale"><span className="landing-label">YOUR FIRST CHAPTER</span><h2>Let something<br/><em>beautiful begin.</em></h2><p>One deposit. Your own living piece.</p><Link href="/create" className="button">Create your vault<ArrowRight size={20}/></Link><Link href="/docs" className="landing-finale-docs">Read the guide<ArrowUpRight size={18}/></Link></section>
  </>;
}
