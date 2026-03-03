// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IBlockSparkToken {
    function initialize(
        string memory name,
        string memory symbol,
        address initialOwner
    ) external;

    function mint(address to, uint256 amount) external;

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);

    function transferOwnership(address newOwner) external;
}
