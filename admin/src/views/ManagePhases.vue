<template>
  <div class="structure">
    <Header />
    <div class="container">
      <div class="row">
        <div class="col-12 col-md-8 col-lg-8 pt-5 text-center">
          <div v-if="!account">
            <h3 class="mb-5">You have to connect for testing smart contract</h3>
            <div class="btn mint-btn" @click="connect()">Connect Wallet</div>
          </div>

          <div v-if="account">
            <h3 class="mb-3">Fix Max Amount</h3>
            <input
              class="text-center"
              placeholder="Max buy amount"
              type="text"
              v-model="maxAmount"
            /><br /><br />
            <div class="btn mint-btn" @click="fixMaxAmount()">
              Fix Max amount
            </div>
            <hr />
            <h3 class="mb-3">Fix sale state</h3>
            <select v-model="saleState">
              <option :value="false">Inactive</option>
              <option :value="true">Active</option></select
            ><br /><br />
            <div class="btn mint-btn" @click="fixSaleState()">Fix State</div>
            <hr />
            <h3 class="mb-3">Fix Whitelist state</h3>
            <select v-model="whitelistState">
              <option :value="false">Inactive</option>
              <option :value="true">Active</option></select
            ><br /><br />
            <div class="btn mint-btn" @click="fixWhitelistState()">
              Fix State
            </div>
          </div>
          <div v-if="!collectionRevealed">
            <hr />
            <h3 class="mb-3">Reveal collection</h3>
            <div style="color: #f00">Pay attention, this can't be undone!</div>
            <br />
            <div class="btn mint-btn" @click="revealCollection()">
              Reveal Collection
            </div>
          </div>
          <div v-if="!collectionLocked">
            <hr />
            <h3 class="mb-3">Lock collection</h3>
            <div style="color: #f00">Pay attention, this can't be undone!</div>
            <br />
            <div class="btn mint-btn" @click="lockCollection()">
              Lock Collection
            </div>
          </div>
        </div>
        <div class="console-log col-12 col-md-4 col-lg-4 pt-5 px-4 b-left">
          <h2 class="mb-2">WHAT'S HAPPENING</h2>
          <div id="result"></div>
          <!-- <p v-if="whitelistStopped">Your whitelist is stopped!</p> -->
        </div>
        <!-- END RUN TRIBES -->
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
      saleState: false,
      whitelistState: false,
      maxAmount: "",
      collectionRevealed: false,
      collectionLocked: false,
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
            app.syncState();
            // Specific for Test
          }
        }
      }
    },
    async syncState() {
      const app = this;
      const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
      app.saleState = await nftContract.methods.sale_active().call();
      app.printLog("Sale is active? " + app.saleState);
      app.whitelistState = await nftContract.methods.whitelist_active().call();
      app.printLog("Whitelist is active? " + app.whitelistState);
      app.maxAmount = await nftContract.methods.MAX_AMOUNT().call();
      app.printLog("Max amount is? " + app.maxAmount);
      app.collectionRevealed = await nftContract.methods
        .is_collection_revealed()
        .call();
      app.printLog("Is collection revealed? " + app.collectionRevealed);
      app.collectionLocked = await nftContract.methods
        .is_collection_locked()
        .call();
      app.printLog("Is collection locked? " + app.collectionLocked);
    },
    async fixMaxAmount() {
      const app = this;
      try {
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        const receipt = await nftContract.methods
          .fixMaxAmount(app.maxAmount)
          .send({ from: app.account })
          .on("transactionHash", (tx) => {
            app.printLog("Waiting for confirmation at: " + tx);
          });
        app.printLog(JSON.stringify(receipt));
        app.syncState();
      } catch (e) {
        console.log(e);
        app.printLog("Contract errored: " + e);
      }
    },
    async fixSaleState() {
      const app = this;
      try {
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        const receipt = await nftContract.methods
          .fixSaleState(app.saleState)
          .send({ from: app.account })
          .on("transactionHash", (tx) => {
            app.printLog("Waiting for confirmation at: " + tx);
          });
        app.printLog(JSON.stringify(receipt));
        app.syncState();
      } catch (e) {
        console.log(e);
        app.printLog("Contract errored: " + e);
      }
    },
    async fixWhitelistState() {
      const app = this;
      try {
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        const receipt = await nftContract.methods
          .fixWhitelist(app.whitelistState)
          .send({ from: app.account })
          .on("transactionHash", (tx) => {
            app.printLog("Waiting for confirmation at: " + tx);
          });
        app.printLog(JSON.stringify(receipt));
        app.syncState();
      } catch (e) {
        console.log(e);
        app.printLog("Contract errored: " + e);
      }
    },
    async revealCollection() {
      const app = this;
      try {
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        const receipt = await nftContract.methods
          .revealCollection()
          .send({ from: app.account })
          .on("transactionHash", (tx) => {
            app.printLog("Waiting for confirmation at: " + tx);
          });
        app.printLog(JSON.stringify(receipt));
        app.syncState();
      } catch (e) {
        console.log(e);
        app.printLog("Contract errored: " + e);
      }
    },
    async lockCollection() {
      const app = this;
      try {
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        const receipt = await nftContract.methods
          .lockCollection()
          .send({ from: app.account })
          .on("transactionHash", (tx) => {
            app.printLog("Waiting for confirmation at: " + tx);
          });
        app.printLog(JSON.stringify(receipt));
        app.syncState();
      } catch (e) {
        console.log(e);
        app.printLog("Contract errored: " + e);
      }
    },
  },
  mounted() {
    this.connect();
  },
};
</script>
