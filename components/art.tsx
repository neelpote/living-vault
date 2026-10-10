'use client';
import { useEffect, useState } from 'react';
import { demoArtwork } from '@/lib/demo-art';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
export const unlocks = ['Geometric core', 'First petal ring', 'Counter-rotated ring', 'Fine lattice', 'Accent hue & third ring', 'Orbital constellation', 'Mirrored core & glow', 'Gilded outer ring', 'Completion halo'];
export function ArtFrame({ image, oval = false, className = '', previous, evolving = false, redeemed = false, original = false, alt }: { image: string; oval?: boolean; className?: string; previous?: string; evolving?: boolean; redeemed?: boolean; original?: boolean; alt?: string }) {
  const [rendered, setRendered] = useState<{source: string; image: string}>();
  const [oldRendered, setOldRendered] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    async function render(source: string) {
      const svg = source.startsWith('data:image/svg+xml;base64,') ? atob(source.split(',')[1]) : await fetch(source).then(r => { if (!r.ok) throw new Error('Artwork unavailable'); return r.text(); });
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const id = doc.querySelector('title')?.textContent?.match(/No\. (\d+)/)?.[1];
      const state = doc.querySelector('desc')?.textContent?.match(/Level (\d+)\. (\d+) top-ups\. Balance tier (\d+)/);
      return id && state ? demoArtwork(BigInt(id), 10n ** BigInt(Number(state[3]) + 6), Number(state[2])) : source;
    }
    if (original) return;
    Promise.all([render(image), previous ? render(previous) : Promise.resolve(undefined)]).then(([next, old]) => { if (!cancelled) { setRendered({source: image, image: next}); setOldRendered(old); } }).catch(() => { /* Keep the original when presentation rendering fails. */ });
    return () => { cancelled = true; };
  }, [image, previous, original]);
  const shown = original ? image : rendered?.source === image ? rendered.image : image;
  return <div className={`art-frame ${oval ? 'oval' : ''} ${className} ${evolving ? 'evolving' : ''} ${redeemed ? 'dissolving' : ''}`}><div className="frame-bevel"><div className="art-window">{previous && evolving && <img src={original ? previous : oldRendered ?? previous} alt="Previous state of the artwork" className="art-previous"/>}<img src={shown} alt={alt ?? (original ? 'Original on-chain artwork' : 'Living Vault sculptural bloom demo artwork')} className={evolving ? 'art-new' : ''}/></div></div></div>;
}

export function Exhibition() {
  return <section className="exhibition" aria-label="Living Vault exhibition">
    <div className="exhibition-kicker"><span>EST. 2026 / AN ON-CHAIN EXHIBITION</span><span className="network-dot">Monad Testnet · 10143</span></div>
    <div className="hero-composition museum-composition">
      <div className="side-caption"><span>ART, IN A CONSTANT<br/>STATE OF BECOMING.</span><span>001 — ∞</span></div>
      <h1>LIVING<br/><span>VAULT</span></h1>
      <div className="hero-art"><ArtFrame image="/art/van-gogh-self-portrait.jpg" alt="Self-Portrait, Vincent van Gogh, 1887" oval original/></div>
      <ArtFrame image="/art/monet-water-lilies.jpg" alt="Water Lilies, Claude Monet, 1906" className="corner-art corner-left" original/>
      <ArtFrame image="/art/hokusai-great-wave.jpg" alt="The Great Wave, Katsushika Hokusai, 1830-1833" className="corner-art corner-right" original/>
      <div className="right-caption">HELD ON-CHAIN.<br/>NEVER FINISHED.</div>
    </div>
    <div className="exhibition-bottom">
      <div className="exhibition-note"><span className="eyebrow">A LIVING COLLECTION</span><p>A deposit becomes a brushstroke.<br/>A vault becomes a work of art.</p></div>
      <div className="demo-controls museum-links"><div><span className="eyebrow">THE ORACLE COLLECTION</span><a href="/f1">Explore real F1 artwork<ArrowUpRight size={15}/></a></div><a href="/docs#art-credits" className="museum-credits-link">Art credits<ArrowUpRight size={12}/></a></div>
      <a href="/create" className="exhibition-cta"><span>Create your vault</span><ArrowRight size={32}/></a>
    </div>
  </section>;
}
