import { Signer } from "ethers";
import { CampaignUser } from "../pages/CampaignUser";
import { faker } from "@faker-js/faker";
import winston from 'winston';
import { expect } from "chai";
import { CampaignHelper } from '../helpers/CampaignHelper';
import { TEST_CONFIG } from '../config';
import { parseEther, formatEther } from 'ethers';
import { time } from "@nomicfoundation/hardhat-network-helpers";

/**
 * 🏗️ HELPER: Create multiple investor instances
 * 
 * @param count - Number of investors to create
 * @param signers - Array of Hardhat signers
 * @param campaignAddress - Campaign contract address
 * @param startIndex - Starting index in signers array (default: 0)
 * @param logger - Winston logger instance
 * @returns Array of CampaignUser instances
 * 
 * Example:
 * const investors = createInvestors(5, signers, campaignAddr, 0, logger);
 */
export function createInvestors(
  count: number,
  signers: Signer[],
  campaignAddress: string,
  startIndex: number = 0,
  logger: winston.Logger
): CampaignUser[] {
  return signers.slice(startIndex, startIndex + count).map((signer, idx) =>
    new CampaignUser(
      `${faker.person.firstName()} #${idx + 1 + startIndex}`,
      signer,
      campaignAddress,
      false,
      logger
    )
  );
}

/**
 * 💰 HELPER: Execute contribution and verify all state changes
 * 
 * @param logger - Winston logger
 * @param investor - CampaignUser instance
 * @param amountEth - Amount in ETH (string format, e.g., "1.5")
 * @param helper - CampaignHelper instance
 * @param expectedStatusBefore - Expected campaign status before contribution
 * 
 * Verifies:
 * - Initial state (totalRaised, campaign status)
 * - Contribution transaction success
 * - Pending rewards calculation
 * - Final state updates (totalRaised, user contribution)
 */
export async function contributeAndCheck(
  logger: winston.Logger,
  investor: CampaignUser,
  amountEth: string,
  helper: CampaignHelper,
  expectedStatusBefore: string = TEST_CONFIG.CAMPAIGN_STATUS.ACTIVE
) {
  const amountWei = parseEther(amountEth);

  logger.info(`Investor ${investor.name} contributes ${amountEth} ETH`);

  const initialRaised = await helper.getTotalRaised();
  expect(initialRaised).to.be.lte(parseEther("100000"));
  logger.info(`Initial raised before: ${formatEther(initialRaised)} ETH`);

  const initialStatus = await helper.getCampaignStatus();
  expect(initialStatus).to.equal(expectedStatusBefore);
  logger.info(`Initial status: ${initialStatus}`);

  const expectedPendingRewards = await helper.calculateTokenAmount(amountWei);
  expect(expectedPendingRewards).to.be.gt(0n);
  await investor.invest(amountEth);
  const invPendingRewards: bigint = (await investor.getUserInfo()).pendingRewards;
  expect(invPendingRewards).to.equal(expectedPendingRewards);

  const finalRaised = await helper.getTotalRaised();
  expect(finalRaised).to.be.gte(initialRaised + amountWei);

  const userContribution = (await investor.getUserInfo(true)).investedAmount;
  expect(userContribution).to.equal(amountWei);

  logger.info(`Contribution successful. Total raised now: ${formatEther(finalRaised)} ETH`);
}

/**
 * 💸 HELPER: Process refunds for multiple investors and verify
 * 
 * @param investors - Array of CampaignUser instances
 * @param helper - CampaignHelper instance
 * @param logger - Winston logger
 * 
 * Verifies for each investor:
 * - Refund not claimed before
 * - Refund transaction success
 * - Refund marked as claimed after
 */
export async function refundAndCheck(investors: CampaignUser[], helper: CampaignHelper, logger: winston.Logger) {
  for (const inv of investors) {
    const invAddress = await inv.getAddress()
    
    const isRefundClaimedBefore: boolean = await helper.isRefundsClaimed(invAddress);
    expect(isRefundClaimedBefore).to.equal(false);
    
    await inv.refund()
    
    const isRefundClaimed: boolean = await helper.isRefundsClaimed(invAddress);
    expect(isRefundClaimed).to.equal(true);
  }
}

/**
 * 🎁 HELPER: Claim tokens for multiple investors and verify
 * 
 * @param investors - Array of CampaignUser instances
 * @param helper - CampaignHelper instance
 * @param logger - Winston logger
 * 
 * Verifies for each investor:
 * - Tokens not claimed before
 * - Token claim transaction success
 * - Claim marked as complete after
 */
export async function claimTokensAndCheck(investors: CampaignUser[],  helper: CampaignHelper, logger: winston.Logger) {
  for (const inv of investors) {
    const invAddress = await inv.getAddress();
    const isRewardsClaimedBefore = await helper.isRewardsClaimed(invAddress);
    expect(isRewardsClaimedBefore).to.equal(false);
    
    await inv.claimTokens();
    
    const isRewardsClaimed = await helper.isRewardsClaimed(invAddress);
    expect(isRewardsClaimed).to.equal(true);    
  }
}

/**
 * 🎯 HELPER: Simulate complete campaign lifecycle to specific outcome
 * 
 * @param logger - Winston logger
 * @param investors - Array of investors to participate
 * @param helper - CampaignHelper instance
 * @param amountEth - Contribution amount per investor (null = use maxContribution)
 * @param expectedOutcome - Expected final status (SUCCESSFUL or FAILED)
 * 
 * Process:
 * 1. All investors contribute specified amount (or max)
 * 2. Fast-forward time past campaign deadline
 * 3. Verify final campaign status matches expected outcome
 * 
 * @returns Object with finalStatus and totalRaised
 */
export async function simulateCampaignOutcome(
  logger: winston.Logger,
  investors: CampaignUser[],
  helper: CampaignHelper,
  amountEth: string | null = null,
  expectedOutcome: string,
) {
  const campaignInfo = await helper.getCampaignInfo();
  const target = campaignInfo.target;
  const maxContrib = campaignInfo.maxContrib;

  const useMaxContrib = amountEth === null;
  const contribAmountEth = useMaxContrib ? formatEther(maxContrib) : amountEth;
  const contribAmountWei = parseEther(contribAmountEth);

  logger.info(`🎯 Simulating campaign outcome: "${expectedOutcome}"`);
  logger.info(`💰 Contribution per investor: ${contribAmountEth} ETH`);
  logger.info(`👥 Number of investors: ${investors.length}`);

  for (const inv of investors) {
    await contributeAndCheck(logger, inv, contribAmountEth, helper);
  }

  if (useMaxContrib) {
    const totalFromInvestors = maxContrib * BigInt(investors.length);
    if (expectedOutcome === TEST_CONFIG.CAMPAIGN_STATUS.SUCCESSFUL && totalFromInvestors < target) {
      logger.warn(`Not enough to add for success: ${formatEther(totalFromInvestors)} < ${formatEther(target)}`);
    }
  }

  const endTs = campaignInfo.endTs;
  await time.increaseTo(endTs + 1n);

  const finalStatus = await helper.getCampaignStatus();
  expect(finalStatus).to.equal(expectedOutcome);
  logger.info(`Final status: ${finalStatus} (expected: ${expectedOutcome})`);

  await helper.getCampaignInfo(true);

  return { finalStatus, totalRaised: await helper.getTotalRaised() };
}



