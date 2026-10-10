// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract HostileToken is ERC20 {
    bool public failPayout;
    bool public fee;
    constructor() ERC20("Hostile", "BAD") { _mint(msg.sender, 1e12); }
    function setFailPayout(bool value) external { failPayout = value; }
    function setFee(bool value) external { fee = value; }
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!failPayout, "payout failed");
        return super.transfer(to, amount);
    }
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        return super.transferFrom(from, to, fee ? amount - 1 : amount);
    }
}
