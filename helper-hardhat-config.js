const networkConfig = {
    /**hardhat */
    31337: {
        /**addresses from ethereum mainnet - to be used with forked mainnet */
        daiTokenAddress: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        wethTokenAddress: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        daiPriceFeed:
            "0x773616E4d11A78F511299002da57A0a94577F1f4" /**https://docs.chain.link/docs/data-feeds/price-feeds/addresses/ */,
        lendingPoolAddressesProvider:
            "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5" /**https://docs.aave.com/developers/v/2.0/deployed-contracts/deployed-contracts */,
    },
};

module.exports = { networkConfig };
