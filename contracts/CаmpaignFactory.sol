// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Campaign.sol";

contract CampaignFactory {
    mapping(address => bool) public isCampaign;

    error InvalidTargetAmount();
    error InvalidDeadline(uint currentTimestamp, uint providedTimestamp);
    error InvalidContributionRange(uint min, uint max);
    error InvalidMaxZero();
    error InvalidMinZero();
    error InvalidTargetTooLow();

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed creator,
        string ipfsHash,
        uint targetAmount,
        uint endTimestamp,
        string tokenName,
        string tokenSymbol
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
        if (_endTimestamp <= block.timestamp) revert InvalidDeadline(block.timestamp, _endTimestamp);
        if (_maxContribution == 0) revert InvalidMaxZero();
        if (_minContribution == 0) revert InvalidMinZero();
        if (_maxContribution < _minContribution) revert InvalidContributionRange(_minContribution, _maxContribution);
        if (_targetAmount < _minContribution) revert InvalidTargetTooLow();

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
        
        isCampaign[newCampaignAddress] = true;
        
        emit CampaignCreated(newCampaignAddress, msg.sender, _ipfsMetadataHash, _targetAmount, _endTimestamp, _tokenName, _tokenSymbol);
    }
}