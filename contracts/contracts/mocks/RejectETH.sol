// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import  { ICampaign } from "../interfaces/ICampaign.sol";

interface ICampaignFactory {
    function createCampaign(
        uint256 _targetAmount, uint256 _minContribution, uint256 _maxContribution,
        uint256 _endTimestamp, string memory _ipfsMetadataHash,
        string memory _tokenName, string memory _tokenSymbol
    ) external returns (address campaignClone, address tokenClone);
}

contract RejectETH {
    receive() external payable {
        revert("I reject ETH");
    }

    fallback() external payable {
        revert("I reject ETH");
    }

    function investInCampaign(address _campaign) external payable {
        ICampaign(_campaign).invest{value: msg.value}();
    }

    function claimFundsFromCampaign(address _campaign) external {
        ICampaign(_campaign).claimFunds();
    }

    function refundFromCampaign(address _campaign) external {
        ICampaign(_campaign).refund();
    }

    function createCampaignViaFactory(
        address _factory, uint256 _target, uint256 _min, uint256 _max,
        uint256 _end, string memory _ipfs, string memory _name, string memory _sym
    ) external returns (address campaign) {
        (campaign, ) = ICampaignFactory(_factory).createCampaign(
            _target, _min, _max, _end, _ipfs, _name, _sym
        );
        return campaign;
    }
}
