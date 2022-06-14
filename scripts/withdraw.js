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
    if (userVault.toString() !== "0") {
        const withdraw = await contract.withdraw({ from: minter })
        console.log("Minter %s withdrew all his/her vault", minter)
    }


    for (let i = 1; i <= nfts; i++) {
        const path = i + 2
        const tokenId = i - 1
        let artistWallet = new ethers.Wallet.fromMnemonic(configs.owner_mnemonic, "m/44'/60'/0'/0/" + path).connect(provider)
        const artistAddy = await contract.returnArtistAddy(id, tokenId)
        if (artistWallet.address.toUpperCase() === artistAddy.toUpperCase()) {
            console.log("Artist address", artistAddy)

            const artistContractInstance = new ethers.Contract(configs.contract_address, ABI.abi, artistWallet)
            const artistVault = await contract.vault(artistAddy)
            if (artistVault.toString() !== "0") {
                const balanceBefore = await artistWallet.getBalance()
                console.log("Balance before is", ethers.utils.formatEther(balanceBefore.toString()))
                const withdrawArtist = await artistContractInstance.withdraw()
                await withdrawArtist.wait()
                const balanceAfter = await artistWallet.getBalance()
                console.log("Balance after is", ethers.utils.formatEther(balanceAfter.toString()))
            } else {
                console.log("Vault is empty.")
            }
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
