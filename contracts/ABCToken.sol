// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

import { IUniswapV2Router02 } from "./interfaces/IUniswapV2Router02.sol";
import { IUniswapV2Factory } from "./interfaces/IUniswapV2Factory.sol";
import { IUniswapV2Pair } from "./interfaces/IUniswapV2Pair.sol";

// solhint-disable-next-line max-states-count
contract ABCToken is IERC20Metadata, Ownable {
  mapping(address => uint256) private _balances;

  mapping(address => mapping(address => uint256)) private _allowances;

  uint256 private _totalSupply;

  string private _name = "ABCToken";
  string private _symbol = "ABC";

  // uint256 private _minNumTokensSellToAddToLiquidity = 5000 * 10**8;

  mapping(address => bool) private _isExcludedFromFee;
  mapping(address => bool) private _isPair;

  uint256 private constant TEN_POW_8 = 10**8;
  uint256 private constant MONTH = 30 days;
  address public buyBackAddress = 0x000000000000000000000000000000000000dEaD;

  uint256[] public coreTeamUnlockPerMonth = [
    1_356_666_670,
    1_356_666_670 + 636_666_669,
    1_356_666_670 + 636_666_669 * 2,
    1_356_666_670 + 636_666_669 * 3,
    1_356_666_670 + 636_666_669 * 4,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 2,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 3,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 4,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 5,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 6,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 7,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 8,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 9,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 10,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 11,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 12,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 13,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 14,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 15,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 16,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 17,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 18,
    1_356_666_670 + 636_666_669 * 4 + 636_666_666 * 19
  ];
  uint256 public coreTeamUnlockedTillNow = 0;

  uint256[] public advisorsUnlockPerMonth = [
    0,
    800_000_000,
    800_000_000,
    800_000_000,
    800_000_000 * 2,
    800_000_000 * 2,
    800_000_000 * 2,
    800_000_000 * 2 + 720_000_000,
    800_000_000 * 2 + 720_000_000,
    800_000_000 * 2 + 720_000_000,
    800_000_000 * 2 + 720_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000 * 2,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000 * 2 + 400_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000 * 2 + 400_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000 * 2 + 400_000_000,
    800_000_000 * 2 + 720_000_000 * 2 + 640_000_000 * 2 + 560_000_000 * 2 + 480_000_000 * 2 + 400_000_000 + 320_000_000
  ];
  uint256 public advisorsUnlockedTillNow = 0;

  uint256[] public reserveUnlockPerMonth = [
    769_230_772,
    769_230_772,
    769_230_772,
    769_230_772 + 769_230_769,
    769_230_772 + 769_230_769,
    769_230_772 + 769_230_769,
    769_230_772 + 769_230_769 * 2,
    769_230_772 + 769_230_769 * 2,
    769_230_772 + 769_230_769 * 2,
    769_230_772 + 769_230_769 * 3,
    769_230_772 + 769_230_769 * 3,
    769_230_772 + 769_230_769 * 3,
    769_230_772 + 769_230_769 * 4,
    769_230_772 + 769_230_769 * 4,
    769_230_772 + 769_230_769 * 4,
    769_230_772 + 769_230_769 * 5,
    769_230_772 + 769_230_769 * 5,
    769_230_772 + 769_230_769 * 5,
    769_230_772 + 769_230_769 * 6,
    769_230_772 + 769_230_769 * 6,
    769_230_772 + 769_230_769 * 6,
    769_230_772 + 769_230_769 * 7,
    769_230_772 + 769_230_769 * 7,
    769_230_772 + 769_230_769 * 7,
    769_230_772 + 769_230_769 * 8,
    769_230_772 + 769_230_769 * 8,
    769_230_772 + 769_230_769 * 8,
    769_230_772 + 769_230_769 * 9,
    769_230_772 + 769_230_769 * 9,
    769_230_772 + 769_230_769 * 9,
    769_230_772 + 769_230_769 * 10,
    769_230_772 + 769_230_769 * 10,
    769_230_772 + 769_230_769 * 10,
    769_230_772 + 769_230_769 * 11,
    769_230_772 + 769_230_769 * 11,
    769_230_772 + 769_230_769 * 11,
    769_230_772 + 769_230_769 * 12
  ];
  uint256 public reserveUnlockedTillNow = 0;

  uint256[] public stakingUnlockPerMonth = [
    400_000_000,
    400_000_000 * 2,
    400_000_000 * 3,
    400_000_000 * 4,
    400_000_000 * 5,
    400_000_000 * 6,
    400_000_000 * 7,
    400_000_000 * 8,
    400_000_000 * 9,
    400_000_000 * 10,
    400_000_000 * 11,
    400_000_000 * 11 + 370_000_000,
    400_000_000 * 11 + 370_000_000 * 2,
    400_000_000 * 11 + 370_000_000 * 3,
    400_000_000 * 11 + 370_000_000 * 4,
    400_000_000 * 11 + 370_000_000 * 5,
    400_000_000 * 11 + 370_000_000 * 6,
    400_000_000 * 11 + 370_000_000 * 7,
    400_000_000 * 11 + 370_000_000 * 8,
    400_000_000 * 11 + 370_000_000 * 9,
    400_000_000 * 11 + 370_000_000 * 10,
    400_000_000 * 11 + 370_000_000 * 11,
    400_000_000 * 11 + 370_000_000 * 12,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 2,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 3,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 4,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 5,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 6,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 7,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 8,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 9,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 10,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 11,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 2,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 3,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 4,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 5,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 6,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 7,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 8,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 9,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 10,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 11,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 2,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 3,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 4,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 5,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 6,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 7,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 8,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 9,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 10,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 11,
    400_000_000 * 11 + 370_000_000 * 12 + 330_000_000 * 12 + 300_000_000 * 12 + 270_000_000 * 11 + 230_000_000
  ];
  uint256 public stakingUnlockedTillNow = 0;

  uint256[] public ecosystemUnlockPerMonth = [
    0,
    2_000_000_000,
    2_000_000_000,
    2_000_000_000,
    2_000_000_000,
    2_000_000_000,
    2_000_000_000,
    2_000_000_000 + 1_500_000_000,
    2_000_000_000 + 1_500_000_000,
    2_000_000_000 + 1_500_000_000,
    2_000_000_000 + 1_500_000_000,
    2_000_000_000 + 1_500_000_000,
    2_000_000_000 + 1_500_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000 * 2,
    2_000_000_000 + 1_500_000_000 + 1_250_000_000 * 2 + 1_000_000_000 + 750_000_000 * 2 + 500_000_000
  ];
  uint256 public ecosystemUnlockedTillNow = 0;

  uint256[] public playToEarnUnlockPerMonth = [
    0,
    1_000_000_000,
    1_000_000_000,
    1_000_000_000,
    1_000_000_000 + 842_110_000,
    1_000_000_000 + 842_110_000,
    1_000_000_000 + 842_110_000,
    1_000_000_000 + 842_110_000 + 842_105_000,
    1_000_000_000 + 842_110_000 + 842_105_000,
    1_000_000_000 + 842_110_000 + 842_105_000,
    1_000_000_000 + 842_110_000 + 842_105_000 * 2,
    1_000_000_000 + 842_110_000 + 842_105_000 * 2,
    1_000_000_000 + 842_110_000 + 842_105_000 * 2,
    1_000_000_000 + 842_110_000 + 842_105_000 * 3,
    1_000_000_000 + 842_110_000 + 842_105_000 * 3,
    1_000_000_000 + 842_110_000 + 842_105_000 * 3,
    1_000_000_000 + 842_110_000 + 842_105_000 * 4,
    1_000_000_000 + 842_110_000 + 842_105_000 * 4,
    1_000_000_000 + 842_110_000 + 842_105_000 * 4,
    1_000_000_000 + 842_110_000 + 842_105_000 * 5,
    1_000_000_000 + 842_110_000 + 842_105_000 * 5,
    1_000_000_000 + 842_110_000 + 842_105_000 * 5,
    1_000_000_000 + 842_110_000 + 842_105_000 * 6,
    1_000_000_000 + 842_110_000 + 842_105_000 * 6,
    1_000_000_000 + 842_110_000 + 842_105_000 * 6,
    1_000_000_000 + 842_110_000 + 842_105_000 * 7,
    1_000_000_000 + 842_110_000 + 842_105_000 * 7,
    1_000_000_000 + 842_110_000 + 842_105_000 * 7,
    1_000_000_000 + 842_110_000 + 842_105_000 * 8,
    1_000_000_000 + 842_110_000 + 842_105_000 * 8,
    1_000_000_000 + 842_110_000 + 842_105_000 * 8,
    1_000_000_000 + 842_110_000 + 842_105_000 * 9,
    1_000_000_000 + 842_110_000 + 842_105_000 * 9,
    1_000_000_000 + 842_110_000 + 842_105_000 * 9,
    1_000_000_000 + 842_110_000 + 842_105_000 * 10,
    1_000_000_000 + 842_110_000 + 842_105_000 * 10,
    1_000_000_000 + 842_110_000 + 842_105_000 * 10,
    1_000_000_000 + 842_110_000 + 842_105_000 * 11,
    1_000_000_000 + 842_110_000 + 842_105_000 * 11,
    1_000_000_000 + 842_110_000 + 842_105_000 * 11,
    1_000_000_000 + 842_110_000 + 842_105_000 * 12,
    1_000_000_000 + 842_110_000 + 842_105_000 * 12,
    1_000_000_000 + 842_110_000 + 842_105_000 * 12,
    1_000_000_000 + 842_110_000 + 842_105_000 * 13,
    1_000_000_000 + 842_110_000 + 842_105_000 * 13,
    1_000_000_000 + 842_110_000 + 842_105_000 * 13,
    1_000_000_000 + 842_110_000 + 842_105_000 * 14,
    1_000_000_000 + 842_110_000 + 842_105_000 * 14,
    1_000_000_000 + 842_110_000 + 842_105_000 * 14,
    1_000_000_000 + 842_110_000 + 842_105_000 * 15,
    1_000_000_000 + 842_110_000 + 842_105_000 * 15,
    1_000_000_000 + 842_110_000 + 842_105_000 * 15,
    1_000_000_000 + 842_110_000 + 842_105_000 * 16,
    1_000_000_000 + 842_110_000 + 842_105_000 * 16,
    1_000_000_000 + 842_110_000 + 842_105_000 * 16,
    1_000_000_000 + 842_110_000 + 842_105_000 * 17,
    1_000_000_000 + 842_110_000 + 842_105_000 * 17,
    1_000_000_000 + 842_110_000 + 842_105_000 * 17,
    1_000_000_000 + 842_110_000 + 842_105_000 * 18
  ];
  uint256 public playToEarnUnlockedTillNow = 0;

  IUniswapV2Router02 public routerAddress = IUniswapV2Router02(0x10ED43C718714eb63d5aA57B78B54704E256024E);

  address public devAddress = 0xa670a43859bBa57dA9F0A275B601A3F0AcccD41a;

  address public coreTeamAddress = 0xd6BD0AA9EC3b00a11c9b56263Ba730d3c1A82b18;
  address public advisorsAddress = 0x6148E01353EF1104bA85DDe9B60675A9D61B61A1;
  address public reserveAddress = 0x442C53578DEF2bA3e0e3D402907bA2E6CE204499;
  address public stakingAddress = 0x3Aa9c623B4f6692f1b1c710899094548Cc8fB316;
  address public ecosystemAddress = 0x1022D7d2C37281aF0AF8068639211e0f6b09271F;
  address public playToEarnAddress = 0xbf4f5CA51f777995F60e1F6a7E488787dc82C524;

  uint256 public immutable contractCreationTime;

  uint16 public devBNBFeePercent = 24;
  uint16 public buyBackFeePercent = 36;
  uint16 public devTokenFeePercent = 0;
  uint16 public liquidityFeePercent = 0;

  uint256 private _buyBackBNBCount;

  uint256 private _buyBackFeeCount;
  uint256 private _liquidityFeeCount;
  uint256 private _devBNBFeeCount;

  bool public inSwapAndLiquify;

  uint256 private _minNumOfTokensToAddLiquidity = 50000 * 10**8;

  mapping(address => uint256) private _userLastTransactionTime;

  event SwapAndLiquify(uint256 tokensSwapped, uint256 ethReceived, uint256 tokensIntoLiqudity);

  modifier lockTheSwap() {
    inSwapAndLiquify = true;
    _;
    inSwapAndLiquify = false;
  }

  /**
   * @dev Sets the values for {name} and {symbol}.
   *
   * The default value of {decimals} is 18. To select a different value for
   * {decimals} you should overload it.
   *
   * All two of these values are immutable: they can only be set once during
   * construction.
   */
  constructor() {
    // Create a uniswap pair for this new token
    _isPair[IUniswapV2Factory(routerAddress.factory()).createPair(address(this), routerAddress.WETH())] = true;

    //exclude owner and this contract from fee
    _isExcludedFromFee[msg.sender] = true;
    _isExcludedFromFee[address(this)] = true;

    // initial mints
    _mint(msg.sender, 16_000_000_000 * TEN_POW_8);
    _mint(advisorsAddress, 880_000_000 * TEN_POW_8);
    _mint(stakingAddress, 400_000_000 * TEN_POW_8);
    _mint(ecosystemAddress, 3_000_000_000 * TEN_POW_8);
    _mint(playToEarnAddress, 1_000_000_000 * TEN_POW_8);

    contractCreationTime = block.timestamp;
  }

  /**
   * @dev Returns the name of the token.
   */
  function name() public view virtual override returns (string memory) {
    return _name;
  }

  /**
   * @dev Returns the symbol of the token, usually a shorter version of the
   * name.
   */
  function symbol() public view virtual override returns (string memory) {
    return _symbol;
  }

  /**
   * @dev Returns the number of decimals used to get its user representation.
   * For example, if `decimals` equals `2`, a balance of `505` tokens should
   * be displayed to a user as `5.05` (`505 / 10 ** 2`).
   *
   * Tokens usually opt for a value of 18, imitating the relationship between
   * Ether and Wei. This is the value {ERC20} uses, unless this function is
   * overridden;
   *
   * NOTE: This information is only used for _display_ purposes: it in
   * no way affects any of the arithmetic of the contract, including
   * {IERC20-balanceOf} and {IERC20-transfer}.
   */
  function decimals() public view virtual override returns (uint8) {
    return 8;
  }

  /**
   * @dev See {IERC20-totalSupply}.
   */
  function totalSupply() public view virtual override returns (uint256) {
    return _totalSupply;
  }

  /**
   * @dev See {IERC20-balanceOf}.
   */
  function balanceOf(address account) public view virtual override returns (uint256) {
    return _balances[account];
  }

  /**
   * @dev See {IERC20-transfer}.
   *
   * Requirements:
   *
   * - `recipient` cannot be the zero address.
   * - the caller must have a balance of at least `amount`.
   */
  function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
    _transfer(_msgSender(), recipient, amount);
    return true;
  }

  /**
   * @dev See {IERC20-allowance}.
   */
  function allowance(address tokenOwner, address spender) public view virtual override returns (uint256) {
    return _allowances[tokenOwner][spender];
  }

  /**
   * @dev See {IERC20-approve}.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   */
  function approve(address spender, uint256 amount) public virtual override returns (bool) {
    _approve(_msgSender(), spender, amount);
    return true;
  }

  /**
   * @dev See {IERC20-transferFrom}.
   *
   * Emits an {Approval} event indicating the updated allowance. This is not
   * required by the EIP. See the note at the beginning of {ERC20}.
   *
   * Requirements:
   *
   * - `sender` and `recipient` cannot be the zero address.
   * - `sender` must have a balance of at least `amount`.
   * - the caller must have allowance for ``sender``'s tokens of at least
   * `amount`.
   */
  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) public virtual override returns (bool) {
    _transfer(sender, recipient, amount);

    uint256 currentAllowance = _allowances[sender][_msgSender()];
    require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
    unchecked {
      _approve(sender, _msgSender(), currentAllowance - amount);
    }

    return true;
  }

  /**
   * @dev Atomically increases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   */
  function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
    _approve(_msgSender(), spender, _allowances[_msgSender()][spender] + addedValue);
    return true;
  }

  /**
   * @dev Atomically decreases the allowance granted to `spender` by the caller.
   *
   * This is an alternative to {approve} that can be used as a mitigation for
   * problems described in {IERC20-approve}.
   *
   * Emits an {Approval} event indicating the updated allowance.
   *
   * Requirements:
   *
   * - `spender` cannot be the zero address.
   * - `spender` must have allowance for the caller of at least
   * `subtractedValue`.
   */
  function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
    uint256 currentAllowance = _allowances[_msgSender()][spender];
    require(currentAllowance >= subtractedValue, "ERC20: decreased allowance below zero");
    unchecked {
      _approve(_msgSender(), spender, currentAllowance - subtractedValue);
    }

    return true;
  }

  /**
   * @dev Moves `amount` of tokens from `sender` to `recipient`.
   *
   * This internal function is equivalent to {transfer}, and can be used to
   * e.g. implement automatic token fees, slashing mechanisms, etc.
   *
   * Emits a {Transfer} event.
   *
   * Requirements:
   *
   * - `sender` cannot be the zero address.
   * - `recipient` cannot be the zero address.
   * - `sender` must have a balance of at least `amount`.
   */
  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal virtual {
    require(sender != address(0), "ERC20: transfer from the zero address");
    require(recipient != address(0), "ERC20: transfer to the zero address");
    require(amount > 0, "Transfer amount must be greater than zero");

    if (
      !_isPair[sender] &&
      sender != address(this) &&
      sender != owner() &&
      recipient != address(this) &&
      recipient != owner()
    ) {
      require(
        block.timestamp >= _userLastTransactionTime[msg.sender] + 10,
        "time between transfers should be 10 seconds"
      );
      _userLastTransactionTime[sender] = block.timestamp;
    }

    uint256 senderBalance = _balances[sender];
    require(senderBalance >= amount, "ERC20: transfer amount exceeds balance");

    unchecked {
      _balances[sender] = senderBalance - amount;
    }
    if (_isExcludedFromFee[sender] || _isExcludedFromFee[recipient]) {
      _balances[recipient] += amount;

      emit Transfer(sender, recipient, amount);
    } else {
      uint256 devTokenFee = (amount * devTokenFeePercent) / 1000;
      uint256 liquidityFee = (amount * liquidityFeePercent) / 1000;
      _liquidityFeeCount += liquidityFee;
      _balances[address(this)] += liquidityFee;
      uint256 devBNBFee = 0;
      uint256 buyBackFee = 0;
      // buy
      if (_isPair[sender] && recipient != address(routerAddress)) {
        devBNBFee = (amount * devBNBFeePercent) / 1000;
        buyBackFee = (amount * buyBackFeePercent) / 1000;
        _buyBackFeeCount += buyBackFee;
        _devBNBFeeCount += devBNBFee;
      }
      // sell
      else if (_isPair[recipient]) {
        devBNBFee = (amount * devBNBFeePercent) / 1000;
        buyBackFee = (amount * buyBackFeePercent) / 1000;
        _buyBackFeeCount += buyBackFee;
        _devBNBFeeCount += devBNBFee;
        uint256 feeSum = _devBNBFeeCount + _buyBackFeeCount;
        if (feeSum > 0) {
          _balances[address(this)] += feeSum;
          uint256 swappedBNB = swapTokensForEth(feeSum);
          uint256 devBNB = (swappedBNB * _devBNBFeeCount) / feeSum;
          uint256 buyBackBNB = swappedBNB - devBNB;
          Address.sendValue(payable(devAddress), devBNB);
          _buyBackBNBCount += buyBackBNB;
          _buyBackFeeCount = 0;
          _devBNBFeeCount = 0;
        }
      } else {
        // Not buy and not sell
        if (!inSwapAndLiquify && _liquidityFeeCount >= _minNumOfTokensToAddLiquidity) {
          swapAndLiquify(_liquidityFeeCount);
          _liquidityFeeCount = 0;
        }
        if (_buyBackBNBCount > 0.1 ether && !inSwapAndLiquify) {
          _buyBackAndBurn(_buyBackBNBCount);
          _buyBackBNBCount = 0;
        }
      }
      uint256 recipientAmount = (amount - devTokenFee - liquidityFee - devBNBFee - buyBackFee);
      _balances[recipient] += recipientAmount;
      if (devTokenFee > 0) {
        _balances[devAddress] += devTokenFee;
        emit Transfer(sender, devAddress, devTokenFee);
      }
      emit Transfer(sender, recipient, recipientAmount);
    }
  }

  function _buyBackAndBurn(uint256 amount) private lockTheSwap {
    // generate the uniswap pair path of token -> weth
    address[] memory path = new address[](2);
    path[0] = routerAddress.WETH();
    path[1] = address(this);

    // make the swap
    routerAddress.swapExactETHForTokensSupportingFeeOnTransferTokens{ value: amount }(
      0, // accept any amount of Tokens
      path,
      buyBackAddress, // Burn address
      block.timestamp + 10
    );
  }

  function swapAndLiquify(uint256 contractTokenBalance) private lockTheSwap {
    // split the contract balance into halves
    uint256 half = contractTokenBalance / 2;
    uint256 otherHalf = contractTokenBalance - half;

    // swap tokens for ETH
    uint256 newBalance = swapTokensForEth(half); // <- this breaks the ETH -> HATE swap when swap+liquify is triggered

    // add liquidity to uniswap
    addLiquidity(otherHalf, newBalance);

    emit SwapAndLiquify(half, newBalance, otherHalf);
  }

  function swapTokensForEth(uint256 tokenAmount) private returns (uint256) {
    // generate the uniswap pair path of token -> weth
    address[] memory path = new address[](2);
    path[0] = address(this);
    path[1] = routerAddress.WETH();

    _approve(address(this), address(routerAddress), tokenAmount);

    // capture the contract's current ETH balance.
    // this is so that we can capture exactly the amount of ETH that the
    // swap creates, and not make the liquidity event include any ETH that
    // has been manually sent to the contract
    uint256 initialBalance = address(this).balance;

    // make the swap
    routerAddress.swapExactTokensForETHSupportingFeeOnTransferTokens(
      tokenAmount,
      0, // accept any amount of ETH
      path,
      address(this),
      block.timestamp
    );

    // how much ETH did we just swap into?
    return address(this).balance - initialBalance;
  }

  function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
    // approve token transfer to cover all possible scenarios
    _approve(address(this), address(routerAddress), tokenAmount);

    // add the liquidity
    routerAddress.addLiquidityETH{ value: ethAmount }(
      address(this),
      tokenAmount,
      0, // slippage is unavoidable
      0, // slippage is unavoidable
      owner(),
      block.timestamp
    );
  }

  /**
   * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
   *
   * This internal function is equivalent to `approve`, and can be used to
   * e.g. set automatic allowances for certain subsystems, etc.
   *
   * Emits an {Approval} event.
   *
   * Requirements:
   *
   * - `owner` cannot be the zero address.
   * - `spender` cannot be the zero address.
   */
  function _approve(
    address tokenOwner,
    address spender,
    uint256 amount
  ) internal virtual {
    require(tokenOwner != address(0), "ERC20: approve from the zero address");
    require(spender != address(0), "ERC20: approve to the zero address");

    _allowances[tokenOwner][spender] = amount;
    emit Approval(tokenOwner, spender, amount);
  }

  function excludeFromFee(address account) public onlyOwner {
    _isExcludedFromFee[account] = true;
  }

  function includeInFee(address account) public onlyOwner {
    _isExcludedFromFee[account] = false;
  }

  function changeRouterAddress(IUniswapV2Router02 newRouterAddress) public onlyOwner {
    require(routerAddress != newRouterAddress, "Address already setted");
    routerAddress = newRouterAddress;
  }

  function changeDevAddress(address newDevAddress) public onlyOwner {
    require(devAddress != newDevAddress, "Address already setted");
    devAddress = newDevAddress;
  }

  function changeCoreTeamAddress(address newCoreTeamAddress) public onlyOwner {
    require(coreTeamAddress != newCoreTeamAddress, "Address already setted");
    coreTeamAddress = newCoreTeamAddress;
  }

  function changeAdvisorsAddress(address newAdvisorsAddress) public onlyOwner {
    require(advisorsAddress != newAdvisorsAddress, "Address already setted");
    advisorsAddress = newAdvisorsAddress;
  }

  function changeReserveAddress(address newReserveAddress) public onlyOwner {
    require(reserveAddress != newReserveAddress, "Address already setted");
    reserveAddress = newReserveAddress;
  }

  function changeStakingAddress(address newStakingAddress) public onlyOwner {
    require(stakingAddress != newStakingAddress, "Address already setted");
    stakingAddress = newStakingAddress;
  }

  function changeEcosystemAddress(address newEcosystemAddress) public onlyOwner {
    require(ecosystemAddress != newEcosystemAddress, "Address already setted");
    ecosystemAddress = newEcosystemAddress;
  }

  function changePlayToEarnAddress(address newPlayToEarnAddress) public onlyOwner {
    require(playToEarnAddress != newPlayToEarnAddress, "Address already setted");
    playToEarnAddress = newPlayToEarnAddress;
  }

  function changeDevTokenFeePercent(uint16 newDevTokenFeePercent) public onlyOwner {
    require(devTokenFeePercent != newDevTokenFeePercent, "fee already setted");
    devTokenFeePercent = newDevTokenFeePercent;
  }

  function changeDevBNBFeePercent(uint16 newDevBNBFeePercent) public onlyOwner {
    require(devBNBFeePercent != newDevBNBFeePercent, "fee already setted");
    devBNBFeePercent = newDevBNBFeePercent;
  }

  function changeBuyBackFeePercent(uint16 newBuyBackFeePercent) public onlyOwner {
    require(buyBackFeePercent != newBuyBackFeePercent, "fee already setted");
    buyBackFeePercent = newBuyBackFeePercent;
  }

  function changeLiquidityFeePercent(uint16 newLiquidityFeePercent) public onlyOwner {
    require(liquidityFeePercent != newLiquidityFeePercent, "fee already setted");
    liquidityFeePercent = newLiquidityFeePercent;
  }

  function addPairAddress(address pairAddress) public onlyOwner {
    require(!_isPair[pairAddress], "address is already added");
    _isPair[pairAddress] = true;
  }

  function removePairAddress(address pairAddress) public onlyOwner {
    require(_isPair[pairAddress], "address is already removed");
    _isPair[pairAddress] = false;
  }

  /** @dev Creates `amount` tokens and assigns them to `account`, increasing
   * the total supply.
   *
   * Emits a {Transfer} event with `from` set to the zero address.
   *
   * Requirements:
   *
   * - `account` cannot be the zero address.
   */
  function _mint(address account, uint256 amount) internal virtual {
    require(account != address(0), "ERC20: mint to the zero address");

    _totalSupply += amount;
    _balances[account] += amount;
    emit Transfer(address(0), account, amount);
  }

  function coreTeamUnlock() public {
    uint256 monthCount = (block.timestamp - contractCreationTime) / MONTH;
    require(monthCount >= 13, "it is too soon to unlock");
    if (monthCount > 36) monthCount = 36;
    uint256 unlockCount = (coreTeamUnlockPerMonth[monthCount - 13] - coreTeamUnlockedTillNow) * TEN_POW_8;
    require(unlockCount > 0, "Now there is no token to unlock");
    _mint(coreTeamAddress, unlockCount);
    coreTeamUnlockedTillNow = coreTeamUnlockPerMonth[monthCount - 13];
  }

  function advisorsUnlock() public {
    uint256 monthCount = (block.timestamp - contractCreationTime) / MONTH;
    require(monthCount >= 2, "it is too soon to unlock");
    if (monthCount > 36) monthCount = 36;
    uint256 unlockCount = (advisorsUnlockPerMonth[monthCount - 2] - advisorsUnlockedTillNow) * TEN_POW_8;
    require(unlockCount > 0, "Now there is no token to unlock");
    _mint(advisorsAddress, unlockCount);
    advisorsUnlockedTillNow = advisorsUnlockPerMonth[monthCount - 2];
  }

  function reserveUnlock() public {
    uint256 monthCount = (block.timestamp - contractCreationTime) / MONTH;
    require(monthCount >= 24, "it is too soon to unlock");
    if (monthCount > 60) monthCount = 60;
    uint256 unlockCount = (reserveUnlockPerMonth[monthCount - 24] - reserveUnlockedTillNow) * TEN_POW_8;
    require(unlockCount > 0, "Now there is no token to unlock");
    _mint(reserveAddress, unlockCount);
    reserveUnlockedTillNow = reserveUnlockPerMonth[monthCount - 24];
  }

  function stakingUnlock() public {
    uint256 monthCount = (block.timestamp - contractCreationTime) / MONTH;
    require(monthCount >= 2, "it is too soon to unlock");
    if (monthCount > 60) monthCount = 60;
    uint256 unlockCount = (stakingUnlockPerMonth[monthCount - 2] - stakingUnlockedTillNow) * TEN_POW_8;
    require(unlockCount > 0, "Now there is no token to unlock");
    _mint(stakingAddress, unlockCount);
    stakingUnlockedTillNow = stakingUnlockPerMonth[monthCount - 2];
  }

  function ecosystemUnlock() public {
    uint256 monthCount = (block.timestamp - contractCreationTime) / MONTH;
    require(monthCount >= 2, "it is too soon to unlock");
    if (monthCount > 45) monthCount = 45;
    uint256 unlockCount = (ecosystemUnlockPerMonth[monthCount - 2] - ecosystemUnlockedTillNow) * TEN_POW_8;
    require(unlockCount > 0, "Now there is no token to unlock");
    _mint(ecosystemAddress, unlockCount);
    ecosystemUnlockedTillNow = ecosystemUnlockPerMonth[monthCount - 2];
  }

  function playToEarnUnlock() public {
    uint256 monthCount = (block.timestamp - contractCreationTime) / MONTH;
    require(monthCount >= 2, "it is too soon to unlock");
    if (monthCount > 60) monthCount = 60;
    uint256 unlockCount = (playToEarnUnlockPerMonth[monthCount - 2] - playToEarnUnlockedTillNow) * TEN_POW_8;
    require(unlockCount > 0, "Now there is no token to unlock");
    _mint(playToEarnAddress, unlockCount);
    playToEarnUnlockedTillNow = playToEarnUnlockPerMonth[monthCount - 2];
  }

  function changeMinNumberOfTokensToAddLiquidity(uint256 amount) public onlyOwner {
    _minNumOfTokensToAddLiquidity = amount;
  }

  function changeBuyBackAddress(address buyBackAddress_) public onlyOwner {
    require(buyBackAddress != buyBackAddress_, "Address already setted");
    buyBackAddress = buyBackAddress_;
  }

  // solhint-disable-next-line no-empty-blocks
  receive() external payable {}
}
