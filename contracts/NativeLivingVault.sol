// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {VaultRenderer} from "./VaultRenderer.sol";

contract NativeLivingVault is ERC721Enumerable, ReentrancyGuard {
    using Strings for uint256;
    uint256 public constant MIN_DEPOSIT = 0.01 ether;
    uint256 public nextTokenId = 1;
    uint256 public totalPrincipal;
    struct Vault { uint128 principal; uint64 mintedAt; uint32 topUpCount; }
    mapping(uint256 => Vault) private _vaults;

    error ZeroAmount();
    error BelowMinimumDeposit();
    error NotAuthorized();
    error NonexistentVault();
    error InvalidRecipient();
    error PayoutFailed();
    event Minted(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event ToppedUp(uint256 indexed tokenId, uint256 amount, uint256 newPrincipal, uint32 newTopUpCount);
    event Redeemed(uint256 indexed tokenId, address indexed owner, address indexed recipient, uint256 amount);
    event MetadataUpdate(uint256 tokenId);

    constructor() ERC721("Living Vault MON", "LVMON") {}

    function mint(address recipient) external payable nonReentrant returns (uint256 tokenId) {
        if (msg.value < MIN_DEPOSIT) revert BelowMinimumDeposit();
        if (recipient == address(0) || recipient == address(this)) revert InvalidRecipient();
        uint128 principal = SafeCast.toUint128(msg.value);
        tokenId = nextTokenId++;
        _vaults[tokenId] = Vault(principal, SafeCast.toUint64(block.timestamp), 0);
        totalPrincipal += msg.value;
        _safeMint(recipient, tokenId);
        emit Minted(tokenId, recipient, msg.value);
    }

    function topUp(uint256 tokenId) external payable nonReentrant {
        _authorize(tokenId);
        if (msg.value == 0) revert ZeroAmount();
        Vault storage v = _vaults[tokenId];
        v.principal = SafeCast.toUint128(uint256(v.principal) + msg.value);
        ++v.topUpCount;
        totalPrincipal += msg.value;
        emit ToppedUp(tokenId, msg.value, v.principal, v.topUpCount);
        emit MetadataUpdate(tokenId);
    }

    function redeem(uint256 tokenId) external nonReentrant {
        address owner = _authorize(tokenId);
        _redeem(tokenId, owner, payable(owner));
    }

    // Only the owner can redirect a payout, including from a wallet that rejects MON.
    function redeemTo(uint256 tokenId, address payable recipient) external nonReentrant {
        address owner = ownerOf(tokenId);
        if (msg.sender != owner) revert NotAuthorized();
        if (recipient == address(0) || recipient == address(this)) revert InvalidRecipient();
        _redeem(tokenId, owner, recipient);
    }

    function _redeem(uint256 tokenId, address owner, address payable recipient) private {
        uint256 principal = _vaults[tokenId].principal;
        delete _vaults[tokenId];
        totalPrincipal -= principal;
        _burn(tokenId);
        (bool sent,) = recipient.call{value: principal}("");
        if (!sent) revert PayoutFailed();
        emit Redeemed(tokenId, owner, recipient, principal);
    }

    function _authorize(uint256 tokenId) private view returns (address owner) {
        owner = _ownerOf(tokenId);
        if (owner == address(0)) revert NonexistentVault();
        if (!_isAuthorized(owner, msg.sender, tokenId)) revert NotAuthorized();
    }

    function vaultInfo(uint256 tokenId) public view returns (uint256 principal, uint32 topUpCount, uint256 level, uint64 mintedAt) {
        ownerOf(tokenId);
        Vault memory v = _vaults[tokenId];
        return (v.principal, v.topUpCount, v.topUpCount > 8 ? 8 : v.topUpCount, v.mintedAt);
    }

    function previewSVG(uint256 tokenId, uint256 principal, uint256 topUpCount) public pure returns (string memory) {
        return VaultRenderer.render(tokenId, principal / 1e12, topUpCount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        (uint256 principal, uint32 count, uint256 level, uint64 mintedAt) = vaultInfo(tokenId);
        string memory image = string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(previewSVG(tokenId, principal, count))));
        return string.concat("data:application/json;base64,", Base64.encode(abi.encodePacked(
            '{"name":"Living Vault MON No. ', tokenId.toString(),
            '","description":"An on-chain artwork backed by native MON. Deposits evolve the artwork. The current NFT owner can redeem the principal by burning the NFT. No yield. Experimental, not independently audited.","image":"', image,
            '","attributes":[{"trait_type":"Asset","value":"MON"},{"trait_type":"Principal (wei)","value":"', principal.toString(),
            '"},{"trait_type":"Level","value":', level.toString(),
            '},{"trait_type":"Top-ups","value":', uint256(count).toString(),
            '},{"trait_type":"Minted","display_type":"date","value":', uint256(mintedAt).toString(), '}]}'
        )));
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0x49064906 || super.supportsInterface(interfaceId);
    }
}
