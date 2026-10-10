// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
interface INativeVault {
    function mint(address recipient) external payable returns (uint256);
    function topUp(uint256 id) external payable;
    function redeem(uint256 id) external;
    function redeemTo(uint256 id, address payable recipient) external;
}
contract NativeReceiver is IERC721Receiver {
    INativeVault public immutable vault;
    bool public rejectPayment;
    bool public attack;
    bool public reentered;
    uint256 public tokenId;
    constructor(address vault_) { vault = INativeVault(vault_); }
    function configure(bool reject_, bool attack_) external { rejectPayment = reject_; attack = attack_; }
    function create() external payable { tokenId = vault.mint{value: msg.value}(address(this)); }
    function redeem() external { vault.redeem(tokenId); }
    function redirect(address payable recipient) external { vault.redeemTo(tokenId, recipient); }
    function onERC721Received(address, address, uint256 id, bytes calldata) external returns (bytes4) {
        tokenId = id;
        if (attack) { try vault.redeem(id) { reentered = true; } catch {} }
        return IERC721Receiver.onERC721Received.selector;
    }
    receive() external payable {
        require(!rejectPayment, "Reject MON");
        if (attack) { try vault.redeem(tokenId) { reentered = true; } catch {} }
    }
}
