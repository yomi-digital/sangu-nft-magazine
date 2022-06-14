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


    for (let i = 1; i < nfts; i++) {
        const path = i + 2
        let artistWallet = new ethers.Wallet.fromMnemonic(configs.owner_mnemonic, "m/44'/60'/0'/0/" + path).connect(provider)
        const artistAddy = await contract.returnArtistAddy(id, i)
        if (artistWallet.address.toUpperCase() === artistAddy.toUpperCase()) {
            console.log("Artist address", artistAddy)

            //const artistWallet = ethers.Wallet(artistAddy)
            const newContract = new ethers.Contract(configs.contract_address, ABI.abi, artistAddy)
            console.log("new contract", newContract)

            const withdrawArtist = await newContract.withdraw()
            console.log(withdrawArtist)
            await withdrawArtist.wait()
            
            const artistBalance = await contract.vault(minter)
            console.log("Artist %s withdrew all his/her vault. Their balance is s%", artistAddy, artistBalance)
        } else {
            console.log("Can't derive address correctly")
        }
    }




    //check vault empty
    //check balance msg sender is correct (.getBalance)


}




main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
