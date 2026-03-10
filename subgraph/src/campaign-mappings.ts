import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"

import {
    CampaignInitialized,
    BlockSparkTokenCreated,
    Invested,
    ContributionRefunded,
    RewardsClaimed,
    FundsClaimed,
    CampaignPausedEvent,
    CampaignUnpausedEvent,
} from "../generated/templates/MasterCampaign/MasterCampaign"

import {
    Campaign,
    Token,
    Contribution,
    Participation,
    Investor,
    Creator,
} from "../generated/schema"

import {
    getOrCreatePlatform,
    getOrCreateInvestor,
    getOrCreateParticipation,
    participationId,
    toEther,
    toTokens,
    STATUS_ACTIVE,
    STATUS_SUCCESSFUL,
    STATUS_FAILED,
    STATUS_FINISHED,
} from "./helpers"

function refreshStatus(campaign: Campaign, timestamp: BigInt): void {
    if (campaign.fundsClaimed) {
        campaign.status = STATUS_FINISHED
        return
    }

    if (timestamp < campaign.endTimestamp) {
        campaign.status = STATUS_ACTIVE
        return
    }

    if (campaign.totalRaised >= campaign.targetAmount) {
        campaign.status = STATUS_SUCCESSFUL
    } else {
        campaign.status = STATUS_FAILED
    }
}

export function handleCampaignInitialized(event: CampaignInitialized): void {

    const campaign = Campaign.load(event.params.campaignAddress)

    if (!campaign) return

    campaign.save()
}

export function handleBlockSparkTokenCreated(event: BlockSparkTokenCreated): void {
    const token = new Token(event.params.tokenAddress)
    token.campaign = event.params.campaignAddress
    token.name = event.params.name
    token.symbol = event.params.symbol
    token.totalMinted = BigDecimal.fromString("0")
    token.createdAt = event.block.timestamp
    token.createdAtBlock = event.block.number
    token.save()
}

export function handleInvested(event: Invested): void {
    const campaignAddress = event.params.campaignAddress
    const investorAddress = event.params.contributor
    const amountETH = toEther(event.params.amount)
    const tokenRewardsNew = toTokens(event.params.pendingTokenRewardsAfter)

    const contributionId = event.transaction.hash.concatI32(event.logIndex.toI32())
    const contribution = new Contribution(contributionId)
    contribution.campaign = campaignAddress
    contribution.investor = investorAddress
    contribution.amount = amountETH
    contribution.tokenRewardsAfter = tokenRewardsNew
    contribution.timestamp = event.block.timestamp
    contribution.blockNumber = event.block.number
    contribution.transactionHash = event.transaction.hash

    contribution.participation = participationId(campaignAddress, investorAddress)
    contribution.save()

    const isFirstContribution = Participation.load(
        participationId(campaignAddress, investorAddress)
    ) == null

    const participation = getOrCreateParticipation(
        campaignAddress,
        investorAddress,
        event.block.timestamp
    )
    participation.totalContributed = participation.totalContributed.plus(amountETH)
    participation.tokenRewards = tokenRewardsNew
    participation.contributionCount = participation.contributionCount.plus(BigInt.fromI32(1))
    participation.lastInvestmentAt = event.block.timestamp
    participation.save()

    const isNewInvestor = Investor.load(investorAddress) == null

    const investor = getOrCreateInvestor(investorAddress, event.block.timestamp)
    investor.totalInvested = investor.totalInvested.plus(amountETH)
    investor.totalContributions = investor.totalContributions.plus(BigInt.fromI32(1))
    investor.lastInvestmentAt = event.block.timestamp

    if (isFirstContribution) {
        investor.campaignsCount = investor.campaignsCount.plus(BigInt.fromI32(1))
    }

    investor.save()

    const campaign = Campaign.load(campaignAddress)
    if (!campaign) return

    campaign.totalRaised = toEther(event.params.totalRaisedAfter)

    if (isFirstContribution) {
        campaign.investorsCount = campaign.investorsCount.plus(BigInt.fromI32(1))
    }

    refreshStatus(campaign, event.block.timestamp)
    campaign.save()

    const platform = getOrCreatePlatform(event.block.timestamp)
    platform.totalRaisedETH = platform.totalRaisedETH.plus(amountETH)
    platform.totalContributions = platform.totalContributions.plus(BigInt.fromI32(1))

    if (isNewInvestor) {
        platform.totalInvestors = platform.totalInvestors.plus(BigInt.fromI32(1))
    }

    platform.lastUpdatedAt = event.block.timestamp
    platform.save()
}

