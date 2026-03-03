import { expect } from "chai";
import { formatEther, parseEther } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { CampaignUser } from "../pages/campaign-user";
import { CreatedCampaign } from "./state-helpers";
import { expectedTokens } from "../config";
import winston from "winston";

// ─────────────────────────────────────────────────────────────────────────────
// assert-helpers.ts
//
// Функції що поєднують дію + перевірку стану до і після.
// Це переосмислення твоїх оригінальних:
//   contributeAndCheck → contributeAndVerify
//   refundAndCheck     → refundAndVerify
//   claimTokensAndCheck → claimTokensAndVerify
//
// Різниця від state-helpers: тут є expect() — ми ПЕРЕВІРЯЄМО.
// Різниця від unit-тестів: перевіряємо кілька речей за раз для integration flow.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// contributeAndVerify
//
// Інвестує і перевіряє:
//   ✓ totalRaised збільшився точно на amountWei
//   ✓ contributions[investor] записано правильно
//   ✓ pendingTokenRewards розраховано правильно (через expectedTokens)
// ─────────────────────────────────────────────────────────────────────────────

export async function contributeAndVerify(
    investor:  CampaignUser,
    amountEth: string,
    c:         CreatedCampaign,
    logger:    winston.Logger,
): Promise<void> {
    const amountWei    = parseEther(amountEth);
    const raisedBefore = await c.campaign.totalRaised();
    const target       = await c.campaign.targetAmount();

    // Розраховуємо очікувані токени ДО транзакції (totalRaised ще не змінився)
    const expectedRewards = expectedTokens(amountWei, raisedBefore, target);

    logger.info(`💰 [${investor.name}] contributing ${amountEth} ETH | raised before: ${formatEther(raisedBefore)} ETH`);

    await investor.invest(amountEth);

    const address      = await investor.getAddress();
    const raisedAfter  = await c.campaign.totalRaised();
    const contribution = await c.campaign.contributions(address);
    const rewards      = await c.campaign.pendingTokenRewards(address);

    expect(raisedAfter,  "totalRaised mismatch").to.equal(raisedBefore + amountWei);
    expect(contribution, "contribution not recorded correctly").to.be.gte(amountWei);
    expect(rewards,      "pendingTokenRewards mismatch").to.be.gte(expectedRewards);

    logger.info(`✅ [${investor.name}] contribution verified | raised now: ${formatEther(raisedAfter)} ETH`);
}

// ─────────────────────────────────────────────────────────────────────────────
// refundAndVerify
//
// Для масиву інвесторів — рефандить і перевіряє:
//   ✓ До: refundClaimed = false
//   ✓ Після: refundClaimed = true
//   ✓ ETH повернувся (баланс збільшився з урахуванням gas)
// ─────────────────────────────────────────────────────────────────────────────

export async function refundAndVerify(
    investors: CampaignUser[],
    c:         CreatedCampaign,
    logger:    winston.Logger,
): Promise<void> {
    for (const investor of investors) {
        const address = await investor.getAddress();

        expect(
            await c.campaign.refundClaimed(address),
            `[${investor.name}] refund already claimed before refund()`
        ).to.equal(false);

        const contribution  = await c.campaign.contributions(address);
        const balanceBefore = await investor.getUserInfo().then(i => i.walletBalance);

        const tx      = await investor.refund();
        const receipt = await tx.wait();
        const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

        const balanceAfter = await investor.getUserInfo().then(i => i.walletBalance);

        expect(
            await c.campaign.refundClaimed(address),
            `[${investor.name}] refundClaimed not set after refund()`
        ).to.equal(true);

        expect(
            balanceAfter,
            `[${investor.name}] ETH balance mismatch after refund`
        ).to.equal(balanceBefore + contribution - gasUsed);

        logger.info(`✅ [${investor.name}] refund verified | returned: ${formatEther(contribution)} ETH`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// claimTokensAndVerify
//
// Для масиву інвесторів — клеймить токени і перевіряє:
//   ✓ До: tokensClaimed = false
//   ✓ Після: tokensClaimed = true
//   ✓ token.balanceOf збільшився на pendingRewards
//   ✓ pendingTokenRewards обнулився
// ─────────────────────────────────────────────────────────────────────────────

export async function claimTokensAndVerify(
    investors: CampaignUser[],
    c:         CreatedCampaign,
    logger:    winston.Logger,
): Promise<void> {
    for (const investor of investors) {
        const address = await investor.getAddress();

        expect(
            await c.campaign.tokensClaimed(address),
            `[${investor.name}] tokens already claimed before claimTokens()`
        ).to.equal(false);

        const pendingBefore  = await c.campaign.pendingTokenRewards(address);
        const tokenBalBefore = await c.token.balanceOf(address);

        await investor.claimTokens();

        expect(
            await c.campaign.tokensClaimed(address),
            `[${investor.name}] tokensClaimed not set after claimTokens()`
        ).to.equal(true);

        expect(
            await c.token.balanceOf(address),
            `[${investor.name}] token balance mismatch`
        ).to.equal(tokenBalBefore + pendingBefore);

        expect(
            await c.campaign.pendingTokenRewards(address),
            `[${investor.name}] pendingRewards not cleared`
        ).to.equal(0n);

        logger.info(`✅ [${investor.name}] tokens claimed | amount: ${formatEther(pendingBefore)}`);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// createInvestorUsers
//
// Фабрична функція: масив signers → масив CampaignUser.
// Детерміновані назви замість faker.person.firstName().
// ─────────────────────────────────────────────────────────────────────────────

export function createInvestorUsers(
    signers:         HardhatEthersSigner[],
    campaignAddress: string,
    logger:          winston.Logger,
    startIndex       = 0,
): CampaignUser[] {
    return signers.map((signer, idx) =>
        new CampaignUser(
            `Investor-${startIndex + idx + 1}`,
            signer,
            campaignAddress,
            false,
            logger,
        )
    );
}