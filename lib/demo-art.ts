// Presentation renderer only. Immutable NFT metadata remains the original SVG.
export function demoArtwork(tokenId: bigint, principal: bigint, count: number): string {
  const level = Math.min(Math.max(count, 0), 8);
  const seed = Number(tokenId % 997n);
  const tier = Math.min(7, Math.max(0, principal.toString().length - 7));
  const palettes = [
    ['#fc896a', '#bd2944', '#fff0d3', '#61cab5', '#166d77'],
    ['#80dac7', '#146d78', '#ffeac9', '#fa997d', '#bd3552'],
    ['#abbdf5', '#37479c', '#fff0cc', '#f8996f', '#ce4857'],
  ];
  const colors = palettes[seed % palettes.length];
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><title>Living Vault ${tokenId} - sculptural bloom, evolution ${count}</title><defs>`;
  for (let i = 0; i < 5; i++) svg += `<linearGradient id="p${i}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[i]}"/><stop offset=".48" stop-color="${colors[(i + 2) % 5]}"/><stop offset="1" stop-color="${colors[(i + 1) % 5]}"/></linearGradient>`;
  svg += `<radialGradient id="paper"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="#e5e8df"/></radialGradient><filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#133d39" flood-opacity=".2"/></filter></defs><rect width="600" height="600" fill="url(#paper)"/>`;
  // Closely spaced engraving lines give the field texture without external assets.
  for (let y = 16; y < 600; y += 6) svg += `<path d="M0 ${y}H600" stroke="#173f42" stroke-opacity=".025"/>`;
  svg += `<g transform="translate(300 300) rotate(${seed * 13 + count * 11})">`;
  const layers = 3 + Math.floor(level / 2);
  for (let layer = 0; layer < layers; layer++) {
    const radius = 227 - layer * 26 + tier * 1.4;
    const petals = 9 + layer * 2 + (seed % 3);
    const width = 43 + level * 1.9 - layer * 2;
    svg += `<g filter="url(#shadow)">`;
    for (let p = 0; p < petals; p++) {
      const angle = p * 360 / petals + layer * 17 + Math.sin(count + layer) * 9;
      const color = (layer + Math.floor(p / 3) + seed) % 5;
      const tip = radius + Math.sin(p * 1.7 + count) * 12;
      svg += `<g transform="rotate(${angle.toFixed(2)})"><path d="M-7 20 C${-width * 1.9} ${-tip * .24} ${-width} ${-tip * .88} 0 ${-tip} C${width * 1.8} ${-tip * .82} ${width} ${-tip * .21} 7 20Z" fill="url(#p${color})" stroke="#fff5df" stroke-opacity=".55" stroke-width=".8"/>`;
      for (let vein = 0; vein < 5; vein++) svg += `<path d="M0 4 Q${(vein - 2) * 13} ${-tip * .45} 0 ${-tip + 12}" fill="none" stroke="${vein % 2 ? '#ffffff' : colors[(color + 1) % 5]}" stroke-opacity=".22" stroke-width=".7"/>`;
      svg += '</g>';
    }
    svg += '</g>';
  }
  for (let i = 0; i < 34 + level * 4; i++) {
    const angle = i * 2.39996;
    const radius = Math.sqrt(i + 1) * 6;
    svg += `<ellipse cx="${(Math.cos(angle) * radius).toFixed(2)}" cy="${(Math.sin(angle) * radius).toFixed(2)}" rx="5.5" ry="9" transform="rotate(${i * 137.5} ${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)})" fill="${colors[i % 5]}" stroke="#fff7db" stroke-width=".8"/>`;
  }
  svg += '</g></svg>';
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
