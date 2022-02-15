// import { Address } from "cluster";
import { ethers } from "ethers";
import { Pool } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import { abi as IUniswapV3PoolABI } from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";
import { BigNumber } from "ethers";

// user infura endpoint to query chain data from ethereum
const infuraKey = '85fb91c950724c9585adb10ba2145b4c';
const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${infuraKey}`);

// tell Ethers where to look for our chain data
const poolAddress = "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8";

// create interface for the functions of the pool contract that we'll be calling
// const poolImmutablesAbi = [
//   "function factory() external view returns (address)",
//   "function token0() external view returns (address)",
//   "function token1() external view returns (address)",
//   "function fee() external view returns (uint24)",
//   "function tickSpacing() external view returns (int24)",
//   "function maxLiquidityPerTick() external view returns (uint128)",
// ];

// create a new instance of a "Contract" using ethers.js
const poolContract = new ethers.Contract(
  poolAddress,
  IUniswapV3PoolABI,
  provider
);

// create an interface with all the data we're going to return
// interface Immutables {
//   factory: Address;
//   token0: Address;
//   token1: Address;
//   fee: number;
//   tickSpacing: number;
//   maxLiquidityPerTick: number;
// }
interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

// query the EVM using ethers.js
// async function getPoolImmutables() {
//   const PoolImmutables: Immutables = {
//     factory: await poolContract.factory(),
//     token0: await poolContract.token0(),
//     token1: await poolContract.token1(),
//     fee: await poolContract.fee(),
//     tickSpacing: await poolContract.tickSpacing(),
//     maxLiquidityPerTick: await poolContract.maxLiquidityPerTick(),
//   };
//   return PoolImmutables;
// }

// fetch the immutable data
async function getPoolImmutables() {
  const [factory, token0, token1, fee, tickSpacing, maxLiquidityPerTick] = await Promise.all([
    poolContract.factory(),
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.tickSpacing(),
    poolContract.maxLiquidityPerTick(),
  ]);

  const immutables: Immutables = {
    factory,
    token0,
    token1,
    fee,
    tickSpacing,
    maxLiquidityPerTick,
  };
  return immutables;
}

// fetch the state data
async function getPoolState() {
  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  const PoolState: State = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}


// getPoolImmutables().then((result) => {
//   console.log(result);
// });

getPoolState().then((result) => {
  console.log(result);

  console.log(String((result.sqrtPriceX96
    .div(BigNumber.from(2).pow(96)))
    .pow(2)))
});

async function main() {
  const [immutables, state] = await Promise.all([
    getPoolImmutables(),
    getPoolState(),
  ]);

  const TokenA = new Token(3, immutables.token0, 6, 'USDC', 'USD Coin Ex');
  const TokenB = new Token(3, immutables.token1, 18, 'WETH', 'Wrapped Ether Ex');

  const poolExample = new Pool(
    TokenA,
    TokenB,
    immutables.fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    state.tick
  );

  console.log(poolExample);
}

// main();
