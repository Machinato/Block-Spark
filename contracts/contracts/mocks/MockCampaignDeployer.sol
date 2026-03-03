// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "../MasterCampaign.sol";

contract MockCampaignDeployer {
    using Clones for address;

    function deployAndInit(
        address masterCampaign,
        address _creator,
        uint256 _targetAmount,
        uint256 _minContribution,
        uint256 _maxContribution,
        uint256 _endTimestamp,
        string memory _ipfsMetadataHash,
        address _token
    ) external returns (address) {
        address clone = masterCampaign.clone();
        
        MasterCampaign(clone).initialize(
            _creator,
            _targetAmount,
            _minContribution,
            _maxContribution,
            _endTimestamp,
            _ipfsMetadataHash,
            _token
        );

        return clone;
    }
}