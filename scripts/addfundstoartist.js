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

    const minter = wallet.address
    const nfts = 5
    const magazine_metadata = "MAGAZINE_IPFS_HASH"
    const id = await contract._editionToId(magazine_metadata)
    const userBalanceinitial = await provider.getBalance(minter)
    console.log("Minter balance is", userBalanceinitial.toString())





    for (let i = 0; i < nfts; i++) {
        const artistAddy = await contract.returnArtistAddy(id, i)
        let receiverAddress = artistAddy
        let amountInEther = '0.01'
        let tx = {
            to: receiverAddress,
            // Convert currency unit from ether to wei
            value: ethers.utils.parseEther(amountInEther)
        }
    
        await wallet.sendTransaction(tx)
            .then((txObj) => {
                console.log('txHash', txObj.hash)
            })
    
        const newArtistBalance = await provider.getBalance(artistAddy)
        console.log("After transaction artist with address %s has balance of %s", receiverAddress.toString(), newArtistBalance.toString())
    }



    const userBalancepost = await provider.getBalance(minter)
    console.log("Minter balance after transfer is", userBalancepost.toString())




}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
