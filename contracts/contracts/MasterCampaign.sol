// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./MasterBlockSparkToken.sol";
import "./interfaces/IBlockSparkToken.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MasterCampaign is Initializable {
    uint256 public constant TOKENS_PER_ETH = 100;
    uint256 public constant BONUS_TOKENS_PER_ETH = 120;

    address public creator;
    uint256 public targetAmount;
    uint256 public minContribution;
    uint256 public maxContribution;
    uint256 public endTimestamp;
    string public ipfsMetadataHash;
    mapping(address => uint256) public contributions;
    mapping(address => uint256) public pendingTokenRewards;
    mapping(address => bool) public refundClaimed;
    mapping(address => bool) public tokensClaimed;
    uint256 public totalRaised;
    bool public fundsClaimed;
    IBlockSparkToken public token;
    bool public paused;

    enum CampaignState {
        Active,
        Successful,
        Failed,
        Finished
    }

    error ContributionOutOfRange(uint256 provided, uint256 min, uint256 max);
    error InvalidState(CampaignState required, CampaignState actual);
    error IsNotCreator(address required, address provided);
    error AlreadyClaimed(address caller);
    error AlreadyRefunded(address caller);
    error AlreadyTokensClaimed(address caller);
    error NoContribution(address contributor);
    error NoRewards(address contributor);
    error CampaignPaused();
    error InvalidTargetAmount();
    error InvalidDeadline(uint256 currentTimestamp, uint256 providedTimestamp);
    error InvalidContributionRange(uint256 min, uint256 max);
    error InvalidMaxZero();
    error InvalidMinZero();
    error InvalidTargetTooLow();
    error TransferFailed();
    error InvalidTokenAddress();

    event CampaignInitialized(
        address indexed campaignAddress,
        address indexed creator,
        address indexed tokenAddress,
        uint256 targetAmount,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 endTimestamp,
        string ipfsHash
    );

    event Invested(
        address indexed campaignAddress,
        address indexed contributor,
        uint256 amount,
        uint256 totalRaisedAfter
    );

    event FundsClaimed(
        address indexed campaignAddress,
        address indexed recipient,
        uint256 amount
    );

    event ContributionRefunded(
        address indexed campaignAddress,
        address indexed recipient,
        uint256 amount
    );

    event RewardsClaimed(
        address indexed campaignAddress,
        address indexed recipient,
        uint256 amount
    );
    event BlockSparkTokenCreated(
        address indexed campaignAddress,
        address indexed tokenAddress,
        string name,
        string symbol,
        address indexed ownerAddress
    );
    event CampaignPausedEvent(address indexed campaignAddress);
    event CampaignUnpausedEvent(address indexed campaignAddress);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _creator,
        uint256 _targetAmount,
        uint256 _minContribution,
        uint256 _maxContribution,
        uint256 _endTimestamp,
        string memory _ipfsMetadataHash,
        address _token
    ) external initializer {
        if (_targetAmount == 0) revert InvalidTargetAmount();
        if (_endTimestamp <= block.timestamp)
            revert InvalidDeadline(block.timestamp, _endTimestamp);
        if (_maxContribution == 0) revert InvalidMaxZero();
        if (_minContribution == 0) revert InvalidMinZero();
        if (_maxContribution < _minContribution)
            revert InvalidContributionRange(_minContribution, _maxContribution);
        if (_targetAmount < _minContribution) revert InvalidTargetTooLow();
        if (_token == address(0)) revert InvalidTokenAddress();

        creator = _creator;
        targetAmount = _targetAmount;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
        endTimestamp = _endTimestamp;
        ipfsMetadataHash = _ipfsMetadataHash;
        token = IBlockSparkToken(_token);

        emit CampaignInitialized(
            address(this),
            _creator,
            _token,
            _targetAmount,
            _minContribution,
            _maxContribution,
            _endTimestamp,
            _ipfsMetadataHash
        );
    }

    function invest()
        public
        payable
        inState(CampaignState.Active)
        whenNotPaused
        validContributionAmount(msg.value)
    {
        contributions[msg.sender] += msg.value;
        pendingTokenRewards[msg.sender] += calculateTokenAmount(msg.value);
        totalRaised += msg.value;
        emit Invested(address(this), msg.sender, msg.value, totalRaised);
    }

    function claimFunds() public onlyCreator inState(CampaignState.Successful) {
        fundsClaimed = true;
        uint256 amountToTransfer = address(this).balance;
        (bool success, ) = payable(creator).call{value: amountToTransfer}("");
        if (!success) revert TransferFailed();

        emit FundsClaimed(address(this), creator, amountToTransfer);
    }

    function refund() public inState(CampaignState.Failed) {
        uint256 amountToTransfer = contributions[msg.sender];

        if (amountToTransfer == 0) revert NoContribution(msg.sender);
        if (refundClaimed[msg.sender]) revert AlreadyRefunded(msg.sender);

        refundClaimed[msg.sender] = true;
        pendingTokenRewards[msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amountToTransfer}(
            ""
        );
        if (!success) revert TransferFailed();

        emit ContributionRefunded(address(this), msg.sender, amountToTransfer);
    }

    function claimTokens()
        public
        inStateMultiple(CampaignState.Successful, CampaignState.Finished)
    {
        uint256 amountToMint = pendingTokenRewards[msg.sender];

        if (tokensClaimed[msg.sender] == true)
            revert AlreadyTokensClaimed(msg.sender);
        if (amountToMint == 0) revert NoRewards(msg.sender);

        tokensClaimed[msg.sender] = true;
        pendingTokenRewards[msg.sender] = 0;

        token.mint(msg.sender, amountToMint);

        emit RewardsClaimed(address(this), msg.sender, amountToMint);
    }

    function getCampaignStatus() public view returns (CampaignState) {
        if (fundsClaimed) return CampaignState.Finished;

        if (block.timestamp < endTimestamp) {
            return CampaignState.Active;
        }

        return
            totalRaised >= targetAmount
                ? CampaignState.Successful
                : CampaignState.Failed;
    }

    function calculateTokenAmount(
        uint256 _ethAmount
    ) public view returns (uint256) {
        uint256 currentRaised = totalRaised;
        uint256 bonusLimit = targetAmount / 2;

        if (currentRaised >= bonusLimit) {
            return _ethAmount * TOKENS_PER_ETH;
        } else if ((currentRaised + _ethAmount) <= bonusLimit) {
            return _ethAmount * BONUS_TOKENS_PER_ETH;
        } else {
            uint256 amountAtBonusRate = bonusLimit - currentRaised;
            uint256 amountAtStandardRate = _ethAmount - amountAtBonusRate;

            uint256 tokensFromBonus = amountAtBonusRate * BONUS_TOKENS_PER_ETH;
            uint256 tokensFromStandard = amountAtStandardRate * TOKENS_PER_ETH;

            return tokensFromBonus + tokensFromStandard;
        }
    }

    function pause() external onlyCreator {
        paused = true;
        emit CampaignPausedEvent(address(this));
    }

    function unpause() external onlyCreator {
        paused = false;
        emit CampaignUnpausedEvent(address(this));
    }

    modifier inState(CampaignState _requiredState) {
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
        if (
            _contribution < minContribution || _contribution > maxContribution
        ) {
            revert ContributionOutOfRange(
                _contribution,
                minContribution,
                maxContribution
            );
        }
        _;
    }

    modifier onlyCreator() {
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
