// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./BlockSparkToken.sol";

contract Campaign {
    uint public constant TOKENS_PER_ETH = 100; 
    uint public constant BONUS_TOKENS_PER_ETH = 120;

    address public immutable creator;
    uint public immutable targetAmount;
    uint public immutable minContribution;
    uint public immutable maxContribution;
    uint public immutable endTimestamp;
    string public ipfsMetadataHash;
    mapping (address => uint) public contributions;
    mapping (address => uint) public pendingTokenRewards;
    mapping (address => bool) public refundClaimed;
    mapping (address => bool) public tokensClaimed;
    uint public totalRaised; 
    bool public fundsClaimed;
    BlockSparkToken public token;
    bool public paused;

    enum CampaignState { Active, Successful, Failed, Finished }

    error ContributionOutOfRange(uint provided, uint min, uint max);
    error InvalidState(CampaignState required, CampaignState actual);
    error IsNotCreator(address required, address provided);
    error AlreadyClaimed(address caller);
    error AlreadyRefunded(address caller);
    error AlreadyTokensClaimed(address caller);
    error NoContribution(address contributor);
    error NoRewards(address contributor);
    error CampaignPaused();
    error InvalidDeadline(uint currentTimestamp, uint providedTimestamp);
    error InvalidMaxContribution(uint256 min, uint256 max);
    error InvalidMaxZero();

    event Invested(address indexed contributor, uint amount, uint totalRaised);
    event FundsClaimed(address recipient, uint amount); 
    event ContributionRefunded(address recipient, uint amount);
    event RewardsClaimed(address recipient, uint amount);
    event BlockSparkTokenCreated(address tokenAddress, string name, string symbol);
    event Paused();
    event Unpaused();

    constructor (
        address _creator,
        uint _targetAmount,
        uint _minContribution,
        uint _maxContribution,
        uint _endTimestamp,
        string memory _ipfsMetadataHash,
        string memory _tokenName,
        string memory _tokenSymbol
    ) {
        if (_endTimestamp <= block.timestamp) revert InvalidDeadline(block.timestamp, _endTimestamp);
        if (_maxContribution <= _minContribution) revert InvalidMaxContribution(_minContribution, _maxContribution);
        if (_maxContribution == 0) revert InvalidMaxZero();
    
        creator = _creator;
        targetAmount = _targetAmount;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
        endTimestamp = _endTimestamp;

        ipfsMetadataHash = _ipfsMetadataHash;

        token = new BlockSparkToken(_tokenName, _tokenSymbol, address(this));
        emit BlockSparkTokenCreated(address(token), _tokenName, _tokenSymbol);
    }

    function invest() public payable inState(CampaignState.Active) whenNotPaused() validContributionAmount(msg.value) {
        contributions[msg.sender] += msg.value;
        pendingTokenRewards[msg.sender] += calculateTokenAmount(msg.value);
        totalRaised += msg.value;
        emit Invested(msg.sender, msg.value, totalRaised);
    }

    function claimFunds() public onlyCreator() inState(CampaignState.Successful) {
        if (fundsClaimed) {
            revert AlreadyClaimed(msg.sender);
        }

        fundsClaimed = true;
        uint256 amountToTransfer = address(this).balance;
        (bool success, ) = payable(creator).call{value: amountToTransfer}("");        
        require(success, "Transfer failed");
        
        emit FundsClaimed(creator, amountToTransfer);
    }

    function refund() public inState(CampaignState.Failed) {
        uint amountToTransfer = contributions[msg.sender];

        if (amountToTransfer == 0) revert NoContribution(msg.sender);
        if (refundClaimed[msg.sender]) revert AlreadyRefunded(msg.sender); 

        refundClaimed[msg.sender] = true;
        pendingTokenRewards[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amountToTransfer}("");        
        require(success, "Transfer failed");
        
        emit ContributionRefunded(msg.sender, amountToTransfer);
    }

    function claimTokens() public inStateMultiple(CampaignState.Successful, CampaignState.Finished) {
        uint amountToMint = pendingTokenRewards[msg.sender];

        if (amountToMint == 0){
            revert NoRewards(msg.sender);
        }
        if (tokensClaimed[msg.sender] == true) revert AlreadyTokensClaimed(msg.sender);
        
        tokensClaimed[msg.sender] = true;
        pendingTokenRewards[msg.sender] = 0;

        token.mint(msg.sender, amountToMint);
        
        emit RewardsClaimed(msg.sender, amountToMint);
    }

    function getCampaignStatus() public view returns (CampaignState) {
        if (fundsClaimed) return CampaignState.Finished;
        
        if (block.timestamp < endTimestamp) {
            return CampaignState.Active;
        }

        return totalRaised >= targetAmount ? 
               CampaignState.Successful : 
               CampaignState.Failed;
    }

    function calculateTokenAmount(uint _ethAmount) public view returns (uint) {
        uint currentRaised = totalRaised;
        uint bonusLimit = targetAmount / 2;
        
        if (currentRaised >= bonusLimit){
            return _ethAmount * TOKENS_PER_ETH;
        }
        else if ((currentRaised + _ethAmount) <= bonusLimit) {
            return _ethAmount * BONUS_TOKENS_PER_ETH;
        }
        else {
            uint amountAtBonusRate = bonusLimit - currentRaised;
            uint amountAtStandardRate = _ethAmount - amountAtBonusRate;

            uint tokensFromBonus = amountAtBonusRate * BONUS_TOKENS_PER_ETH;
            uint tokensFromStandard = amountAtStandardRate * TOKENS_PER_ETH;

            return tokensFromBonus + tokensFromStandard;
        }

    }

    function pause() external onlyCreator {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyCreator {
        paused = false;
        emit Unpaused();
    }

    modifier inState(CampaignState _requiredState){
        CampaignState currentState = getCampaignStatus();
        if (currentState != _requiredState) {
            revert InvalidState(_requiredState, currentState);
        }
        _;
    }

    modifier inStateMultiple(CampaignState a, CampaignState b) {
        CampaignState current = getCampaignStatus();
        if (current != a && current != b) {
            revert InvalidState(a, current);
        }
        _;
    }

    modifier validContributionAmount(uint256 _contribution) {
        if (_contribution < minContribution || _contribution > maxContribution) {
            revert ContributionOutOfRange(_contribution, minContribution, maxContribution);
        }
        _;
    }

    modifier onlyCreator(){
        if (msg.sender != creator) {
            revert IsNotCreator(creator, msg.sender);
        }
        _;
    }

    modifier whenNotPaused() {
        if (paused) {
            revert CampaignPaused();
        }
        _;
    }
}