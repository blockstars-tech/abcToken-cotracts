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
});
