const { ethers, getNamedAccounts } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth.js");

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
//const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

async function main() {
    await getWeth();
    const deployer = (await getNamedAccounts()).deployer;

    //landing pool addresses provider :0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    const lendingPool = await getLendingPool(deployer);
    const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    //deposit
    // approveErc20(tokenAddress, spender, account, amount);
    await approveErc20(WETH_ADDRESS, lendingPool.address, deployer, AMOUNT);
    await lendingPool.deposit(WETH_ADDRESS, AMOUNT, deployer, 0);
    console.log(ethers.utils.formatEther(AMOUNT), " WETH deposit successful");

    //borrow
    let totalCollateralETH, totalDebtETH, availableBorrowsETH;
    ({ totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(deployer));
    console.log(
        `Before loan:
        totalCollateralETH: ${totalCollateralETH.toString()}
        totalDebtETH: ${totalDebtETH.toString()}
        availableBorrowsETH: ${availableBorrowsETH.toString()}`
    );
    const daiPrice = await getDaiPrice(deployer);
    const amountDaiToBorrow =
        availableBorrowsETH.toString() / daiPrice.toNumber();
    console.log(`Borrowing ${amountDaiToBorrow} DAI...`);

    await lendingPool.borrow(
        DAI_ADDRESS,
        ethers.utils.parseEther(amountDaiToBorrow.toString()),
        1,
        0,
        deployer
    );

    ({ totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(deployer));
    console.log(
        `After loan:
        totalCollateralETH: ${totalCollateralETH.toString()}
        totalDebtETH: ${totalDebtETH.toString()}
        availableBorrowsETH: ${availableBorrowsETH.toString()}`
    );

    //REPAY the  loan
    await approveErc20(DAI_ADDRESS, lendingPool.address, deployer, AMOUNT);
    await lendingPool.repay(DAI_ADDRESS, AMOUNT, 1, deployer);
    ({ totalCollateralETH, totalDebtETH, availableBorrowsETH } =
        await lendingPool.getUserAccountData(deployer));
    console.log(
        `After  initial loan was repaid:
        totalCollateralETH: ${totalCollateralETH.toString()}
        totalDebtETH: ${totalDebtETH.toString()}
        availableBorrowsETH: ${availableBorrowsETH.toString()}`
    );
}

async function getDaiPrice(account) {
    //0x773616E4d11A78F511299002da57A0a94577F1f4 dai/eth contract
    const priceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616E4d11A78F511299002da57A0a94577F1f4",
        account
    );
    const price = (await priceFeed.latestRoundData())[1];
    //the price is in wei
    console.log(`The DAI/ETH price is ${price.toString()}`);
    return price;
}

async function getLendingPool(account) {
    const iLendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    );
    //The latest (lendingPool) contract addresses should be retrieved from this contract by making the appropriate calls.
    const lendingPoolAddress =
        await iLendingPoolAddressesProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    );
    return lendingPool;
}

async function repay(amount, daiAddress, lendingPool, account) {
    const daiContract = await ethers.getContractAt("");
}

async function approveErc20(tokenAddress, spender, account, amount) {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        tokenAddress,
        account
    );
    await erc20Token.approve(spender, amount);
    console.log("ERC20 allowance approved");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
