// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./IERC721UMi.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title SanguMagazine
/// @notice An ERC1155 contract with IPFS support representing a magazine.
///     Inside the magazine there are a number of nfts that were created by different artists.
///     Proceeds of the magazine are split between the contract owner (50%) and the artists.

contract SanguMagazine is ERC1155, ReentrancyGuard, Ownable {
    /// @notice Address of minter
    address public _minterAddress;

    /// @notice metadata URI
    string public metadata_uri;

    /// @notice Array to keep track of magazine editions
    uint256[] public _editions;

    /// @notice nonce for the creation of magazine id
    uint256 nonce = 0;

    /// @notice mappings to track magazine edition, max supply, pricing
    mapping(uint256 => string) public _idToEdition;
    mapping(string => uint256) public _editionToId;
    mapping(uint256 => uint256) public _max_supplies;
    mapping(uint256 => uint256) public _prices;

    /// @notice Track how many ERC1155 magazines have been minted
    mapping(uint256 => uint256) public _minted;

    /// @notice track balances of contract owner and artits
    mapping(address => uint256) public vault;

    /// @notice tracks the artists addresses for the royalties of the magazine edition
    mapping(uint256 => address[]) public editionRoyalties;

    /// @notice maps magazine edition to the string of nfts inside it
    mapping(uint256 => string[]) public _editionNfts;

    /// @notice Instance of Sangu721
    IERC721 private sangu721;

    constructor(address _passAddy) ERC1155("URL_TO_CHANGE/{id}.json") {
        metadata_uri = "URL_TO_CHANGE/{id}.json";
        sangu721 = IERC721(_passAddy);
    }

    /// @notice Admin functions to fix base uri if needed
    function setURI(string memory newuri) public onlyOwner {
        metadata_uri = newuri;
        _setURI(newuri);
    }

    /// @notice Admin functions to set the proxy address
    function setMinterAddress(address newproxy) public onlyOwner {
        _minterAddress = newproxy;
    }

    /// @notice prepares magazine for minting and assigns royalties to artists
    /// @param nfts array of nfts metadata
    /// @param metadata metadata of magazine
    /// @param max_supply maximum amount of magazines to mint
    /// @param price set price per issue
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
            console.log(
                "Creator for nft %s is %s",
                nfts[i],
                sangu721.returnCreatorByNftHash(nfts[i])
            );
            require(
                sangu721.returnCreatorByNftHash(nfts[i]) != address(0),
                "Adding a non-existent nft"
            );
            editionRoyalties[id].push(sangu721.returnCreatorByNftHash(nfts[i]));
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

    /// @notice minting the magazine payable function
    /// @param receiver who receives the magazine
    /// @param metadata metadata input for the magazine
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
        uint256 amount = msg.value / _prices[id];

        require(
            amount > 0,
            "SanguMagazine: Need to send exact amount of tokens"
        );
        bool canMint = true;

        if (_max_supplies[id] > 0) {
            uint256 reached = _minted[id] + amount;
            if (reached > _max_supplies[id]) {
                canMint = false;
                console.log("Max supply reached");
            }
        }

        uint256 ownerRoyalties = msg.value / 2;
        uint256 artistRoyalties = ownerRoyalties / editionRoyalties[id].length;

        vault[owner()] = ownerRoyalties;
        for (uint256 i = 0; i < _editionNfts[id].length; i++) {
            vault[editionRoyalties[id][i]] += artistRoyalties;
        }

        require(canMint, "SanguMagazine: Max supply reached");
        _mint(receiver, id, amount, bytes(""));
        _minted[id] = _minted[id] + amount;
        return id;
    }

    /// @notice to extract the address of the artist, external function
    /// @param _id magazine id
    /// @param _arrayNumber the number in the array you want to pass in
    function returnArtistAddy(uint256 _id, uint256 _arrayNumber)
        external
        view
        returns (address)
    {
        require(
            _arrayNumber <= _editionNfts[_id].length,
            "Trying to return an address outside the permitted array"
        );
        address artistAddy = editionRoyalties[_id][_arrayNumber];
        return artistAddy;
    }

    /// @notice withdraw function to cash in for owner and artists
    function withdraw() external nonReentrant {
        uint256 balance = vault[msg.sender];
        require(balance > 0, "Can't withdraw");
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Withdraw to vault failed");
        vault[msg.sender] = 0;
    }
}
