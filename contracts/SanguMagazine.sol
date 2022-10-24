// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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

    /// @notice editionCounter for the generation of magazine id
    uint256 editionCounter = 0;

    /// @notice Track how many ERC1155 magazines have been minted
    mapping(uint256 => bool) public whitelist_active;

    /// @notice mappings to track magazine edition, max supply, pricing
    mapping(uint256 => string) public _idToEdition;
    mapping(string => uint256) public _editionToId;
    mapping(uint256 => uint256) public _max_supplies;
    mapping(uint256 => uint256) public _prices;

    /// @notice Track how many ERC1155 magazines have been minted
    mapping(uint256 => uint256) public _minted;

    /// @notice track balances of contract owner and artits
    mapping(address => uint256) public vault;

    /// @notice tracks the artists addresses for the royalties each magazine edition
    mapping(uint256 => address[]) public editionRoyalties;

    /// @notice tracks the whitelisted addresses for each edition
    mapping(uint256 => mapping(address => bool)) public whitelists;

    constructor()
        ERC1155("https://raw.githubusercontent.com/yomi-digital/metadata-sangu/main/{id}.json")
    {
        metadata_uri = "https://raw.githubusercontent.com/yomi-digital/metadata-sangu/main/{id}.json";
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
    /// @param metadata metadata of magazine
    /// @param max_supply maximum amount of magazines supply
    /// @param price set price per issue
    /// @param _artists magazine artists addresses
    function prepare(
        string memory metadata,
        uint256 max_supply,
        uint256 price,
        address[] memory _artists
    ) external returns (uint256) {
        require(
            msg.sender == _minterAddress,
            "SanguMagazine: Only the minter address can prepare nfts"
        );
        require(
            _editionToId[metadata] == 0,
            "SanguMagazine: Trying to push same metadata to another id"
        );
        editionCounter++;
        uint256 id = editionCounter;
        editionRoyalties[id] = _artists;
        _idToEdition[id] = metadata;
        _editionToId[metadata] = id;
        _max_supplies[id] = max_supply;
        _prices[id] = price;
        _editions.push(id);
        return id;
    }

    function tokenCID(uint256 id) public view returns (string memory) {
        return _idToEdition[id];
    }

    /// @notice minting the magazine payable function
    /// @param receiver address who receives the magazine
    /// @param metadata metadata input for the magazine
    function mint(address receiver, string memory metadata)
        public
        payable
        returns (uint256)
    {
        uint256 id = _editionToId[metadata];
        require(id > 0, "SanguMagazine: Minting a non-existent nft");
        if (whitelist_active[id]) {
            require(
                whitelists[id][msg.sender] == true,
                "Address isn't whitelisted"
            );
        }

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
            }
        }

        require(canMint, "SanguMagazine: Max supply reached");

        uint256 ownerRoyalties = msg.value / 2;
        uint256 artistRoyalties = ownerRoyalties / editionRoyalties[id].length;

        vault[owner()] = ownerRoyalties;
        for (uint256 i = 0; i < editionRoyalties[id].length; i++) {
            vault[editionRoyalties[id][i]] += artistRoyalties;
        }

        _mint(receiver, id, amount, bytes(""));
        _minted[id] = _minted[id] + amount;

        return id;
    }

    /// @notice function to extract the address of the artist, external function
    /// @param _id magazine id
    /// @param _arrayNumber the number in the array you want to pass in
    function returnArtistAddy(uint256 _id, uint256 _arrayNumber)
        external
        view
        returns (address)
    {
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

    function fixArtists(uint256 _editionId, address[] memory _addresses)
        public
        onlyOwner
    {
        editionRoyalties[_editionId] = _addresses;
    }

    function fixWhitelistStatus(uint256 _editionId, bool _state) public onlyOwner {
        require(keccak256(bytes(_idToEdition[_editionId])) != keccak256(bytes("")), "Invalid edition id");
        whitelist_active[_editionId] = _state;
    }

    function fixEditionWhitelist(
        uint256 _editionId,
        address _address,
        bool _state
    ) public onlyOwner {
        require(keccak256(bytes(_idToEdition[_editionId])) != keccak256(bytes("")), "Invalid edition id");
        whitelists[_editionId][_address] = _state;
    }
}
