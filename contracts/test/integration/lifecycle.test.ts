import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { formatEther, parseEther } from "ethers";
import { deployBaseFixture } from "../fixtures/deploy.fixture";
import { createCampaign, makeCampaignSuccessful, makeCampaignFailed, expireCampaign } from "../helpers/state-helpers";
import { contributeAndVerify, refundAndVerify, claimTokensAndVerify, createInvestorUsers } from "../helpers/assert-helpers";
import { CampaignUser } from "../pages/campaign-user";
import { STATE } from "../config";
import { createLogger } from "../utils/logger";
import { CampaignHelper } from "../helpers/campaign-helper";
import { DURATION } from "../config";

// ─────────────────────────────────────────────────────────────────────────────
// Integration | Lifecycle
//
// Тестуємо повні сценарії від початку до кінця.
// Використовуємо assert-helpers (contributeAndVerify і т.д.) для
// детальної перевірки кожного кроку з логуванням.
//
// Тут: тільки happy paths і нормальні flow.
// Атаки і edge cases — в security.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

describe("Integration | Lifecycle", () => {
    const log = createLogger(__filename);

    // ─── Successful campaign ──────────────────────────────────────────────

    describe("successful campaign: full flow", () => {
        it("investors contribute → Successful → all claim tokens → creator claims funds", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            // const campaignHelper: CampaignHelper = new CampaignHelper(c.campaignAddress, )

            // await c.campaign.getCampaignInfo?.(true); // логуємо початковий стан якщо є

            // ── Step 1: кожен інвестор вносить minContribution і ми перевіряємо стан
            log.info("\n📋 Step 1: Contributions");
            const userObjects = createInvestorUsers(
                investors.slice(0, 4),
                c.campaignAddress,
                log,
            );

            for (const user of userObjects) {
                await contributeAndVerify(user, formatEther(c.minContribution), c, log);
            }

            // ── Step 2: доводимо до Successful і перемотуємо час
            log.info("\n📋 Step 2: Fund to success + expire");
            const participants = await makeCampaignSuccessful(c, investors.slice(4));
            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.SUCCESSFUL);
            log.info(`✅ Status: Successful | totalRaised: ${formatEther(await c.campaign.totalRaised())} ETH`);

            // ── Step 3: всі учасники клеймять токени
            log.info("\n📋 Step 3: Claim tokens");
            const allParticipants = [
                ...userObjects,
                ...createInvestorUsers(participants, c.campaignAddress, log, 4),
            ];
            await claimTokensAndVerify(allParticipants, c, log);

            expect(await c.token.totalSupply()).to.be.gt(0n);
            log.info(`✅ Total token supply: ${formatEther(await c.token.totalSupply())}`);

            // ── Step 4: creator клеймить ETH
            log.info("\n📋 Step 4: Creator claims funds");
            const raised = await c.campaign.totalRaised();
            const creatorUser = new CampaignUser("Creator", creator, c.campaignAddress, true, log);

            await expect(creatorUser.claimFunds())
                .to.emit(c.campaign, "FundsClaimed")
                .withArgs(c.campaignAddress, creator.address, raised);

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.FINISHED);
            expect(await ethers.provider.getBalance(c.campaignAddress)).to.equal(0n);
            log.info(`✅ Funds claimed. Status: Finished`);
        });

        it("investors can claim tokens in Finished state (after creator claims funds)", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            const participants = await makeCampaignSuccessful(c, investors);

            // Creator першим клеймить → Finished
            await c.campaign.connect(creator).claimFunds();
            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.FINISHED);

            // Інвестори все одно можуть клеймити токени
            const userObjects = createInvestorUsers(participants, c.campaignAddress, log);
            await claimTokensAndVerify(userObjects, c, log);

            log.info("✅ token claim works in Finished state");
        });

        it("multiple campaigns — each has independent totalRaised and token supply", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c1 = await createCampaign(factory, creator, "MINIMAL", DURATION.ONE_DAY);
            const c2 = await createCampaign(factory, creator, "STANDARD", DURATION.ONE_WEEK);

            // Успішно закриваємо тільки c1
            const p1 = await makeCampaignSuccessful(c1, investors);
            await c1.campaign.connect(investors[0]).claimTokens();

            // c2 залишається Active
            expect(await c2.campaign.totalRaised()).to.equal(0n);
            expect(await c2.token.totalSupply()).to.equal(0n);
            expect(await c2.campaign.getCampaignStatus()).to.equal(STATE.ACTIVE);

            log.info("✅ campaign instances are fully independent");
        });
    });

    // ─── Failed campaign ──────────────────────────────────────────────────

    describe("failed campaign: full refund flow", () => {
        it("campaign fails → all investors get exact ETH refund", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            // Кілька інвесторів вкладають, але не вистачає для успіху
            const participantSigners = investors.slice(0, 3);
            const userObjects = createInvestorUsers(participantSigners, c.campaignAddress, log);

            log.info("\n📋 Step 1: Contributions (will not reach target)");
            for (const user of userObjects) {
                await contributeAndVerify(user, formatEther(c.minContribution), c, log);
            }

            // Перемотуємо час — кампанія стає Failed
            await expireCampaign(c);
            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.FAILED);
            log.info("✅ Status: Failed");

            // Кожен отримує точний refund
            log.info("\n📋 Step 2: Refunds");
            await refundAndVerify(userObjects, c, log);

            // Після всіх refund баланс контракту може бути > 0 якщо не всі рефандили
            log.info("✅ All refunds verified");
        });

        it("zero contributions campaign — correct Failed status after deadline", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expireCampaign(c);

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.FAILED);
            expect(await c.campaign.totalRaised()).to.equal(0n);

            log.info("✅ zero contributions → Failed");
        });
    });

    // ─── Pause / unpause in lifecycle ─────────────────────────────────────

    describe("pause mid-lifecycle", () => {
        it("creator pauses → investors cannot contribute → unpause → can contribute", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            // Перший інвестор вкладає
            await c.campaign.connect(investors[0]).invest({ value: c.minContribution });
            log.info("✅ invest before pause: OK");

            // Пауза
            await c.campaign.connect(creator).pause();
            await expect(
                c.campaign.connect(investors[1]).invest({ value: c.minContribution })
            ).to.be.revertedWithCustomError(c.campaign, "CampaignPaused");
            log.info("✅ invest while paused: reverts");

            // Відновлення
            await c.campaign.connect(creator).unpause();
            await expect(
                c.campaign.connect(investors[1]).invest({ value: c.minContribution })
            ).to.not.be.reverted;
            log.info("✅ invest after unpause: OK");
        });
    });

    // ─── Token calculation in full flow ───────────────────────────────────

    describe("token calculation: bonus → standard transition", () => {
        it("first investors get bonus rate, later investors get standard rate", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            // STANDARD: target=10, bonusLimit=5 ETH

            // Інвестор A — вкладає 3 ETH @ bonus
            await c.campaign.connect(investors[0]).invest({ value: c.maxContribution });
            const rewardsA = await c.campaign.pendingTokenRewards(investors[0].address);
            // 3 ETH * 120 = 360 tokens
            expect(rewardsA).to.equal(c.maxContribution * 120n);

            // Інвестор B — вкладає 3 ETH @ bonus (raised буде 6 ETH, але внесок починається при 3)
            // 2 ETH @ bonus + 1 ETH @ standard (bonusLimit = 5, raised before = 3)
            await c.campaign.connect(investors[1]).invest({ value: c.maxContribution });
            const rewardsB = await c.campaign.pendingTokenRewards(investors[1].address);
            const expectedB = parseEther("2") * 120n + parseEther("1") * 100n; // split
            expect(rewardsB).to.equal(expectedB);

            log.info(`✅ Investor A rewards: ${formatEther(rewardsA)}`);
            log.info(`✅ Investor B rewards: ${formatEther(rewardsB)} (split bonus/standard)`);
        });
    });
});
