// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {VaultRenderer} from "./VaultRenderer.sol";

contract LivingVault is ERC721Enumerable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Strings for uint256;
    IERC20 public immutable asset;
    uint256 public constant MIN_DEPOSIT = 1e6;
    uint256 public nextTokenId = 1;
    struct Vault { uint128 principal; uint64 mintedAt; uint32 topUpCount; uint32 reserved; }
    mapping(uint256 => Vault) private _vaults;

    error ZeroAmount();
    error BelowMinimumDeposit();
    error NotAuthorized();
    error NonexistentVault();
    error UnexpectedReceivedAmount();
    error InvalidAsset();
    event Minted(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event ToppedUp(uint256 indexed tokenId, uint256 amount, uint256 newPrincipal, uint32 newTopUpCount);
    event Redeemed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event MetadataUpdate(uint256 tokenId);

    constructor(address asset_) ERC721("Living Vault", "LVAULT") {
        if (asset_.code.length == 0) revert InvalidAsset();
        asset = IERC20(asset_);
    }

    function mint(uint256 amount, address recipient) external nonReentrant returns (uint256 tokenId) {
        if (amount == 0) revert ZeroAmount();
        if (amount < MIN_DEPOSIT) revert BelowMinimumDeposit();
        uint128 principal = SafeCast.toUint128(amount);
        _receive(amount);
        tokenId = nextTokenId++;
        _vaults[tokenId] = Vault(principal, SafeCast.toUint64(block.timestamp), 0, 0);
        _safeMint(recipient, tokenId);
        emit Minted(tokenId, recipient, amount);
    }

    function topUp(uint256 tokenId, uint256 amount) external nonReentrant {
        _authorize(tokenId);
        if (amount == 0) revert ZeroAmount();
        Vault storage v = _vaults[tokenId];
        uint128 principal = SafeCast.toUint128(uint256(v.principal) + amount);
        _receive(amount);
        v.principal = principal;
        ++v.topUpCount;
        emit ToppedUp(tokenId, amount, principal, v.topUpCount);
        emit MetadataUpdate(tokenId);
    }

    function redeem(uint256 tokenId) external nonReentrant {
        address owner = _authorize(tokenId);
        uint256 principal = _vaults[tokenId].principal;
        delete _vaults[tokenId];
        _burn(tokenId);
        asset.safeTransfer(owner, principal);
        emit Redeemed(tokenId, owner, principal);
    }

    function _authorize(uint256 tokenId) private view returns (address owner) {
        owner = _ownerOf(tokenId);
        if (owner == address(0)) revert NonexistentVault();
        if (!_isAuthorized(owner, msg.sender, tokenId)) revert NotAuthorized();
    }

    function _receive(uint256 amount) private {
        uint256 beforeBalance = asset.balanceOf(address(this));
        asset.safeTransferFrom(msg.sender, address(this), amount);
        if (asset.balanceOf(address(this)) - beforeBalance != amount) revert UnexpectedReceivedAmount();
    }

    function vaultInfo(uint256 tokenId) public view returns (uint256 principal, uint32 topUpCount, uint256 level, uint64 mintedAt) {
        if (_ownerOf(tokenId) == address(0)) revert NonexistentVault();
        Vault memory v = _vaults[tokenId];
        return (v.principal, v.topUpCount, v.topUpCount > 8 ? 8 : v.topUpCount, v.mintedAt);
    }

    function previewSVG(uint256 tokenId, uint256 principal, uint256 topUpCount) external pure returns (string memory) {
        return VaultRenderer.render(tokenId, principal, topUpCount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        (uint256 principal, uint32 count, uint256 level, uint64 mintedAt) = vaultInfo(tokenId);
        string memory image = string.concat("data:image/svg+xml;base64,", Base64.encode(bytes(VaultRenderer.render(tokenId, principal, count))));
        bytes memory json = abi.encodePacked('{"name":"Living Vault No. ', tokenId.toString(),
            '","description":"A living on-chain artwork holding test-only mUSDC. No real value or yield.","image":"', image,
            '","attributes":[{"trait_type":"Level","value":', level.toString(),
            '},{"trait_type":"Top-ups","value":', uint256(count).toString(),
            '},{"trait_type":"Balance tier","value":', VaultRenderer.tier(principal).toString(),
            '},{"trait_type":"Palette","value":"', VaultRenderer.palette(tokenId),
            '"},{"trait_type":"Minted","display_type":"date","value":', uint256(mintedAt).toString(), '}]}');
        return string.concat("data:application/json;base64,", Base64.encode(json));
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0x49064906 || super.supportsInterface(interfaceId);
    }
}
