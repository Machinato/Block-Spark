// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MasterCampaign.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/ICampaign.sol";
import "./interfaces/IBlockSparkToken.sol";

contract CampaignFactory {
    using Clones for address;

    address public immutable masterCampaign;
    address public immutable masterBlockSparkToken;

    address[] public campaigns;

    mapping(address => bool) public isCampaign;
    mapping(address => address[]) public campaignsByCreator;

    error InvalidTargetAmount();
    error InvalidDeadline(uint currentTimestamp, uint providedTimestamp);
    error InvalidContributionRange(uint min, uint max);
    error InvalidMaxZero();
    error InvalidMinZero();
    error InvalidTargetTooLow();
    error InvalidMasterAddress();

    event CampaignCreated(
        address indexed campaignAddress,
        address indexed tokenAddress,
        address indexed creator,
        uint targetAmount,
        uint minContribution,
        uint maxContribution,
        uint endTimestamp,
        string ipfsHash,
        string tokenName,
        string tokenSymbol
    );

    constructor (address _masterCampaign, address _masterBlockSparkToken) {
        if (_masterCampaign == address(0) || _masterBlockSparkToken == address(0)){
            revert InvalidMasterAddress();
        }
        
        masterCampaign = _masterCampaign;
        masterBlockSparkToken = _masterBlockSparkToken;
    }

    function createCampaign (
        uint _targetAmount,
        uint _minContribution,
        uint _maxContribution,
        uint _endTimestamp,
        string memory _ipfsMetadataHash,
        string memory _tokenName,
        string memory _tokenSymbol
    ) external returns (address campaignClone, address tokenClone ) {
        if (_targetAmount == 0)                     revert InvalidTargetAmount();
        if (_endTimestamp <= block.timestamp)       revert InvalidDeadline(block.timestamp, _endTimestamp);
        if (_maxContribution == 0)                  revert InvalidMaxZero();
        if (_minContribution == 0)                  revert InvalidMinZero();
        if (_maxContribution < _minContribution)    revert InvalidContributionRange(_minContribution, _maxContribution);
        if (_targetAmount < _minContribution)       revert InvalidTargetTooLow();

        tokenClone = masterBlockSparkToken.clone();
        IBlockSparkToken(tokenClone).initialize(_tokenName, _tokenSymbol, address(this));

        campaignClone = masterCampaign.clone();
        ICampaign(campaignClone).initialize(
            msg.sender,
            _targetAmount,
            _minContribution,
            _maxContribution,
            _endTimestamp,
            _ipfsMetadataHash,
            tokenClone
        );

        IBlockSparkToken(tokenClone).transferOwnership(campaignClone);

        isCampaign[campaignClone] = true;
        campaigns.push(campaignClone);
        campaignsByCreator[msg.sender].push(campaignClone);
        
        emit CampaignCreated(
            campaignClone,
            tokenClone,
            msg.sender,
            _targetAmount,
            _minContribution,
            _maxContribution,
            _endTimestamp,
            _ipfsMetadataHash,
            _tokenName, 
            _tokenSymbol
        );
    }

    function getCampaignsCount() external view returns (uint256) {
        return campaigns.length;
    }

    function getCampaignsByCreator(address creator) external view returns (address[] memory) {
        return campaignsByCreator[creator];
    }

    function getAllCampaigns() external view returns (address[] memory) {
        return campaigns;
    }
}