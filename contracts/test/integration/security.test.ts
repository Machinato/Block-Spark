import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { deployBaseFixture } from "../fixtures/deploy.fixture";
import { createCampaign, expireCampaign, makeCampaignSuccessful, makeCampaignFailed, CreatedCampaign } from "../helpers/state-helpers";
import { DURATION, STATE, PRESETS, futureTimestamp } from "../config";
import { createLogger } from "../utils/logger";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// ─────────────────────────────────────────────────────────────────────────────
// Integration | Security
//
// Тестуємо:
//   1. EIP-1167 clone isolation — storage не змішується між клонами
//   2. Double-spend — double refund, double claimTokens
//   3. Reentrancy via RejectETH
//   4. Access control — хто може mint, хто не може
//   5. Master contracts locked після створення клонів
// ─────────────────────────────────────────────────────────────────────────────

describe("Integration | Security", () => {
    const log = createLogger(__filename);

    // ─── EIP-1167: Clone isolation ────────────────────────────────────────

    describe("EIP-1167: clone storage isolation", () => {
        it("investing in campaign A does not affect campaign B totalRaised or contributions", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const cA = await createCampaign(factory, creator, "STANDARD");
            const cB = await createCampaign(factory, creator, "MINIMAL");

            await cA.campaign.connect(investors[0]).invest({ value: cA.minContribution });

            // Campaign B — незачеплена
            expect(await cB.campaign.totalRaised()).to.equal(0n);
            expect(await cB.campaign.contributions(investors[0].address)).to.equal(0n);
            expect(await cB.campaign.getCampaignStatus()).to.equal(STATE.ACTIVE);

            log.info("✅ campaign A investment isolated from campaign B");
        });

        it("token mint in campaign A does not affect campaign B token supply", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const cA = await createCampaign(factory, creator, "STANDARD");
            const cB = await createCampaign(factory, creator, "MINIMAL");

            await makeCampaignSuccessful(cA, investors);
            await cA.campaign.connect(investors[0]).claimTokens();

            expect(await cA.token.totalSupply()).to.be.gt(0n);
            expect(await cB.token.totalSupply()).to.equal(0n);

            log.info("✅ token A supply isolated from token B");
        });

        it("pausing campaign A does not affect campaign B", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const cA = await createCampaign(factory, creator, "STANDARD");
            const cB = await createCampaign(factory, creator, "MINIMAL");

            await cA.campaign.connect(creator).pause();

            expect(await cA.campaign.paused()).to.equal(true);
            expect(await cB.campaign.paused()).to.equal(false);

            // Інвестувати в cB все ще можна
            await expect(
                cB.campaign.connect(investors[0]).invest({ value: cB.minContribution })
            ).to.not.be.reverted;

            log.info("✅ pause isolated between campaigns");
        });

        it("fundsClaimed in campaign A does not affect campaign B", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const cA = await createCampaign(factory, creator, "STANDARD");
            const cB = await createCampaign(factory, creator, "STANDARD");

            await makeCampaignSuccessful(cA, investors);
            await cA.campaign.connect(creator).claimFunds();

            expect(await cA.campaign.fundsClaimed()).to.equal(true);
            expect(await cB.campaign.fundsClaimed()).to.equal(false);

            log.info("✅ fundsClaimed isolated between campaigns");
        });
    });

    // ─── Master contracts: locked ─────────────────────────────────────────

    describe("master contracts: remain locked after clone creation", () => {
        it("masterBlockSparkToken.initialize() reverts after clones created", async () => {
            const { factory, creator, masterBlockSparkToken } = await loadFixture(deployBaseFixture);
            await createCampaign(factory, creator, "STANDARD");

            await expect(masterBlockSparkToken.initialize("Hack", "HCK", creator.address))
                .to.be.revertedWithCustomError(masterBlockSparkToken, "InvalidInitialization");

            log.info("✅ masterBlockSparkToken remains locked");
        });

        it("masterCampaign.initialize() reverts after clones created", async () => {
            const { factory, creator, masterCampaign, masterBlockSparkToken } = await loadFixture(deployBaseFixture);
            await createCampaign(factory, creator, "STANDARD");

            await expect(masterCampaign.initialize(
                creator.address, parseEther("10"), parseEther("0.5"),
                parseEther("3"), BigInt(Math.floor(Date.now() / 1000) + 3600),
                "Qm", await masterBlockSparkToken.getAddress(),
            )).to.be.revertedWithCustomError(masterCampaign, "InvalidInitialization");

            log.info("✅ masterCampaign remains locked");
        });
    });

    // ─── Double-spend ─────────────────────────────────────────────────────

    describe("double-spend protection", () => {
        it("should prevent double refund — AlreadyRefunded", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignFailed(c, investors[0]);

            await c.campaign.connect(investors[0]).refund();

            await expect(c.campaign.connect(investors[0]).refund())
                .to.be.revertedWithCustomError(c.campaign, "AlreadyRefunded")
                .withArgs(investors[0].address);

            log.info("✅ double refund blocked");
        });

        it("should prevent double claimTokens — AlreadyTokensClaimed", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);

            await c.campaign.connect(investors[0]).claimTokens();

            await expect(c.campaign.connect(investors[0]).claimTokens())
                .to.be.revertedWithCustomError(c.campaign, "AlreadyTokensClaimed")
                .withArgs(investors[0].address);

            log.info("✅ double claimTokens blocked");
        });

        it("should prevent double claimFunds — InvalidState(Successful, Finished)", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);

            await c.campaign.connect(creator).claimFunds();

            await expect(c.campaign.connect(creator).claimFunds())
                .to.be.revertedWithCustomError(c.campaign, "InvalidState")
                .withArgs(STATE.SUCCESSFUL, STATE.FINISHED);

            log.info("✅ double claimFunds blocked");
        });
    });

    // ─── Reentrancy via RejectETH ─────────────────────────────────────────

    describe("reentrancy: ETH transfer failure", () => {
        it("refund to contract that rejects ETH → TransferFailed", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            const RejectETH = await ethers.getContractFactory("RejectETH");
            const rejector = await RejectETH.deploy() as any;
            await rejector.waitForDeployment();

            // Контракт інвестує в кампанію
            await rejector.investInCampaign(c.campaignAddress, { value: c.minContribution });
            expect(await c.campaign.contributions(await rejector.getAddress()))
                .to.equal(c.minContribution);

            await expireCampaign(c);

            // Refund не може відправити ETH контракту — TransferFailed
            await expect(rejector.refundFromCampaign(c.campaignAddress))
                .to.be.revertedWithCustomError(c.campaign, "TransferFailed");

            log.info("✅ refund → RejectETH → TransferFailed");
        });

        it("claimFunds to contract that rejects ETH → TransferFailed", async () => {
            // Для цього тесту нам потрібен creator що є контрактом без receive().
            // Використовуємо MockCreator що може викликати factory.createCampaign
            // але не має receive() — тому claimFunds до нього failне.
            const { factory, investors } = await loadFixture(deployBaseFixture);

            const RejectETH = await ethers.getContractFactory("RejectETH");
            const rejectETH = await RejectETH.deploy();
            await rejectETH.waitForDeployment();
            const rejectorAddr = await rejectETH.getAddress();

            const p = PRESETS["STANDARD"];
            const endTimestamp = await futureTimestamp(DURATION.ONE_HOUR);

            await rejectETH.createCampaignViaFactory(
                await factory.getAddress(),
                p.targetAmount, p.minContribution, p.maxContribution,
                endTimestamp, p.ipfsHash, p.tokenName, p.tokenSymbol
            );

            const campaigns = await factory.getCampaignsByCreator(await rejectETH.getAddress());
            const campaignAddr = campaigns[0];
            const campaign = await ethers.getContractAt("MasterCampaign", campaignAddr);

            const tokenAddr = await campaign.token();
            const token = await ethers.getContractAt("MasterBlockSparkToken", tokenAddr);

            const c: CreatedCampaign = {
                campaign: campaign as any,
                token: token as any,
                campaignAddress: campaignAddr,
                tokenAddress: tokenAddr,
                targetAmount: p.targetAmount,
                minContribution: p.minContribution,
                maxContribution: p.maxContribution,
                endTimestamp: endTimestamp
                // (додай сюди інші поля, якщо твій хелпер їх вимагає)
            };

            await makeCampaignSuccessful(c, investors);

            await expect(
                rejectETH.claimFundsFromCampaign(campaignAddr)
            ).to.be.revertedWithCustomError(campaign, "TransferFailed");


            log.info("✅ claimFunds → RejectETH → TransferFailed");
        });
    });

    // ─── Token access control ─────────────────────────────────────────────

    describe("token: access control", () => {
        it("only campaign can mint — creator, investor, factory cannot", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            // Creator не може
            await expect(c.token.connect(creator).mint(creator.address, parseEther("1")))
                .to.be.revertedWithCustomError(c.token, "OwnableUnauthorizedAccount");

            // Investor не може
            await expect(c.token.connect(investors[0]).mint(investors[0].address, parseEther("1")))
                .to.be.revertedWithCustomError(c.token, "OwnableUnauthorizedAccount");

            // Factory (після передачі ownership) не може
            const factoryAddress = await factory.getAddress();
            await ethers.provider.send("hardhat_impersonateAccount", [factoryAddress]);
            await ethers.provider.send("hardhat_setBalance", [
                factoryAddress, "0x" + parseEther("1").toString(16),
            ]);
            const factorySigner = await ethers.getSigner(factoryAddress);

            await expect(c.token.connect(factorySigner).mint(creator.address, parseEther("1")))
                .to.be.revertedWithCustomError(c.token, "OwnableUnauthorizedAccount");

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [factoryAddress]);
            log.info("✅ only campaign can mint");
        });

        it("token owner is campaign address — verified after factory deploy", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const { token, campaignAddress } = await createCampaign(factory, creator, "STANDARD");

            expect(await token.owner()).to.equal(campaignAddress);
            log.info(`✅ token owner = campaign: ${campaignAddress.slice(0, 10)}...`);
        });

        it("each token clone has independent owner (its own campaign)", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c1 = await createCampaign(factory, creator, "STANDARD");
            const c2 = await createCampaign(factory, creator, "MINIMAL");

            expect(await c1.token.owner()).to.equal(c1.campaignAddress);
            expect(await c2.token.owner()).to.equal(c2.campaignAddress);
            expect(await c1.token.owner()).to.not.equal(await c2.token.owner());

            log.info("✅ each token has independent owner");
        });
    });

    // ─── Cross-campaign action prevention ─────────────────────────────────

    describe("cross-campaign: cannot interact with wrong campaign", () => {
        it("investor of campaign A cannot refund from campaign B", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const cA = await createCampaign(factory, creator, "STANDARD");
            const cB = await createCampaign(factory, creator, "STANDARD");

            // Інвестор вкладає тільки в cA
            await cA.campaign.connect(investors[0]).invest({ value: cA.minContribution });
            await expireCampaign(cA);
            await expireCampaign(cB);

            // В cB у інвестора немає внеску
            await expect(cB.campaign.connect(investors[0]).refund())
                .to.be.revertedWithCustomError(cB.campaign, "NoContribution")
                .withArgs(investors[0].address);

            log.info("✅ cannot refund from campaign where not invested");
        });

        it("investor of campaign A cannot claimTokens from campaign B", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const cA = await createCampaign(factory, creator, "STANDARD", DURATION.ONE_HOUR);
            const cB = await createCampaign(factory, creator, "STANDARD", DURATION.ONE_DAY);

            await makeCampaignSuccessful(cA, investors);
            await makeCampaignSuccessful(cB, investors); // окремий набір інвестицій

            // investors[0] вкладав в обидві, але перевіряємо ізоляцію rewards
            await cA.campaign.connect(investors[0]).claimTokens();

            // В cB окремі rewards, не зачеплені
            const pendingInB = await cB.campaign.pendingTokenRewards(investors[0].address);
            expect(pendingInB).to.be.gt(0n);

            log.info("✅ token rewards are independent per campaign");
        });
    });
});
