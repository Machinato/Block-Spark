// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Campaign.sol";

contract CampaignFactory {
    address[] public deployedCampaigns;

    error InvalidTargetAmount();
    error InvalidEndTimestamp(uint current, uint provided);
    error InvalidContributionRange(uint min, uint max);

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string ipfsHash,
        uint targetAmount 
    );

    function createCampaign (
        uint _targetAmount,
        uint _minContribution,
        uint _maxContribution,
        uint _endTimestamp,
        string memory _ipfsMetadataHash,
        string memory _tokenName,
        string memory _tokenSymbol
    ) public {
        if (_targetAmount == 0) revert InvalidTargetAmount();
        if (_endTimestamp <= block.timestamp) revert InvalidEndTimestamp(block.timestamp, _endTimestamp);
        if (_maxContribution < _minContribution) revert InvalidContributionRange(_minContribution, _maxContribution);

        address newCampaignAddress = address(new Campaign(
            msg.sender,
            _targetAmount, 
            _minContribution, 
            _maxContribution, 
            _endTimestamp, 
            _ipfsMetadataHash,
            _tokenName,
            _tokenSymbol
        ));
        deployedCampaigns.push(newCampaignAddress);
        emit CampaignCreated(newCampaignAddress, msg.sender, _ipfsMetadataHash, _targetAmount);
    }

    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }
}