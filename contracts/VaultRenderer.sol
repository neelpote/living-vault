// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

library VaultRenderer {
    using Strings for uint256;

    function tier(uint256 principal) internal pure returns (uint256 result) {
        uint256 whole = principal / 1e6;
        while (whole >= 10 && result < 7) { whole /= 10; ++result; }
    }

    function palette(uint256 tokenId) internal pure returns (string memory) {
        uint256 family = uint256(keccak256(abi.encode(tokenId))) % 4;
        return family == 0 ? "Vermilion" : family == 1 ? "Gilt" : family == 2 ? "Verdigris" : "Ultramarine";
    }

    function render(uint256 tokenId, uint256 principal, uint256 count) internal pure returns (string memory) {
        uint256 seed = uint256(keccak256(abi.encode(tokenId)));
        uint256 family = seed % 4;
        uint256 base = family == 0 ? 12 : family == 1 ? 38 : family == 2 ? 165 : 225;
        uint256 level = count > 8 ? 8 : count;
        uint256 hue = addmod(base, mulmod(count, 14, 360), 360);
        uint256 angle = addmod(seed % 360, mulmod(count, 7, 360), 360);
        uint256 t = tier(principal);
        string memory primary = string.concat("hsl(", hue.toString(), ",72%,67%)");
        string memory accent = string.concat("hsl(", ((hue + 52) % 360).toString(), ",80%,78%)");
        string memory s = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><title>Living Vault No. ', tokenId.toString(),
            '</title><desc>Deterministic on-chain art. Level ', level.toString(), '. ', count.toString(),
            ' top-ups. Balance tier ', t.toString(), '.</desc><rect width="400" height="400" fill="#2b0709"/>',
            '<defs><radialGradient id="ground"><stop stop-color="#581c24"/><stop offset="1" stop-color="#210608"/></radialGradient>',
            '<radialGradient id="glow"><stop stop-color="', primary, '" stop-opacity=".22"/><stop offset="1" stop-color="', primary,
            '" stop-opacity="0"/></radialGradient></defs><rect width="400" height="400" fill="url(#ground)"/>',
            '<g fill="none" stroke="#b8864b" stroke-opacity=".3"><rect x="15" y="15" width="370" height="370"/>',
            '<path d="M25 40V25H40M360 25H375V40M375 360V375H360M40 375H25V360"/>',
            '<circle cx="200" cy="190" r="', (60 + t * 5).toString(), '" stroke-width=".5"/></g>'
        );
        if (level >= 6) s = string.concat(s, '<circle cx="200" cy="190" r="156" fill="url(#glow)"/>');
        s = string.concat(s, '<g transform="translate(200 190) rotate(', angle.toString(), ')" stroke="', primary, '" fill="none">');
        uint256 rings = level == 0 ? 0 : level < 4 ? level : level < 7 ? 4 : 5;
        for (uint256 ring; ring < rings; ++ring) {
            uint256 radius = 32 + ring * 23 + t * 2;
            uint256 petals = 8 + (t > 3 ? 4 : t);
            string memory color = level >= 4 && ring % 2 == 1 ? accent : primary;
            s = string.concat(s, '<g stroke="', color, '" stroke-width="', ring == 0 ? '1.4' : '.8', '" transform="rotate(', addmod(ring * 19, mulmod(count, 3, 360), 360).toString(), ')">');
            for (uint256 p; p < petals; ++p) {
                s = string.concat(s, '<ellipse cx="0" cy="-', radius.toString(), '" rx="', (12 + t).toString(), '" ry="', (25 + ring * 3).toString(),
                    '" transform="rotate(', (p * 360 / petals).toString(), ')"/>');
            }
            s = string.concat(s, '</g>');
        }
        if (level >= 3) {
            s = string.concat(s, '<g stroke-opacity=".5" stroke-width=".5">');
            for (uint256 i; i < 12; ++i) s = string.concat(s, '<path d="M0 -110L55 75L-55 75Z" transform="rotate(', (i * 30).toString(), ')"/>');
            s = string.concat(s, '</g>');
        }
        if (level >= 5) {
            s = string.concat(s, '<circle r="138" stroke-width=".5"/><g fill="', accent, '" stroke="none">');
            for (uint256 i; i < 12; ++i) s = string.concat(s, '<circle cy="-138" r="2.5" transform="rotate(', (i * 30).toString(), ')"/>');
            s = string.concat(s, '</g>');
        }
        if (level >= 7) s = string.concat(s, '<circle r="158" stroke="#e3b778" stroke-width="1.5"/><circle r="162" stroke="#b8864b" stroke-width=".5"/>');
        if (level >= 8) s = string.concat(s, '<circle r="171" stroke="', accent, '" stroke-width="1" stroke-dasharray="1 5"/>');
        s = string.concat(s, '<g transform="rotate(', (level >= 6 ? (360 - angle) % 360 : 45).toString(), ')" fill="', accent,
            '" fill-opacity=".12" stroke-width="1.2"><rect x="-', (14 + t * 3).toString(), '" y="-', (14 + t * 3).toString(),
            '" width="', (28 + t * 6).toString(), '" height="', (28 + t * 6).toString(), '"/><circle r="', (10 + t * 2).toString(),
            '"/><path d="M0 -24L24 0L0 24L-24 0Z"/></g><circle r="3" fill="#e3b778" stroke="none"/></g>');
        s = string.concat(s, '<g fill="#e3b778" text-anchor="middle"><text x="200" y="355" font-family="Georgia,serif" font-size="11">No. ',
            tokenId.toString(), ' / Level ', level.toString(), ' / ', count.toString(),
            ' top-ups</text><text x="200" y="370" font-family="monospace" font-size="6" opacity=".65">LIVING VAULT / ', palette(tokenId),
            '</text></g>', level >= 8 ? '<path d="M335 345l8 -8l8 8l-8 8Z" fill="none" stroke="#e3b778"/>' : '', '</svg>');
        return s;
    }
}
