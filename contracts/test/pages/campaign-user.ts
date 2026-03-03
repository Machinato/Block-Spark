import { Signer, ContractTransactionResponse, parseEther, formatEther } from "ethers";
import { ethers } from "hardhat";
import {  MasterCampaign, MasterCampaign__factory } from "../../typechain-types";
import { boolean } from "hardhat/internal/core/params/argumentTypes";
import winston from 'winston';
import { createLogger } from "../utils/logger";

export class CampaignUser {
    private signer: Signer;
    private contract: MasterCampaign;
    private isCreator: boolean;
    private logger: winston.Logger;
    public name: string;

    constructor(name: string, signer: Signer, campaignAddress: string, isCreator: boolean = false, logger: winston.Logger) {
        this.name = name;
        this.signer = signer;
        // this.contract = await ethers.getContractAt("Campaign", campaignAddress, signer) as CampaignContract;
        this.contract = MasterCampaign__factory.connect(campaignAddress, signer);
        this.isCreator = isCreator;

        this.logger = logger;
    }

    private async logAction(action: string, details: string = "") {
        const addr = await this.getAddress();
        const shortAddr = `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
        const roleIcon = this.isCreator ? "👷‍♂️" : "👤";
        this.logger.info(`${roleIcon} [${this.name} | ${shortAddr}] ${action} ${details}`);
    }

    async invest(amountEth: string): Promise<ContractTransactionResponse> {
        const value = parseEther(amountEth);
        await this.logAction("Investing", `💰 ${amountEth} ETH...`);
        return this.contract.invest({ value });
    }

    async refund(): Promise<ContractTransactionResponse> {
        await this.logAction("Requesting Refund", "💸");
        return this.contract.refund();
    }

    async claimTokens(): Promise<ContractTransactionResponse> {
        await this.logAction("Claiming Tokens", "💰");
        return this.contract.claimTokens();
    }

    async claimFunds(): Promise<ContractTransactionResponse> {
        // if (!this.isCreator) throw new Error("Only creator can claim funds");
        await this.logAction("Claiming Raised Funds", "🏆 -> 🏦");
        return this.contract.claimFunds();
    }

    async pause(): Promise<ContractTransactionResponse> {
        // if (!this.isCreator) throw new Error("Only creator can pause");
        await this.logAction("Pausing Campaign", "⏸️");
        return this.contract.pause();
    }

    async unpause(): Promise<ContractTransactionResponse> {
        // if (!this.isCreator) throw new Error("Only creator can unpause");
        await this.logAction("Unpausing Campaign", "▶️");
        return this.contract.unpause();
    }

    async getAddress(): Promise<string> {
        return this.signer.getAddress();
    }

    async getUserInfo(withLogs: boolean = false): Promise<{
        walletBalance: bigint,
        investedAmount: bigint,
        pendingRewards: bigint,
        hasClaimedRefund: boolean,
        hasClaimedTokens: boolean
    }> {
        const address = await this.getAddress();
        const shortAddr = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

        const [
            walletBalance,
            investedAmount,
            pendingRewards,
            hasClaimedRefund,
            hasClaimedTokens
        ] = await Promise.all([
            ethers.provider.getBalance(address),
            this.contract.contributions(address),
            this.contract.pendingTokenRewards(address),
            this.contract.refundClaimed(address),
            this.contract.tokensClaimed(address)
        ]);

        if (withLogs === true) {
            this.logger.info(`
            🆔 --- [USER INFO: ${this.name}] ---
            --------------------------------------------------
            📍 Address:         ${shortAddr} (${address})
            👛 Wallet Balance:  ${formatEther(walletBalance)} ETH
            💎 Invested:        ${formatEther(investedAmount)} ETH
            🎁 Pending Rewards: ${formatEther(pendingRewards)} Tokens
            ↩️  Refunded?       ${hasClaimedRefund ? "✅ YES" : "❌ NO"}
            🪙  Tokens Claimed? ${hasClaimedTokens ? "✅ YES" : "❌ NO"}
            --------------------------------------------------
        `);
        }

        return {
            walletBalance,
            investedAmount,
            pendingRewards,
            hasClaimedRefund,
            hasClaimedTokens
        };
    }
}