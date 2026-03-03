import { formatEther, Signer } from "ethers";
import { MasterCampaign, MasterCampaign__factory } from "../../typechain-types";
import winston from 'winston';

export enum CampaignState {
    Active = 0,
    Successful = 1,
    Failed = 2,
    Finished = 3,
}

export class CampaignHelper {
    private contract: MasterCampaign;
    private campaignAddress: string;
    private logger: winston.Logger;

    constructor(campaignAddress: string, signer: Signer, logger: winston.Logger) {
        this.contract = MasterCampaign__factory.connect(campaignAddress, signer);
        this.campaignAddress = campaignAddress

        this.logger = logger;
    }

    async getCampaignStatusNumber(): Promise<number> {
        const statusNumber: bigint = await this.contract.getCampaignStatus();
        this.logger.info(`📊 [Status Check] Current State Number: ${statusNumber}`);
        return Number(statusNumber);
    }

    async getCampaignStatus(): Promise<string> {
        const statusNumber: bigint = await this.contract.getCampaignStatus();
        const status: string = CampaignState[Number(statusNumber)] || "Unknown";
        this.logger.info(`📊 [Status Check] Current State: ${status} (${statusNumber})`);
        return status;
    }

    async getTotalRaised(): Promise<bigint> {
        const totalRaised: bigint = await this.contract.totalRaised();
        this.logger.info(`📈 [Metrics] Total Raised: ${formatEther(totalRaised)} ETH`);
        return totalRaised;
    }

    async getContribution(userAddress: string): Promise<bigint> {
        const contribution = await this.contract.contributions(userAddress);
        this.logger.info(`🔍 [Contribution] User ${userAddress.slice(0, 6)}... invested: ${formatEther(contribution)} ETH`);
        return contribution;
    }

    async getPendingRewards(userAddress: string): Promise<bigint> {
        const rewards = await this.contract.pendingTokenRewards(userAddress);
        this.logger.info(`🎁 [Rewards] Pending for ${userAddress.slice(0, 6)}...: ${formatEther(rewards)} tokens`);
        return rewards;
    }

    async getCampaignInfo(withLogs: boolean = false): Promise<{
        creatorAddr: string,
        target: bigint,
        minContrib: bigint,
        maxContrib: bigint,
        endTs: bigint,
        totalRaised: bigint,
        statusNum: bigint,
        paused: boolean,
        fundsClaimed: boolean,
        tokenAddr: string
    }> {
        const [
            creatorAddr,
            target,
            minContrib,
            maxContrib,
            endTs,
            totalRaised,
            statusNum,
            paused,
            fundsClaimed,
            tokenAddr
        ] = await Promise.all([
            this.contract.creator(),
            this.contract.targetAmount(),
            this.contract.minContribution(),
            this.contract.maxContribution(),
            this.contract.endTimestamp(),
            this.contract.totalRaised(),
            this.contract.getCampaignStatus(),
            this.contract.paused(),
            this.contract.fundsClaimed(),
            this.contract.token()
        ]);

        const statusName = ["Active", "Successful", "Failed", "Finished"][Number(statusNum)] || "Unknown";

        const deadlineDate = new Date(Number(endTs) * 1000).toLocaleString("uk-UA", {
            timeZone: "Europe/Kiev",
            dateStyle: "medium",
            timeStyle: "short"
        });

        if (withLogs) { this.logger.info(`
            🌐 --- [CAMPAIGN INFO] ---
            --------------------------------------------------
            📍 Campaign Address: ${this.campaignAddress}
            👷 Creator:          ${creatorAddr}
            🎯 Target Amount:    ${formatEther(target)} ETH
            💰 Total Raised:    ${formatEther(totalRaised)} ETH
            ⬇️ Min Contribution: ${formatEther(minContrib)} ETH
            ⬆️ Max Contribution: ${formatEther(maxContrib)} ETH
            ⏰ Deadline:         ${deadlineDate} (ts: ${endTs})
            📊 Status:           ${statusName} (${statusNum})
            ⚠️ Paused?          ${paused ? "YES ⏸️" : "NO ▶️"}
            🏦 Funds Claimed?   ${fundsClaimed ? "YES ✅" : "NO ❌"}
            💎 Token Address:   ${tokenAddr}
            --------------------------------------------------
        `);
        }

        return {
            creatorAddr,
            target,
            minContrib,
            maxContrib,
            endTs,
            totalRaised,
            statusNum,
            paused,
            fundsClaimed,
            tokenAddr
        }
    }

    async isFundsClaimed(): Promise<boolean> {
        const isFundsClaimed: boolean = await this.contract.fundsClaimed();
        this.logger.info(`🏦 [Funds] Creator claimed funds? ${isFundsClaimed ? "✅ YES" : "❌ NO"}`);
        return isFundsClaimed;
    }

    async isRefundsClaimed(userAddress: string): Promise<boolean> {
        const isClaimed: boolean = await this.contract.refundClaimed(userAddress);
        this.logger.info(`↩️ [Refund] User ${userAddress.slice(0, 6)}... claimed refund? ${isClaimed ? "✅ YES" : "❌ NO"}`);
        return isClaimed;
    }

    async isRewardsClaimed(userAddress: string): Promise<boolean> {
        const isClaimed: boolean = await this.contract.tokensClaimed(userAddress);
        this.logger.info(`🎁 [Tokens] User ${userAddress.slice(0, 6)}... claimed tokens? ${isClaimed ? "✅ YES" : "❌ NO"}`);
        return isClaimed;
    }

    async calculateTokenAmount(ethAmount: bigint): Promise<bigint> {
        const tokens = await this.contract.calculateTokenAmount(ethAmount);
        this.logger.info(`🧮 [Calc] ${formatEther(ethAmount)} ETH = ${formatEther(tokens)} Tokens`);
        return tokens;
    }

    async getTokenAddress(): Promise<string> {
        return await this.contract.token();
    }

    async isPaused(): Promise<boolean> {
        const isPaused = await this.contract.paused()
        this.logger.info(`⚠️ [Pause Check] Is Paused? ${isPaused ? "YES" : "NO"}`);
        return isPaused;
    }
}