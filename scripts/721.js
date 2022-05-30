const hre = require("hardhat");
const fs = require('fs');
const ArtifactContract = require("../sangu721/UMi721.json");
const HDWalletProvider = require("@truffle/hdwallet-provider")
const Contract = require('@truffle/contract');


async function main() {
  const configs = JSON.parse(fs.readFileSync(process.env.CONFIG).toString())
  const Artifact = Contract(ArtifactContract)
  const provider = new HDWalletProvider({
    mnemonic: configs.owner_mnemonic,
    providerOrUrl: configs.provider,
    shareNonce: false
  })
  Artifact.setProvider(provider)
  const instance = await Artifact.new(
    "NAME",
    "TICKER",
    "DESCRIPTION",
    true,
    false,
    false,
    false,
    true,
    "https://BASE_URI",
    0,
    {
      from: configs.owner_address,
      gas: 8000000
    }
  )
  console.log("Created new contract:", instance.address);
  configs.constructor_arguments = [instance.address]
  fs.writeFileSync(process.env.CONFIG, JSON.stringify(configs, null, 4))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
