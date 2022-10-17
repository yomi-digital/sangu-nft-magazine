import { Metadata, MetadataAttribute } from "../models";

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { Readable } = require("stream");

function uploadFile(content, filename): Promise<string | boolean> {
  return new Promise<string | boolean>(async (response) => {
    if (process.env.PINATA_JWT !== undefined) {
      try {
        console.log("Uploading " + filename + "..");
        const stream = Readable.from(content);
        const formData = new FormData();
        formData.append("file", stream, { filename: filename });
        formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));
        formData.append(
          "pinataMetadata",
          JSON.stringify({ name: "[NIFTYZ] " + filename })
        );
        const uploaded = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            maxBodyLength: "Infinity",
            headers: {
              "Content-Type":
                "multipart/form-data; boundary=" + formData._boundary,
              Authorization: "Bearer " + process.env.PINATA_JWT,
            },
          }
        );
        if (uploaded.data.IpfsHash !== undefined) {
          response(uploaded.data.IpfsHash);
        }
      } catch (e) {
        console.log("Pinata upload failed");
        response(false);
      }
    } else {
      console.log("Pinata is not configured.");
      response(false);
    }
  });
}

function pinCid(cid) {
  return new Promise(async (response) => {
    if (process.env.PINATA_JWT !== undefined) {
      try {
        console.log("Pinning " + cid + "..");
        const pinned = await axios.post(
          "https://api.pinata.cloud/pinning/pinByHash",
          {
            hashToPin: cid,
            pinataMetadata: { name: "[NIFTYZ] " + cid },
          },
          {
            headers: {
              Authorization: "Bearer " + process.env.PINATA_JWT,
            },
          }
        );
        response(pinned.data);
      } catch (e) {
        console.log(e);
        console.log("Pinata upload failed");
        response(false);
      }
    } else {
      console.log("Pinata is not configured.");
      response(false);
    }
  });
}

const uploadNFT = (
  ipfs_file: string,
  external_id: string,
  title: string,
  description: string,
  attributes: MetadataAttribute[],
  other?: Object
) => {
  return new Promise(async (response) => {
    if (process.env.PINATA_JWT !== undefined) {
      try {
        const nftcontent: Metadata = {
          name: title,
          description: description,
          image: ipfs_file,
          external_url:
            process.env?.FRONTEND_URL + "/#/singleNft/" + external_id,
          attributes,
          ...other,
        };

        console.log("NFT validated, uploading to Pinata...");
        const nft = <any>(
          await uploadFile(
            Buffer.from(JSON.stringify(nftcontent)),
            "NFT-" + ipfs_file.replace(/[^a-zA-Z ]/g, "") + ".json"
          )
        );
        response({
          ipfs: nft,
          metadata: nftcontent,
        });
      } catch (e) {
        console.log("Pinata upload failed");
        response(false);
      }
    } else {
      console.log("Pinata is not configured.");
      response(false);
    }
  });
};

export { uploadNFT, uploadFile, pinCid };
