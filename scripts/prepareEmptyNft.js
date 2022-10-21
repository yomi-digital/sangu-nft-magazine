const { ethers, utils } = require("ethers");
const fs = require('fs');

async function main() {
    // Read config files
    const configs = JSON.parse(fs.readFileSync(process.env.CONFIG).toString())
    // Read ABI to interact with contract
    const ABI = JSON.parse(fs.readFileSync('./artifacts/contracts/' + configs.contract_name + '.sol/' + configs.contract_name + '.json').toString())
    // Setup JSON-RPC provider
    const provider = new ethers.providers.JsonRpcProvider(configs.provider);
    // Define owner wallet
    const wallet = new ethers.Wallet(configs.owner_key).connect(provider)
    // Create contract instance
    const contract = new ethers.Contract(configs.contract_address, ABI.abi, wallet)

    // Define variables
    const magazine_metadata = "MAGAZINE_IPFS_HASH"
    const max_supply = 500
    const price_eth = "0.1"
    const artists = [
        "0xae96201E1db65FE789F5dAc98632EEEeECF692a0",
        "0x6eA45269123997400aE07FE9Bdf849c869941d46",
        "0x66506C831c2c26e6960955117D8F816b93B19410",
        "0x4D068fBe24bedF42501abB33785A13Dee9cfBF35",
        "0x354ca63F04B0a34Fe64e8FE1Bd76953645609486",
        "0x6D2De72E1eb12aB2d1D862465cCb8f2efb50E4DA",
        "0x493f22A1F3fd1fb5de53D5A7a96d473b7457b977",
        "0x8B299e6cceb44D55c20346146E97C668D3c9453d",
        "0x32cE49a01BAC4720F839cCe06029E64f330EF1FC",
        "0x3335e4949afed6B853D3B948Ad63CBd2e73DAbcF",
        "0xC2D0e8cCe2F4e8B5A6c9bdb817CbE649127A9d1a",
        "0x8A944DC80e18aB5398CcCc123F8fe13bA47F2957",
        "0x4683aeF58084FC762ea37fA51323898130178247"
    ]
    // Calculate wei price
    const price_wei = ethers.utils.parseEther(price_eth)
    console.log('Final price wei', price_wei.toString())
    // Prepare the magazine
    const prepared = await contract.prepare(magazine_metadata, max_supply, price_wei, artists)
    console.log(prepared)
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
