import { artifacts, contract, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import BN from "bn.js";

import {
  ABCTokenContract,
  ABCTokenInstance,
  IUniswapV2Router02Contract,
  IUniswapV2Router02Instance,
} from "../typechain-types";

chai.use(chaiAsPromised).should();
const { expect, assert } = chai;

const ABCToken: ABCTokenContract = artifacts.require("TestABC");
const IUniswapV2Router: IUniswapV2Router02Contract = artifacts.require("IUniswapV2Router02");

const ten = new BN("10");
const tenPow8 = ten.pow(new BN("8"));

const devTokenFeePercent = new BN("36");
const devBNBFeePercent = new BN("12");
const buyBackFeePercent = new BN("28");
const liquidityFeePercent = new BN("24");

contract("ABCToken", (accounts) => {
  const [deployer] = accounts;

  let router: IUniswapV2Router02Instance;
  let token: ABCTokenInstance;
  before("Init router and WBNB", async () => {
    router = await IUniswapV2Router.at("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
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
});
