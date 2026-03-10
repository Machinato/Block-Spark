import { BigDecimal, BigInt } from "@graphprotocol/graph-ts"
import { CampaignCreated } from "../generated/CampaignFactory/CampaignFactory"
import { Campaign, Creator } from "../generated/schema"
import { MasterCampaign } from "../generated/templates"

import {
    getOrCreatePlatform,
    getOrCreateCreator,
    toEther,
    STATUS_ACTIVE,
} from "./helpers"

export function handleCampaignCreated(event: CampaignCreated): void {

    const campaign = new Campaign(event.params.campaignAddress)
    campaign.creator = event.params.creator
    campaign.tokenAddress = event.params.tokenAddress
    campaign.ipfsHash = event.params.ipfsHash
    campaign.targetAmount = toEther(event.params.targetAmount)
    campaign.minContribution = toEther(event.params.minContribution)
    campaign.maxContribution = toEther(event.params.maxContribution)
    campaign.endTimestamp = event.params.endTimestamp

    campaign.totalRaised = BigDecimal.fromString("0")
    campaign.investorsCount = BigInt.fromI32(0)
    campaign.status = STATUS_ACTIVE
    campaign.fundsClaimed = false
    campaign.paused = false

    campaign.createdAt = event.block.timestamp
    campaign.createdAtBlock = event.block.number
    campaign.createdAtTxHash = event.transaction.hash

    campaign.save()

    const isNewCreator = Creator.load(event.params.creator) == null

    const creator = getOrCreateCreator(event.params.creator, event.block.timestamp)
    creator.totalCampaigns = creator.totalCampaigns.plus(BigInt.fromI32(1))
    creator.lastCampaignAt = event.block.timestamp
    creator.save()

    const platform = getOrCreatePlatform(event.block.timestamp)
    platform.totalCampaigns = platform.totalCampaigns.plus(BigInt.fromI32(1))
    platform.totalActiveCampaigns = platform.totalActiveCampaigns.plus(BigInt.fromI32(1))

    if (isNewCreator) {
        platform.totalCreators = platform.totalCreators.plus(BigInt.fromI32(1))
    }

    platform.lastUpdatedAt = event.block.timestamp
    platform.save()

    MasterCampaign.create(event.params.campaignAddress)
}
