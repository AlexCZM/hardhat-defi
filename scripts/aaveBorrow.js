const { ethers, getNamedAccounts, network } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth.js");
const { networkConfig } = require("../helper-hardhat-config");

const DAI_ADDRESS = "";
//const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

async function main() {
    await getWeth();
    const deployer = (await getNamedAccounts()).deployer;

    //landing pool addresses provider :0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    const lendingPool = await getLendingPool(deployer);
    const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    //deposit
    await approveErc20(
        networkConfig[network.config.chainId].wethTokenAddress,
        lendingPool.address,
        deployer,
        AMOUNT
    );
    await lendingPool.deposit(
        networkConfig[network.config.chainId].wethTokenAddress,
        AMOUNT,
        deployer,
        0
    );
    console.log(ethers.utils.formatEther(AMOUNT), " WETH deposit successful");

    //borrow
    const { availableBorrowsETH } = await printUserAccountData(
        "Before loan",
        lendingPool,
        deployer
    );
    const daiPrice = await getDaiPrice(deployer);
    const amountDaiToBorrow =
        availableBorrowsETH.toString() / daiPrice.toNumber();
    console.log(``);
    console.log(`Borrowing ${amountDaiToBorrow} DAI...`);
    const amountDaiToBorrowWei = ethers.utils.parseEther(
        amountDaiToBorrow.toString()
    );
    await lendingPool.borrow(
        networkConfig[network.config.chainId].daiTokenAddress,
        amountDaiToBorrowWei,
        1,
        0,
        deployer
    );
    await printUserAccountData("After loan was taken", lendingPool, deployer);

    //REPAY the  loan
    await approveErc20(
        networkConfig[network.config.chainId].daiTokenAddress,
        lendingPool.address,
        deployer,
        amountDaiToBorrowWei
    );

    await lendingPool.repay(
        networkConfig[network.config.chainId].daiTokenAddress,
        amountDaiToBorrowWei,
        1,
        deployer
    );
    await printUserAccountData(
        "Initial loan was repaid",
        lendingPool,
        deployer
    );
}

async function getDaiPrice(account) {
    //0x773616E4d11A78F511299002da57A0a94577F1f4 dai/eth contract
    const priceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[network.config.chainId].daiPriceFeed,
        account
    );
    const price = (await priceFeed.latestRoundData())[1];
    //the price is in wei
    console.log(`The DAI/ETH price is ${ethers.utils.formatEther(price)}`);
    return price;
}

async function getLendingPool(account) {
    const iLendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        networkConfig[network.config.chainId].lendingPoolAddressesProvider,
        account
    );
    /*The latest (lendingPool) contract addresses should be retrieved 
    from this contract by making the appropriate calls. */
    const lendingPoolAddress =
        await iLendingPoolAddressesProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    );
    return lendingPool;
}

async function approveErc20(tokenAddress, spender, account, amount) {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        tokenAddress,
        account
    );
    const txResponse = await erc20Token.approve(spender, amount);
    await txResponse.wait(1);
    console.log("ERC20 allowance approved");
}

async function printUserAccountData(message, lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(account);
    console.log(
        `${message}:
        You have: ${ethers.utils.formatEther(
            totalCollateralETH
        )} worth of ETH deposited.
        You have: ${ethers.utils.formatEther(
            totalDebtETH
        )} worth of ETH borrowed
        You can borrow: ${ethers.utils.formatEther(
            availableBorrowsETH
        )} worth of ETH`
    );
    return { totalCollateralETH, totalDebtETH, availableBorrowsETH };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
