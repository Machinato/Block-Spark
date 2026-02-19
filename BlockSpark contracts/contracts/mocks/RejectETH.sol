// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICampaign {
    function invest() external payable;
    function claimFunds() external;
    function refund() external;
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
}
