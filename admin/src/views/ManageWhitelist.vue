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
            <h3 class="mb-5">Fix whitelist merkle root</h3>
            <select v-model="listType">
              <option :value="1">Presale</option>
              <option :value="0">Free</option></select
            ><br /><br />
            <textarea
              class="text-center"
              placeholder="Adding addresses separated by comma"
              style="width: 100%; height: 300px"
              v-model="whitelist"
            /><br /><br />
            <div class="btn mint-btn" @click="addToWhitelist()">
              Add addresses to Whitelist
            </div>
            <div v-if="storedlistFree">
              <hr>
              Stored whitelist for free minting is:<br />
              {{ storedlistFree }}
            </div>
            <div v-if="storedlistPre">
              <hr>
              Stored whitelist for pre minting is:<br />
              {{ storedlistPre }}
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
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const axios = require("axios");

export default {
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
      whitelist: "",
      storedlistPre: [],
      storedlistFree: [],
      listType: 0
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
          }
        }
      }
    },
    async addToWhitelist() {
      const app = this;
      try {
        app.printLog("Trying to create whitelist");
        const nftContract = new app.web3.eth.Contract(app.abi, app.contract);
        let toWhitelist = [];
        let toParse = app.whitelist.split(",");
        for (let k in toParse) {
          const address = toParse[k].trim();
          if (address.indexOf("0x") === 0) {
            toWhitelist.push(address);
          }
        }
        app.printLog("Addressess added are:", toWhitelist);
        let leaves = await toWhitelist.map((x) => keccak256(x));
        let tree = await new MerkleTree(leaves, keccak256, {
          sortPairs: true,
        });
        let root = tree.getRoot().toString("hex");
        const receipt = await nftContract.methods
          .fixMerkleRoot("0x" + root, app.listType)
          .send({ from: app.account, gasPrice: "50000000000" })
          .on("transactionHash", (pending) => {
            app.printLog("Pending transaction:", pending);
          });
        localStorage.setItem("whitelist_" + app.listType, app.whitelist);
        app.printLog("Addresses added correctly", JSON.stringify(receipt));
      } catch (e) {
        app.printLog("Adding in whitelist failed", JSON.stringify(e.message));
      }
    },
  },
  mounted() {
    this.connect();
    /* Specific for test */
    const stored_presale = localStorage.getItem('whitelist_1')
    if(stored_presale !== null){
      this.storedlistPre = stored_presale.split(',')
    }
    const stored_free = localStorage.getItem('whitelist_0')
    if(stored_free !== null){
      this.storedlistFree = stored_free.split(',')
    }
  },
};
</script>
