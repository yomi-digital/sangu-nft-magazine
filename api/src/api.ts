import axios from "axios";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as dotenv from 'dotenv' 
import { ethers } from "ethers";
import * as express from 'express' 

const ABI = require("./abi.json");

dotenv.config();
const app = express();
const port = 3000;
const dummy_key = process.env.DUMMY_MNEMONIC ? process.env.DUMMY_MNEMONIC : ''
const contractAddress = process.env.CONTRACT ? process.env.CONTRACT : ''
const pinata_endpoint = process.env.PINATA_ENDPOINT ? process.env.PINATA_ENDPOINT : ''
app.use(express.static("public"));
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Sangu API works");
});

app.get("/nfts/:id", async (req, res) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER);
    const wallet = ethers.Wallet.fromMnemonic(
      dummy_key
    ).connect(provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);
    const tokenURI = await contract.returnTokenURI(req.params.id)
    try {
      let nft = await axios.get(pinata_endpoint+tokenURI).then(res => res.data)
      res.json(nft);
    }
    catch {
      res.json({error: 'Error during retrieving nft'})
    }
  } catch (e) {
    console.log(e.message);
    res.json({});
  }
});

app.use((req, res) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

app.listen(port, () => {
  console.log(`Sangu API listening on port ${port}`);
});