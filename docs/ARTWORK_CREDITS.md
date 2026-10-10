# Landing Exhibition Artwork

These are editorial museum reproductions, not the evolving NFT images. The actual vault renderer, metadata, state and deposits are unchanged.

## Self-Portrait

- Artist: Vincent van Gogh
- Date: 1887
- Local asset: `public/art/van-gogh-self-portrait.jpg`
- Museum record: https://www.artic.edu/artworks/80607/self-portrait
- Image source: https://commons.wikimedia.org/wiki/File:VanGogh_1887_Selbstbildnis.jpg

## Water Lilies

- Artist: Claude Monet
- Date: 1906
- Local asset: `public/art/monet-water-lilies.jpg`
- Museum record: https://www.artic.edu/artworks/16568/water-lilies
- Image source: https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Water_Lilies_-_1933.1157_-_Art_Institute_of_Chicago.jpg

## The Great Wave

- Artist: Katsushika Hokusai
- Date: 1830-1833
- Local asset: `public/art/hokusai-great-wave.jpg`
- Museum record: https://www.artic.edu/artworks/24645
- Image source: https://commons.wikimedia.org/wiki/File:Great_Wave_off_Kanagawa2.jpg

## Provenance

On 2026-10-10, Art Institute API records 80607, 16568 and 24645 each returned `is_public_domain: true`. Wikimedia Commons file pages identify the corresponding public-domain reproductions. Image downloads use the Commons imageinfo API thumbnail URLs and are stored locally to avoid runtime reliance on a museum image server. The direct Art Institute image server returned HTTP 403; its public catalog API remained available. Published credits appear at `/docs#art-credits`.
