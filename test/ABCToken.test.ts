import { artifacts, contract, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import BN from "bn.js";

const truffleAssert = require("truffle-assertions");

import {
  ABCTokenContract,
  ABCTokenInstance,
  IUniswapV2Router02Contract,
  IUniswapV2Router02Instance,
} from "../typechain-types";
import { WBNBContract, WBNBInstance } from "../typechain-types/WBNB";

chai.use(chaiAsPromised).should();
const { expect, assert } = chai;

const ABCToken: ABCTokenContract = artifacts.require("TestABC");
const IUniswapV2Router: IUniswapV2Router02Contract = artifacts.require("IUniswapV2Router02");
const WBNB: WBNBContract = artifacts.require("WBNB");

const ten = new BN("10");
const tenPow8 = ten.pow(new BN("8"));
const tenPow18 = ten.pow(new BN("18"));

const devTokenFeePercent = new BN("36");
const devBNBFeePercent = new BN("12");
const buyBackFeePercent = new BN("28");
const liquidityFeePercent = new BN("24");

const devAddress = "0xa670a43859bba57da9f0a275b601a3f0acccd41a";

const coreTeamAddress = "0xd6bd0aa9ec3b00a11c9b56263ba730d3c1a82b18";
const advisorsAddress = "0x6148e01353ef1104ba85dde9b60675a9d61b61a1";
const reserveAddress = "0x442c53578def2ba3e0e3d402907ba2e6ce204499";
const stakingAddress = "0x3aa9c623b4f6692f1b1c710899094548cc8fb316";
const ecosystemAddress = "0x1022d7d2c37281af0af8068639211e0f6b09271f";
const playToEarnAddress = "0xbf4f5ca51f777995f60e1f6a7e488787dc82c524";

contract("ABCToken", (accounts) => {
  const [deployer, user1, user2] = accounts;

  let router: IUniswapV2Router02Instance;
  let token: ABCTokenInstance;
  let wbnb: WBNBInstance;
  before("Init router and WBNB", async () => {
    router = await IUniswapV2Router.at("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
    wbnb = await WBNB.at("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
  });

  beforeEach("Deploy ABC Token", async () => {
    token = await ABCToken.new({ from: deployer });
  });

  describe("#Name Symbol Decimals", () => {
    it("Name is expected name", async () => {
      const expectedName = "ABCToken";
      const actualName = await token.name();
      assert.strictEqual(actualName, expectedName);
    });
    it("Symbol is expected symbol", async () => {
      const expectedSymbol = "ABC";
      const actualSymbol = await token.symbol();
      assert.strictEqual(actualSymbol, expectedSymbol);
    });
    it("Decimals is expected decimals", async () => {
      const expectedDecimals = new BN("8");
      const actualDecimals = await token.decimals();
      assert.isTrue(
        actualDecimals.eq(expectedDecimals),
        `expected decimal is ${expectedDecimals.toString()} but contract returns ${actualDecimals.toString()}`
      );
    });
  });

  describe("#Initial values", () => {
    it("total supply should be 100M", async () => {
      const expectedTotalSupply = new BN("100000000").mul(tenPow8);
      const actualTotalSupply = await token.totalSupply();
      assert.isTrue(
        actualTotalSupply.eq(expectedTotalSupply),
        `expected total supply is -> ${expectedTotalSupply.toString()} but contract returns ${actualTotalSupply.toString()}`
      );
    });

    it("deployer balance should be equal to totalSupply", async () => {
      const expectedDeployerBalance = await token.totalSupply();
      const actualDeployerBalance = await token.balanceOf(deployer);
      assert.isTrue(
        actualDeployerBalance.eq(expectedDeployerBalance),
        `expected deployer balance is -> ${expectedDeployerBalance.toString()} but contract returns ${actualDeployerBalance.toString()}`
      );
    });

    it("router address should be pancake router address", async () => {
      const expectedRouterAddress = router.address;
      const actualRouterAddress = await token.routerAddress();
      assert.strictEqual(actualRouterAddress.toLowerCase(), expectedRouterAddress.toLowerCase());
    });

    it("dev team fee should be setted", async () => {
      const expectedDevFee = devTokenFeePercent;
      const actualDevFee = await token.devTokenFeePercent();
      assert.isTrue(
        actualDevFee.eq(expectedDevFee),
        `expected dev fee is -> ${expectedDevFee.toString()} but contract returns ${actualDevFee.toString()}`
      );
    });

    it("liquidity fee should be setted", async () => {
      const expectedLiquidityFee = liquidityFeePercent;
      const actualLiquidityFee = await token.liquidityFeePercent();
      assert.isTrue(
        actualLiquidityFee.eq(expectedLiquidityFee),
        `expected dev fee is -> ${expectedLiquidityFee.toString()} but contract returns ${actualLiquidityFee.toString()}`
      );
    });

    it("dev BNB fee should be setted", async () => {
      const expectedDevBNBFee = devBNBFeePercent;
      const actualDevBNBFee = await token.devBNBFeePercent();
      assert.isTrue(
        actualDevBNBFee.eq(expectedDevBNBFee),
        `expected dev fee is -> ${expectedDevBNBFee.toString()} but contract returns ${actualDevBNBFee.toString()}`
      );
    });

    it("buy back fee should be setted", async () => {
      const expectedBuyBackFee = buyBackFeePercent;
      const actualBuyBackFee = await token.buyBackFeePercent();
      assert.isTrue(
        actualBuyBackFee.eq(expectedBuyBackFee),
        `expected dev fee is -> ${expectedBuyBackFee.toString()} but contract returns ${actualBuyBackFee.toString()}`
      );
    });
  });

  describe("#Transfers", () => {
    it("should transfer from deployer without fee to user1", async () => {
      const transferAmount = new BN("10000").mul(tenPow8);
      const deployerBalanceBefore = await token.balanceOf(deployer);
      const user1BalanceBefore = await token.balanceOf(user1);
      await token.transfer(user1, transferAmount, { from: deployer });
      const deployerBalanceAfter = await token.balanceOf(deployer);
      const user1BalanceAfter = await token.balanceOf(user1);
      assert.isTrue(deployerBalanceAfter.eq(deployerBalanceBefore.sub(transferAmount)));
      assert.isTrue(user1BalanceAfter.eq(user1BalanceBefore.add(transferAmount)));
    });

    describe("#Initial transfer to user1 and user2 ", () => {
      beforeEach(async () => {
        const transferAmount = new BN("1000000").mul(tenPow8);
        await token.transfer(user1, transferAmount, { from: deployer });
        await token.transfer(user2, transferAmount, { from: deployer });
      });

      it("should transfer from user1 to deployer without fee", async () => {
        const transferAmount = new BN("100000").mul(tenPow8);
        const deployerBalanceBefore = await token.balanceOf(deployer);
        const user1BalanceBefore = await token.balanceOf(user1);
        await token.transfer(deployer, transferAmount, { from: user1 });
        const deployerBalanceAfter = await token.balanceOf(deployer);
        const user1BalanceAfter = await token.balanceOf(user1);
        assert.isTrue(deployerBalanceAfter.eq(deployerBalanceBefore.add(transferAmount)));
        assert.isTrue(user1BalanceAfter.eq(user1BalanceBefore.sub(transferAmount)));
      });

      it("should collect fee if sender and recipient are not excluded from fee", async () => {
        const transferAmount = new BN("100000");
        const expectedDevFee = transferAmount.muln(36).divn(1000); // 3.6%
        const expectedLiquidityFee = transferAmount.muln(24).divn(1000); // 2.4%
        const expectedRecipientAmount = transferAmount.sub(expectedDevFee).sub(expectedLiquidityFee);
        const user1BalanceBefore = await token.balanceOf(user1);
        const user2BalanceBefore = await token.balanceOf(user2);
        const devBalanceBefore = await token.balanceOf(devAddress);
        const contractBalanceBefore = await token.balanceOf(token.address);
        await token.transfer(user2, transferAmount, { from: user1 });
        const user1BalanceAfter = await token.balanceOf(user1);
        const user2BalanceAfter = await token.balanceOf(user2);
        const devBalanceAfter = await token.balanceOf(devAddress);
        const contractBalanceAfter = await token.balanceOf(token.address);
        assert.isTrue(user1BalanceAfter.eq(user1BalanceBefore.sub(transferAmount)));
        assert.isTrue(user2BalanceAfter.eq(user2BalanceBefore.add(expectedRecipientAmount)));
        assert.isTrue(devBalanceAfter.eq(devBalanceBefore.add(expectedDevFee)));
        assert.isTrue(contractBalanceAfter.eq(contractBalanceBefore.add(expectedLiquidityFee)));
      });

      it("cannot do transaction if time between transactions is less than 10", async () => {
        const transferAmount = new BN("100").mul(tenPow8);
        await token.transfer(user2, transferAmount, { from: user1 });
        await expect(token.transfer(user2, transferAmount, { from: user1 })).to.be.rejectedWith(
          Error,
          "time between transfers should be 10 seconds"
        );
      });

      it("can do transaction if time between transactions is more than 10", async () => {
        const increasedTime = 11;
        const transferAmount = new BN("100").mul(tenPow8);
        await token.transfer(user2, transferAmount, { from: user1 });
        await network.provider.send("evm_increaseTime", [increasedTime]);
        await network.provider.send("evm_mine");
        await expect(token.transfer(user2, transferAmount, { from: user1 })).to.not.be.rejectedWith(
          Error,
          "time between transfers should be 10 seconds"
        );
      });

      const addLiquidity = async () => {
        const zero = new BN("0");
        // initial Amounts
        const wbnbAmount = new BN("100000").mul(tenPow18);
        const tokenAmount = new BN("1000000").mul(tenPow8);
        // deposit wbnb
        await wbnb.deposit({ from: deployer, value: wbnbAmount });
        // approvement
        await wbnb.approve(router.address, wbnbAmount, { from: deployer });
        await token.approve(router.address, tokenAmount, { from: deployer });
        // add to liquidity
        await router.addLiquidity(
          wbnb.address,
          token.address,
          wbnbAmount,
          tokenAmount,
          zero,
          zero,
          deployer,
          new BN(Math.floor(Date.now() / 1000) * 2)
        );
      };
    });
  });

  const increasedTime = async (seconds: number) => {
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine");
  };

  describe("coreTeam unlock before 13 months", function () {
    it("should not be able to unlock", async function () {
      let threeMonths = 60 * 60 * 24 * 30 * 3;
      await increasedTime(threeMonths);
      await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "it is too soon to unlock");
      await token.balanceOf(coreTeamAddress);
    });
  });

  describe("coreTeam balance at start of contract", function () {
    it("should return the balance of coreTeam", async function () {
      let twoMonths = 60 * 60 * 24 * 30 * 2;
      await increasedTime(twoMonths);
      let amount = new BN("0");
      // console.log(await token.balanceOf(coreTeamAddress).toString());
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("coreTeamUnlock", function () {
    it("follow CoreTeam unlock cases twenty months", async function () {
      let amount1 = new BN("199333333900000000");
      let amount2 = new BN("581333335300000000");
      let fourteenMonths = 60 * 60 * 24 * 30 * 14;
      let sixMonths = 60 * 60 * 24 * 30 * 6;
      await increasedTime(fourteenMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount1.toString());
      await increasedTime(sixMonths);
      await token.coreTeamUnlock();
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount2.toString());
      await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("follow CoreTeam unlock cases at 20 months", async function () {
      let amount = new BN("581333335300000000");
      let fourteenMonths = 60 * 60 * 24 * 30 * 20;
      await increasedTime(fourteenMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("follow CoreTeam unlock cases", async function () {
      let amount = new BN("199333333900000000");
      let fourteenMonths = 60 * 60 * 24 * 30 * 14;
      await increasedTime(fourteenMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("at last month", async function () {
      let amount = new BN("1600000005700000000");
      let thirtySixMonths = 60 * 60 * 24 * 30 * 36;
      await increasedTime(thirtySixMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      // await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("at last month", async function () {
      let amount = new BN("1600000005700000000");
      let thirtySevenMonths = 60 * 60 * 24 * 30 * 37;
      await increasedTime(thirtySevenMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      // await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("at last month", async function () {
      let amount = new BN("1600000005700000000");
      let thirtyEightMonths = 60 * 60 * 24 * 30 * 38;
      await increasedTime(thirtyEightMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      // await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("at last month", async function () {
      let amount = new BN("1600000005700000000");
      let fortyNineMonths = 60 * 60 * 24 * 30 * 49;
      await increasedTime(fortyNineMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      // await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("at last month", async function () {
      let amount = new BN("1600000005700000000");
      let fiftyFiveMonths = 60 * 60 * 24 * 30 * 55;
      await increasedTime(fiftyFiveMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      // await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("coreTeamUnlock", function () {
    it("at last month", async function () {
      let amount = new BN("1600000005700000000");
      let sixtyMonths = 60 * 60 * 24 * 30 * 60;
      await increasedTime(sixtyMonths);
      await token.coreTeamUnlock();
      // await token.balanceOf(coreTeamAddress);
      expect((await token.balanceOf(coreTeamAddress)).toString()).to.be.equal(amount.toString());
      // await expect(token.coreTeamUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });

  ///////////////////////////////////////BUG
  /////////////////////////////////////
  /////////////////////////////////
  describe("Advisors unlock at starts", function () {
    it("should unlock 880000000", async function () {
      let amount = new BN("88000000000000000");
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 1 month", function () {
    it("should reject", async function () {
      let amount = new BN("88000000000000000");
      let oneMonths = 60 * 60 * 24 * 30 * 1;
      await increasedTime(oneMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "it is too soon to unlock");
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 2 months", function () {
    it("should reject", async function () {
      let amount = new BN("88000000000000000");
      let twoMonths = 60 * 60 * 24 * 30 * 2;
      await increasedTime(twoMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 3 months", function () {
    it("should unlock 1680000000", async function () {
      let amount = new BN("168000000000000000");
      let threeMonths = 60 * 60 * 24 * 30 * 3;
      await increasedTime(threeMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 4 months", function () {
    it("should reject", async function () {
      let amount = new BN("168000000000000000");
      let threeMonths = 60 * 60 * 24 * 30 * 3;
      let fourMonths = 60 * 60 * 24 * 30 * 1;
      await increasedTime(threeMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(fourMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 5 months", function () {
    it("should reject", async function () {
      let amount = new BN("168000000000000000");
      let threeMonths = 60 * 60 * 24 * 30 * 3;
      let fiveMonths = 60 * 60 * 24 * 30 * 2;
      await increasedTime(threeMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(fiveMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 6 months", function () {
    it("should unlock 2480000000", async function () {
      let amount = new BN("248000000000000000");
      let sixMonths = 60 * 60 * 24 * 30 * 6;
      await increasedTime(sixMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 7 months", function () {
    it("should reject", async function () {
      let amount = new BN("248000000000000000");
      let sixMonths = 60 * 60 * 24 * 30 * 6;
      let sevenMonths = 60 * 60 * 24 * 30 * 1;
      await increasedTime(sixMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(sevenMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 8 months", function () {
    it("should reject", async function () {
      let amount = new BN("248000000000000000");
      let sixMonths = 60 * 60 * 24 * 30 * 6;
      let eightMonths = 60 * 60 * 24 * 30 * 2;
      await increasedTime(sixMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(eightMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 9 months", function () {
    it("should unlock 3200000000", async function () {
      let amount = new BN("320000000000000000");
      let nineMonths = 60 * 60 * 24 * 30 * 9;
      await increasedTime(nineMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 12 months", function () {
    it("should unlock 3920000000", async function () {
      let amount = new BN("392000000000000000");
      let twelveMonths = 60 * 60 * 24 * 30 * 12;
      await increasedTime(twelveMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 13 months", function () {
    it("should unlock 3920000000", async function () {
      let amount = new BN("392000000000000000");
      let thirteenMonths = 60 * 60 * 24 * 30 * 13;
      await increasedTime(thirteenMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 13 after unlocking at 12 months", function () {
    it("should reject", async function () {
      let amount = new BN("392000000000000000");
      let twelveMonths = 60 * 60 * 24 * 30 * 12;
      let thirteenMonths = 60 * 60 * 24 * 30 * 1;
      await increasedTime(twelveMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(thirteenMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 15 months", function () {
    it("should unlock 4560000000", async function () {
      let amount = new BN("456000000000000000");
      let fifteenMonths = 60 * 60 * 24 * 30 * 15;
      await increasedTime(fifteenMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 17 months", function () {
    it("should unlock 4560000000", async function () {
      let amount = new BN("456000000000000000");
      let seventeenMonths = 60 * 60 * 24 * 30 * 17;
      await increasedTime(seventeenMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 17 after unlocking at 15 months", function () {
    it("should reject", async function () {
      let amount = new BN("456000000000000000");
      let fifteenMonths = 60 * 60 * 24 * 30 * 15;
      let seventeenMonths = 60 * 60 * 24 * 30 * 2;
      await increasedTime(fifteenMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(seventeenMonths);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 18 months", function () {
    it("should unlock 5200000000", async function () {
      let amount = new BN("520000000000000000");
      let eighteenMonths = 60 * 60 * 24 * 30 * 18;
      await increasedTime(eighteenMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 20 months", function () {
    it("should unlock 5200000000", async function () {
      let amount = new BN("520000000000000000");
      let twenty = 60 * 60 * 24 * 30 * 20;
      await increasedTime(twenty);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 20 after unlocking at 18 months", function () {
    it("should reject", async function () {
      let amount = new BN("520000000000000000");
      let eighteenMonths = 60 * 60 * 24 * 30 * 18;
      let twenty = 60 * 60 * 24 * 30 * 2;
      await increasedTime(eighteenMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(twenty);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 21 Months after unlocking at 3 months", function () {
    it("should unlock 1680000000", async function () {
      let amount = new BN("168000000000000000");
      let amount2 = new BN("520000000000000000");
      let threeMonths = 60 * 60 * 24 * 30 * 3;
      await increasedTime(threeMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      let seventeenMonths = 60 * 60 * 24 * 30 * 17;
      await increasedTime(seventeenMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount2.toString());
    });
  });
  describe("Advisors unlock at 21 months", function () {
    it("should unlock 5760000000", async function () {
      let amount = new BN("576000000000000000");
      let twentyOne = 60 * 60 * 24 * 30 * 21;
      await increasedTime(twentyOne);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 23 after unlocking at 11 months", function () {
    it("should reject", async function () {
      let amount = new BN("576000000000000000");
      let twentyOne = 60 * 60 * 24 * 30 * 21;
      let twentyThree = 60 * 60 * 24 * 30 * 2;
      await increasedTime(twentyOne);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(twentyThree);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 24 months", function () {
    it("should unlock 6320000000", async function () {
      let amount = new BN("632000000000000000");
      let twentyFour = 60 * 60 * 24 * 30 * 24;
      await increasedTime(twentyFour);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 26 after unlocking at 24 months", function () {
    it("should reject", async function () {
      let amount = new BN("632000000000000000");
      let twentyFour = 60 * 60 * 24 * 30 * 24;
      let twentySix = 60 * 60 * 24 * 30 * 2;
      await increasedTime(twentyFour);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(twentySix);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 27 months", function () {
    it("should unlock 6800000000", async function () {
      let amount = new BN("680000000000000000");
      let twentySeven = 60 * 60 * 24 * 30 * 27;
      await increasedTime(twentySeven);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 29 after unlocking at 28 months", function () {
    it("should reject", async function () {
      let amount = new BN("680000000000000000");
      let twentyEight = 60 * 60 * 24 * 30 * 28;
      let twentyNine = 60 * 60 * 24 * 30 * 1;
      await increasedTime(twentyEight);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(twentyNine);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 30 months", function () {
    it("should unlock 7280000000", async function () {
      let amount = new BN("728000000000000000");
      let thirty = 60 * 60 * 24 * 30 * 30;
      await increasedTime(thirty);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 32 after unlocking at 31 months", function () {
    it("should reject", async function () {
      let amount = new BN("728000000000000000");
      let thirtyOne = 60 * 60 * 24 * 30 * 31;
      let thirtyTwo = 60 * 60 * 24 * 30 * 1;
      await increasedTime(thirtyOne);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(thirtyTwo);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 33 months", function () {
    it("should unlock 7680000000", async function () {
      let amount = new BN("768000000000000000");
      let thirtyThree = 60 * 60 * 24 * 30 * 33;
      await increasedTime(thirtyThree);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 35 after unlocking at 34 months", function () {
    it("should reject", async function () {
      let amount = new BN("768000000000000000");
      let thirtyFour = 60 * 60 * 24 * 30 * 34;
      let thirtyFive = 60 * 60 * 24 * 30 * 1;
      await increasedTime(thirtyFour);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(thirtyFive);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("Advisors unlock at 36 months", function () {
    it("should unlock 8000000000", async function () {
      let amount = new BN("800000000000000000");
      let thirtySix = 60 * 60 * 24 * 30 * 36;
      await increasedTime(thirtySix);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 50  after unlocking at 40 months", function () {
    it("should reject", async function () {
      let amount = new BN("800000000000000000");
      let forty = 60 * 60 * 24 * 30 * 40;
      let fifty = 60 * 60 * 24 * 30 * 10;
      await increasedTime(forty);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(fifty);
      await expect(token.advisorsUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });

  describe("Advisors unlock at 55 months", function () {
    it("should unlock 8000000000", async function () {
      let amount = new BN("800000000000000000");
      let fiftyFive = 60 * 60 * 24 * 30 * 55;
      await increasedTime(fiftyFive);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });

  ///////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////FIXME
  describe("reserve unlock before 24 months", function () {
    it("should not be able to unlock", async function () {
      let amount = new BN("76923077200000000");
      let twenty = 60 * 60 * 24 * 30 * 20;
      await increasedTime(twenty);
      await expect(token.reserveUnlock()).to.be.eventually.rejectedWith(Error, "it is too soon to unlock");
    });
  });
  describe("reserve unlock at 24 months", function () {
    it("should unlock 769230772", async function () {
      let amount = new BN("76923077200000000");
      let twentyFour = 60 * 60 * 24 * 30 * 24;
      await increasedTime(twentyFour);
      await token.reserveUnlock();
      expect((await token.balanceOf(reserveAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("reserve unlock at 26 months", function () {
    it("should unlock 769230772", async function () {
      let amount = new BN("76923077200000000");
      let twentySix = 60 * 60 * 24 * 30 * 26;
      await increasedTime(twentySix);
      await token.reserveUnlock();
      expect((await token.balanceOf(reserveAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 26 after unlocking at 24 months", function () {
    it("should reject", async function () {
      let amount = new BN("76923077200000000");
      let twentyFour = 60 * 60 * 24 * 30 * 24;
      let twentySix = 60 * 60 * 24 * 30 * 2;
      await increasedTime(twentyFour);
      await token.reserveUnlock();
      expect((await token.balanceOf(reserveAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(twentySix);
      await expect(token.reserveUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("reserve unlock at 27 months", function () {
    it("should unlock 1538461541", async function () {
      let amount = new BN("153846154100000000");
      let twentySeven = 60 * 60 * 24 * 30 * 27;
      await increasedTime(twentySeven);
      await token.reserveUnlock();
      expect((await token.balanceOf(reserveAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("Advisors unlock at 29 after unlocking at 27 months", function () {
    it("should reject", async function () {
      let amount = new BN("153846154100000000");
      let twentySeven = 60 * 60 * 24 * 30 * 27;
      let twentyNine = 60 * 60 * 24 * 30 * 2;
      await increasedTime(twentySeven);
      await token.reserveUnlock();
      expect((await token.balanceOf(reserveAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(twentyNine);
      await expect(token.reserveUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("reserve unlock at 60 months", function () {
    it("should unlock 10000000000", async function () {
      let amount = new BN("1000000000000000000");
      let sixty = 60 * 60 * 24 * 30 * 60;
      await increasedTime(sixty);
      await token.reserveUnlock();
      expect((await token.balanceOf(reserveAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 60 months", function () {
    it("should unlock 20000000000", async function () {
      let amount = new BN("2000000000000000000");
      let sixty = 60 * 60 * 24 * 30 * 60;
      await increasedTime(sixty);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });

  describe("staking unlock at 10 months", function () {
    it("should unlock 4000000000", async function () {
      let amount = new BN("400000000000000000");
      let tenMonths = 60 * 60 * 24 * 30 * 10;
      await increasedTime(tenMonths);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 20 months", function () {
    it("should unlock 7760000000", async function () {
      let amount = new BN("776000000000000000");
      let twenty = 60 * 60 * 24 * 30 * 20;
      await increasedTime(twenty);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 40 months", function () {
    it("should unlock 14400000000", async function () {
      let amount = new BN("1440000000000000000");
      let forty = 60 * 60 * 24 * 30 * 40;
      await increasedTime(forty);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 43 months", function () {
    it("should unlock 15300000000", async function () {
      let amount = new BN("1530000000000000000");
      let fortyThree = 60 * 60 * 24 * 30 * 43;
      await increasedTime(fortyThree);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });

  ///////////////////////////////FIXME
  describe("staking unlock at 46 months", function () {
    it("should unlock 16200000000", async function () {
      let amount = new BN("1620000000000000000");
      let fortySix = 60 * 60 * 24 * 30 * 46;
      await increasedTime(fortySix);
      await token.stakingUnlock();
      console.log((await token.stakingUnlockedTillNow()).toString());
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 47 months", function () {
    it("should unlock 16500000000", async function () {
      let amount = new BN("1650000000000000000");
      let fortySeven = 60 * 60 * 24 * 30 * 47;
      await increasedTime(fortySeven);
      await token.stakingUnlock();
      console.log((await token.stakingUnlockedTillNow()).toString());
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 48 months", function () {
    it("should unlock 16800000000", async function () {
      let amount = new BN("1680000000000000000");
      let fortyEight = 60 * 60 * 24 * 30 * 48;
      await increasedTime(fortyEight);
      await token.stakingUnlock();
      console.log((await token.balanceOf(stakingAddress)).toString());
      console.log((await token.stakingUnlockedTillNow()).toString());
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 49 months", function () {
    it("should unlock 17070000000", async function () {
      let amount = new BN("1707000000000000000");
      let fortyNine = 60 * 60 * 24 * 30 * 49;
      await increasedTime(fortyNine);
      await token.stakingUnlock();
      console.log((await token.balanceOf(stakingAddress)).toString());
      console.log((await token.stakingUnlockedTillNow()).toString());
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 50 months", function () {
    it("should unlock 17340000000", async function () {
      let amount = new BN("1734000000000000000");
      let fifty = 60 * 60 * 24 * 30 * 50;
      await increasedTime(fifty);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 50 months and then reject at 50 month", function () {
    it("should unlock 17340000000", async function () {
      let amount = new BN("1734000000000000000");
      let fifty = 60 * 60 * 24 * 30 * 50;
      await increasedTime(fifty);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
      await expect(token.stakingUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
  describe("staking unlock at 60 months", function () {
    it("should unlock 20000000000", async function () {
      let amount = new BN("2000000000000000000");
      let sixtyMonths = 60 * 60 * 24 * 30 * 60;
      await increasedTime(sixtyMonths);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("staking unlock at 65 months", function () {
    it("should unlock 20000000000", async function () {
      let amount = new BN("2000000000000000000");
      let sixtyFiveMonths = 60 * 60 * 24 * 30 * 65;
      await increasedTime(sixtyFiveMonths);
      await token.stakingUnlock();
      expect((await token.balanceOf(stakingAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  ////////////////////////FIXME
  describe("ecoSystem should deploy with 3mil ", function () {
    it("deploy with 3 bil", async function () {
      let amount = new BN("300000000000000000");
      let oneMonth = 60 * 60 * 24 * 30 * 1;
      await increasedTime(oneMonth);
      expect((await token.balanceOf(ecosystemAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("ecoSystem unlock before 2 months", function () {
    it("should not be able to unlock", async function () {
      let oneMonth = 60 * 60 * 24 * 30 * 1;
      await increasedTime(oneMonth);
      await expect(token.ecosystemUnlock()).to.be.eventually.rejectedWith(Error, "it is too soon to unlock");
      // await token.balanceOf(ecosystemAddress);
    });
  });
  describe("ecoSystem unlock at 4th  month", function () {
    it("should unlock 5000000000", async function () {
      let amount = new BN("500000000000000000");
      let forthMonth = 60 * 60 * 24 * 30 * 4;
      await increasedTime(forthMonth);
      await token.ecosystemUnlock();
      expect((await token.balanceOf(ecosystemAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("ecoSystem unlock at 46  months", function () {
    it("should unlock 12000000000", async function () {
      let amount = new BN("1200000000000000000");
      let fortySix = 60 * 60 * 24 * 30 * 46;
      await increasedTime(fortySix);
      await token.ecosystemUnlock();
      expect((await token.balanceOf(ecosystemAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("ecoSystem unlock at 45  months", function () {
    it("should unlock 12000000000", async function () {
      let amount = new BN("1200000000000000000");
      let fortyFive = 60 * 60 * 24 * 30 * 45;
      await increasedTime(fortyFive);
      await token.ecosystemUnlock();
      expect((await token.balanceOf(ecosystemAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("ecoSystem unlock at 50 months then at 55 months", function () {
    it("should unlock 12000000000", async function () {
      let amount = new BN("1200000000000000000");
      let fifty = 60 * 60 * 24 * 30 * 50;
      let fiftyFive = 60 * 60 * 24 * 30 * 5;
      await increasedTime(fifty);
      await token.ecosystemUnlock();
      expect((await token.balanceOf(ecosystemAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(fifty);
      await expect(token.ecosystemUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });

  ///////FIXME

  describe("Advisors unlock at 3 months", function () {
    it("should unlock 1680000000", async function () {
      let amount = new BN("168000000000000000");
      let threeMonths = 60 * 60 * 24 * 30 * 3;
      await increasedTime(threeMonths);
      await token.advisorsUnlock();
      expect((await token.balanceOf(advisorsAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("playToEarn should deploy with 1mil ", function () {
    it("deploy with 1 bil", async function () {
      let amount = new BN("100000000000000000");
      let oneMonth = 60 * 60 * 24 * 30 * 1;
      await increasedTime(oneMonth);
      expect((await token.balanceOf(playToEarnAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("playToEarn should unlock 18 bil at and after 60 months", function () {
    it("should unlock 18000000000", async function () {
      let amount = new BN("1800000000000000000");
      let sixty = 60 * 60 * 24 * 30 * 60;
      await increasedTime(sixty);
      await token.playToEarnUnlock();
      expect((await token.balanceOf(playToEarnAddress)).toString()).to.be.equal(amount.toString());
    });
  });
  describe("playToEarn should unlock at 22months and then reject unlocking at 23 months", function () {
    it("should unlock at 22(7052635000) then reject at 23", async function () {
      let amount = new BN("705263500000000000");
      let twentyTwo = 60 * 60 * 24 * 30 * 22;
      let twentyThree = 60 * 60 * 24 * 30 * 1;
      await increasedTime(twentyTwo);
      await token.playToEarnUnlock();
      expect((await token.balanceOf(playToEarnAddress)).toString()).to.be.equal(amount.toString());
      await increasedTime(twentyThree);
      await expect(token.playToEarnUnlock()).to.be.eventually.rejectedWith(Error, "Now there is no token to unlock");
    });
  });
});
