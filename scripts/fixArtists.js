const { ethers, utils } = require("ethers");
const fs = require('fs');

async function main() {
    // Read config files
    const configs = JSON.parse(fs.readFileSync(process.env.CONFIG).toString())
    console.log('Read config files')
    // Read ABI to interact with contract
    const ABI = JSON.parse(fs.readFileSync('./artifacts/contracts/' + configs.contract_name + '.sol/' + configs.contract_name + '.json').toString())
    console.log('Read ABI')
    // Setup JSON-RPC provider
    const provider = new ethers.providers.JsonRpcProvider(configs.provider);
    console.log('Setup JSON-RPC provider')
    // Define owner wallet
    const wallet = new ethers.Wallet(configs.owner_key).connect(provider)
    console.log('Define owner wallet')
    // Create contract instance
    const contract = new ethers.Contract(configs.contract_address, ABI.abi, wallet)
    console.log('Create contract instance')

    // Run actual function
    const magazine_metadata = 'QmVXViMtXuJUV5UYg5c43CFH4Vs9RM3PNpxzRNYnmPNd7d'
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
      "0x4683aeF58084FC762ea37fA51323898130178247",

      "0x68F9D9f1709CB77B76A7B1Bd1Cb850f4D1Aa55f1" // deployer address
    ]
    const magazineId = await contract._editionToId(magazine_metadata);
    console.log("Updating artists...")
    await contract.fixArtists(magazineId, artists);
    console.log("Artists updated!")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
