// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

//ERC20Permit, ERC20Votes
contract MasterBlockSparkToken is
    ERC20Upgradeable,
    OwnableUpgradeable
{
    error AlreadyInitialized();
    error NotInitialized();

    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory tokenName,
        string memory tokenSymbol,
        address initialOwner
    ) external initializer {
        __ERC20_init(tokenName, tokenSymbol);
        __Ownable_init(initialOwner);
    }

    function mint(address to, uint amount) external onlyOwner {
        _mint(to, amount);
    }
}
