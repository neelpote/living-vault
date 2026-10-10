// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 1_000 * 1e6;
    uint256 public constant COOLDOWN = 60;
    mapping(address => uint256) public nextClaimAt;
    error FaucetCooldown(uint256 availableAt);

    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {}
    function decimals() public pure override returns (uint8) { return 6; }

    function faucet() external {
        if (block.timestamp < nextClaimAt[msg.sender]) revert FaucetCooldown(nextClaimAt[msg.sender]);
        nextClaimAt[msg.sender] = block.timestamp + COOLDOWN;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    function mint(address to, uint256 amount) external onlyOwner { _mint(to, amount); }
}
