import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Platform, Creator, Investor, Participation } from "../generated/schema"

export const PLATFORM_ID = Bytes.fromI32(1)

export const WEI = BigInt.fromString("1000000000000000000")

export const STATUS_ACTIVE = "Active"
export const STATUS_SUCCESSFUL = "Successful"
export const STATUS_FAILED = "Failed"
export const STATUS_FINISHED = "Finished"

export function toEther(wei: BigInt): BigDecimal {
    return wei.toBigDecimal().div(WEI.toBigDecimal())
}

export function toTokens(amount: BigInt): BigDecimal {
    return amount.toBigDecimal().div(WEI.toBigDecimal())
}

export function getOrCreatePlatform(timestamp: BigInt): Platform {
    let platform = Platform.load(PLATFORM_ID)

    if (!platform) {
        platform = new Platform(PLATFORM_ID)
        platform.totalCampaigns = BigInt.fromI32(0)
        platform.totalActiveCampaigns = BigInt.fromI32(0)
        platform.totalSuccessful = BigInt.fromI32(0)
        platform.totalFailed = BigInt.fromI32(0)
        platform.totalFinished = BigInt.fromI32(0)
        platform.totalRaisedETH = BigDecimal.fromString("0")
        platform.totalRefundedETH = BigDecimal.fromString("0")
        platform.totalInvestors = BigInt.fromI32(0)
        platform.totalCreators = BigInt.fromI32(0)
        platform.totalContributions = BigInt.fromI32(0)
        platform.lastUpdatedAt = timestamp
    }

    return platform
}

export function getOrCreateCreator(address: Bytes, timestamp: BigInt): Creator {
    let creator = Creator.load(address)

    if (!creator) {
        creator = new Creator(address)
        creator.totalCampaigns = BigInt.fromI32(0)
        creator.totalSuccessful = BigInt.fromI32(0)
        creator.totalFailed = BigInt.fromI32(0)
        creator.totalRaisedAcrossCampaigns = BigDecimal.fromString("0")
        creator.firstCampaignAt = timestamp
        creator.lastCampaignAt = timestamp
    }

    return creator
}

export function getOrCreateInvestor(address: Bytes, timestamp: BigInt): Investor {
    let investor = Investor.load(address)

    if (!investor) {
        investor = new Investor(address)
        investor.totalInvested = BigDecimal.fromString("0")
        investor.totalRefunded = BigDecimal.fromString("0")
        investor.campaignsCount = BigInt.fromI32(0)
        investor.totalContributions = BigInt.fromI32(0)
        investor.firstInvestmentAt = timestamp
        investor.lastInvestmentAt = timestamp
    }

    return investor
}

export function participationId(campaignAddress: Bytes, investorAddress: Bytes): Bytes {
    return campaignAddress.concat(investorAddress)
}

export function getOrCreateParticipation(
    campaignAddress: Bytes,
    investorAddress: Bytes,
    timestamp: BigInt
): Participation {
    const id = participationId(campaignAddress, investorAddress)
    let participation = Participation.load(id)

    if (!participation) {
        participation = new Participation(id)
        participation.campaign = campaignAddress
        participation.investor = investorAddress
        participation.totalContributed = BigDecimal.fromString("0")
        participation.tokenRewards = BigDecimal.fromString("0")
        participation.refunded = false
        participation.tokensClaimed = false
        participation.contributionCount = BigInt.fromI32(0)
        participation.firstInvestmentAt = timestamp
        participation.lastInvestmentAt = timestamp
    }

    return participation
}