export function handleContributionRefunded(event: ContributionRefunded): void {
    const campaignAddress = event.params.campaignAddress
    const investorAddress = event.params.recipient
    const amountETH = toEther(event.params.amount)

    const participation = Participation.load(
        participationId(campaignAddress, investorAddress)
    )
    if (!participation) return

    participation.refunded = true

    participation.save()

    const investor = Investor.load(investorAddress)
    if (!investor) return

    investor.totalRefunded = investor.totalRefunded.plus(amountETH)
    investor.save()

    const campaign = Campaign.load(campaignAddress)
    if (!campaign) return

    const wasNotYetFailed = campaign.status != STATUS_FAILED

    refreshStatus(campaign, event.block.timestamp)
    campaign.save()

    if (wasNotYetFailed && campaign.status == STATUS_FAILED) {
        const creator = Creator.load(campaign.creator)
        if (creator) {
            creator.totalFailed = creator.totalFailed.plus(BigInt.fromI32(1))
            creator.save()
        }

        const platform = getOrCreatePlatform(event.block.timestamp)
        platform.totalFailed = platform.totalFailed.plus(BigInt.fromI32(1))
        platform.totalActiveCampaigns = platform.totalActiveCampaigns > BigInt.fromI32(0)
            ? platform.totalActiveCampaigns.minus(BigInt.fromI32(1))
            : BigInt.fromI32(0)
        platform.totalRefundedETH = platform.totalRefundedETH.plus(amountETH)
        platform.lastUpdatedAt = event.block.timestamp
        platform.save()
    } else {

        const platform = getOrCreatePlatform(event.block.timestamp)
        platform.totalRefundedETH = platform.totalRefundedETH.plus(amountETH)
        platform.lastUpdatedAt = event.block.timestamp
        platform.save()
    }
}

export function handleRewardsClaimed(event: RewardsClaimed): void {
    const campaignAddress = event.params.campaignAddress
    const investorAddress = event.params.recipient
    const tokensAmount = toTokens(event.params.amount)

    const participation = Participation.load(
        participationId(campaignAddress, investorAddress)
    )
    if (!participation) return

    participation.tokensClaimed = true

    participation.save()

    const campaign = Campaign.load(campaignAddress)
    if (!campaign) return

    const token = Token.load(campaign.tokenAddress)
    if (!token) return

    token.totalMinted = token.totalMinted.plus(tokensAmount)
    token.save()

    refreshStatus(campaign, event.block.timestamp)
    campaign.save()
}

export function handleFundsClaimed(event: FundsClaimed): void {
    const campaignAddress = event.params.campaignAddress

    const campaign = Campaign.load(campaignAddress)
    if (!campaign) return

    campaign.fundsClaimed = true
    refreshStatus(campaign, event.block.timestamp)
    campaign.save()

    const creator = Creator.load(campaign.creator)
    if (creator) {
        creator.totalSuccessful = creator.totalSuccessful.plus(BigInt.fromI32(1))
        creator.totalRaisedAcrossCampaigns = creator.totalRaisedAcrossCampaigns
            .plus(toEther(event.params.amount))
        creator.save()
    }

    const platform = getOrCreatePlatform(event.block.timestamp)
    platform.totalSuccessful = platform.totalSuccessful.plus(BigInt.fromI32(1))
    platform.totalFinished = platform.totalFinished.plus(BigInt.fromI32(1))
    platform.totalActiveCampaigns = platform.totalActiveCampaigns > BigInt.fromI32(0)
        ? platform.totalActiveCampaigns.minus(BigInt.fromI32(1))
        : BigInt.fromI32(0)
    platform.lastUpdatedAt = event.block.timestamp
    platform.save()
}

export function handleCampaignPaused(event: CampaignPausedEvent): void {
    const campaign = Campaign.load(event.params.campaignAddress)
    if (!campaign) return

    campaign.paused = true
    campaign.save()
}

export function handleCampaignUnpaused(event: CampaignUnpausedEvent): void {
    const campaign = Campaign.load(event.params.campaignAddress)
    if (!campaign) return

    campaign.paused = false
    campaign.save()
}
