// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICampaign {
    enum CampaignState { Active, Successful, Failed, Finished }

    function initialize(
        address creator,
        uint256 targetAmount,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 endTimestamp,
        string memory ipfsMetadataHash,
        address token
    ) external;

    function invest() external payable;
    function claimFunds() external;
    function refund() external;
    function claimTokens() external;
    function pause() external;
    function unpause() external;
    function getCampaignStatus() external view returns (CampaignState);
    function calculateTokenAmount(uint256 ethAmount) external view returns (uint256);
}
