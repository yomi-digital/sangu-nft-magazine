const { Web3Provider } = require("@ethersproject/providers");
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

    // TODO: Withdraw

    const minter = wallet.address
    const nfts = 5
    const magazine_metadata = "MAGAZINE_IPFS_HASH"
    const id = await contract._editionToId(magazine_metadata)
    const userVault = await contract.vault(minter)
    const withdraw = await contract.withdraw({ from: minter })
    console.log("Minter %s withdrew all his/her vault", minter)


    //for (let i = 0; i < nfts; i++) {
    const artistAddy = await contract.returnArtistAddy(id, 1)
    console.log("Artist address", artistAddy)

    //const artistWallet = ethers.Wallet(artistAddy)
    const newContract = new ethers.Contract(configs.contract_address, ABI.abi, artistAddy.address)
    console.log("new contract", newContract)

    const withdrawArtist = await newContract.withdraw( {from: artistAddy})
    //.connect(artistAddy.address)
    console.log("Artist %s withdrew all his/her vault. Their balance is s%", artistAddy, artistBalance)


    //}




    //check vault empty
    //check balance msg sender is correct (.getBalance)


}




main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
