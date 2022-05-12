<template>
  <div class="structure">
    <Header />
    <div class="container">
      <div class="row">
        <div class="col-12 col-md-8 col-lg-9 pt-5 text-center">
          <div v-if="!account">
            <h3 class="mb-5">You have to connect for testing smart contract</h3>
            <div class="btn mint-btn" @click="connect()">Connect Wallet</div>
          </div>

          <div v-if="account">
            <div>
              <h3 class="mt-3 mb-0">Fix vault address</h3>
              <br />
              <input
                class="text-center"
                placeholder="Vault address"
                type="text"
                v-model="vault"
              /><br />
              <div class="mt-4 text-center">
                <div class="btn mint-btn" @click="fixVault()">Fix vault</div>
              </div>
            </div>
            <hr />
            <div>
              <h3 class="mt-3 mb-0">Withdraw funds from contract</h3>
              <div class="mt-4 text-center">
                <div class="btn mint-btn" @click="withdraw()">Withdraw</div>
              </div>
            </div>
          </div>
        </div>
        <div class="console-log col-12 col-md-4 col-lg-3 pt-5 px-4 b-left">
          <h2 class="mb-2">WHAT'S HAPPENING</h2>
          <div id="result"></div>
          <!-- <p v-if="whitelistStopped">Your whitelist is stopped!</p> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import Web3 from "web3";
import Web3Modal from "web3modal";
import Header from "@/components/Header.vue";

const ABI = require("../abi.json");

export default {
  name: "StartSale",
  components: {
    Header,
  },
  data() {
    return {
      step: 1,
      networks: {
        ethereum: 1,
        rinkeby: 4,
        polygon: 137,
        mumbai: 80001,
        ganache: 5777,
        hardhat: 31337,
      },
      abi: ABI,
      account: "",
      network: process.env.VUE_APP_NETWORK,
      contract: process.env.VUE_APP_CONTRACT_ADDRESS,
      /** Specific for Test */
      vault: "",
      /** Specific for Test */
    };
  },
  methods: {
    printLog(message, value = "") {
      console.log(message, value);
      document.getElementById("result").innerHTML =
        message +
        " " +
        value +
        "<div class='console-margin'>" +
        document.getElementById("result").innerHTML;
    },
    async connect() {
      const app = this;
      const web3Modal = new Web3Modal({
        cacheProvider: true,
      });
      const provider = await web3Modal.connect();
      app.web3 = await new Web3(provider);
      // Checking if networkId matches
      const netId = await app.web3.eth.net.getId();
      if (parseInt(netId) !== app.networks[app.network]) {
        alert("Switch to " + app.network + " network!");
      } else {
        const accounts = await app.web3.eth.getAccounts();
        app.printLog("Connecting with metamask...");
        if (accounts.length > 0) {
          app.balance = await app.web3.eth.getBalance(accounts[0]);
          app.account = accounts[0];
          app.balance = parseFloat(
            app.web3.utils.fromWei(app.balance, "ether")
          ).toFixed(10);
          app.printLog("Connected as: " + app.account);
          app.printLog("Balance is: " + app.balance);
          app.contractBalance = await app.web3.eth.getBalance(app.contract);
          app.printLog(
            "Contract balance is: " +
              app.web3.utils.fromWei(app.contractBalance, "ether") +
              " ETH"
          );
          const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
          // Checking if owner
          const owner = await nftContract.methods.owner().call();
          app.printLog("Owner is: " + owner);
          if (app.account !== owner) {
            alert("Not the owner!");
            app.account = "";
          } else {
            app.printLog("Confirmed as owner, proceeding.");
            // Specific for Test
            const nftContract = new app.web3.eth.Contract(
              app.abi,
              app.contract
            );
            const vault = await nftContract.methods.vault_address().call();
            app.printLog("Vault address is: " + vault);
            // Specific for Test
          }
        }
      }
    },
    async fixVault() {
      const app = this;
      try {
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        const receipt = await nftContract.methods
          .fixVault(app.vault)
          .send({ from: app.account })
          .on("transactionHash", (tx) => {
            app.printLog("Waiting for confirmation at: ", tx);
          });
        app.printLog(JSON.stringify(receipt));
        const vault = await nftContract.methods.vault_address().call();
        app.printLog("Vault address is: " + vault);
      } catch (e) {
        alert(e.message);
      }
    },
    async withdraw() {
      const app = this;
      try {
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        const receipt = await nftContract.methods
          .withdrawEther()
          .send({ from: app.account })
          .on("transactionHash", (tx) => {
            app.printLog("Waiting for confirmation at: ", tx);
          });
        app.printLog(JSON.stringify(receipt));
      } catch (e) {
        alert(e.message);
      }
    },
  },
  mounted() {
    this.connect();
  },
};
</script>
