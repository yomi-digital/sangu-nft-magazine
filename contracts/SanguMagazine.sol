// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./IERC721UMi.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SanguMagazine
 * SanguMagazine - ERC1155 contract with IPFS support
 */
contract SanguMagazine is ERC1155, ReentrancyGuard, Ownable {
    string public metadata_uri;
    mapping(uint256 => string) public _idToEdition;
    mapping(string => uint256) public _editionToId;
    uint256[] public _editions;
    mapping(uint256 => uint256) public _max_supplies;
    mapping(uint256 => uint256) public _prices;
    mapping(uint256 => uint256) public _minted;
    address public _minterAddress;
    uint256 nonce = 0;
    mapping(address => uint256) public vault;
    mapping(uint256 => address[]) public editionRoyalties;
    mapping(uint256 => string[]) public _editionNfts;
    // Instance of Sangu721
    IERC721 private sangu721;

    constructor(address _passAddy) ERC1155("URL_TO_CHANGE/{id}.json") {
        metadata_uri = "URL_TO_CHANGE/{id}.json";
        sangu721 = IERC721(_passAddy);
    }

    /**
     * Admin functions to fix base uri if needed
     */
    function setURI(string memory newuri) public onlyOwner {
        metadata_uri = newuri;
        _setURI(newuri);
    }

    /**
     * Admin functions to set the proxy address
     */
    function setMinterAddress(address newproxy) public onlyOwner {
        _minterAddress = newproxy;
    }

    function prepare(
        string[] memory nfts,
        string memory metadata,
        uint256 max_supply,
        uint256 price
    ) external returns (uint256) {
        require(
            msg.sender == _minterAddress,
            "SanguMagazine: Only the minter address can prepare nfts"
        );
        require(
            _editionToId[metadata] == 0,
            "SanguMagazine: Trying to push same metadata to another id"
        );
        require(
            nfts.length > 0,
            "SanguMagazine: Must add some NFTs from original collection"
        );
        uint256 id = uint256(
            keccak256(
                abi.encodePacked(nonce, msg.sender, blockhash(block.number - 1))
            )
        );
        while (bytes(_idToEdition[id]).length > 0) {
            nonce += 1;
            id = uint256(
                keccak256(
                    abi.encodePacked(
                        nonce,
                        msg.sender,
                        blockhash(block.number - 1)
                    )
                )
            );
        }

        for (uint256 i = 0; i < nfts.length; i++) {
            console.log("Creator for nft %s is %s", nfts[i], sangu721.returnCreatorByNftHash(nfts[i]));
            require(sangu721.returnCreatorByNftHash(nfts[i]) != address(0), "Adding a non-existent nft");
            editionRoyalties[id].push(sangu721.returnCreatorByNftHash(nfts[i]));
            //console.log("editionRoyalties nft %s is %s", nfts[i], editionRoyalties[id]);
        }

        
        _idToEdition[id] = metadata;
        _editionToId[metadata] = id;
        _max_supplies[id] = max_supply;
        _prices[id] = price;
        _editionNfts[id] = nfts;
        _editions.push(id);
        return id;

        
    }

    function tokenCID(uint256 id) public view returns (string memory) {
        return _idToEdition[id];
    }

    function mint(address receiver, string memory metadata)
        public
        payable
        returns (uint256)
    {
        require(
            _editionToId[metadata] > 0,
            "SanguMagazine: Minting a non-existent nft"
        );
        uint256 id = _editionToId[metadata];
        console.log("Minting Edition with id %s", id);
        console.log("Price is %s", _prices[id]);
        console.log("msg.value is %s", msg.value);
        uint256 amount = msg.value / _prices[id];
        console.log("You are buying %s amount of Magazines", amount);
        require(
            amount > 0,
            "SanguMagazine: Need to send exact amount of tokens"
        );
        bool canMint = true;
        console.log("Can mint? %s", canMint);
        console.log("Max supplies is %s", _max_supplies[id]);
        console.log("Already minted: %s", _minted[id]);
        if (_max_supplies[id] > 0) {
            uint256 reached = _minted[id] + amount;
            if (reached > _max_supplies[id]) {
                canMint = false;
                console.log("Max supply reached");
            }
        }
        
        uint256 ownerRoyalties = msg.value / 2;
        console.log("owner royalties: %s", ownerRoyalties);

        vault[owner()] = ownerRoyalties;
        console.log("number of artists: %s", editionRoyalties[id].length);
        uint256 artistRoyalties = ownerRoyalties / editionRoyalties[id].length;
        for (uint256 i = 0; i < _editionNfts[id].length; i++) {
            vault[editionRoyalties[id][i]] += artistRoyalties;
        }
        console.log("artist royalties: %s", artistRoyalties);

        require(canMint, "SanguMagazine: Max supply reached");
        _mint(receiver, id, amount, bytes(""));
        console.log("we minted to %s id number %s, amount s%", receiver, id, amount);
        _minted[id] = _minted[id] + amount;
        return id;
    }

    function returnArtistAddy(uint256 _id, uint256 _arrayNumber) public view returns(address) {
        require(_arrayNumber <= _editionNfts[_id].length, "Trying to return an address outside the permitted array");
        address artistAddy = editionRoyalties[_id][_arrayNumber];
        return artistAddy;
        //console.log("Returning Arist Address %s for %s id array position number %s", artistAddy, _id, _arrayNumber);

    } 

    function withdraw() external nonReentrant {
        uint256 balance = vault[msg.sender];
        require(balance > 0, "Can't withdraw");
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdraw to vault failed");
        vault[msg.sender] = 0;
    }
}
