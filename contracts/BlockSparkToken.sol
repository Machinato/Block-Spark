// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract BlockSparkToken is ERC20, Ownable { //ERC20Permit, ERC20Votes
    constructor (
        string memory name,
        string memory symbol,
        address initialOwner
    ) 
        ERC20(name, symbol)
        Ownable(initialOwner)
        //ERC20Permit(name)
    {}

    function mint(address to, uint amount) public onlyOwner {
        _mint(to, amount);
    }

    // function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
    //     super._update(from, to, value);
    // }

    // function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
    //     return super.nonces(owner);
    // }
}