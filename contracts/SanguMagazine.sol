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

    /// @notice nonce for the generation of magazine id
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

    /// @notice tracks the artists addresses for the royalties each magazine edition
    mapping(uint256 => address[]) public editionRoyalties;

    /// @notice maps magazine edition to the string of nfts inside it
    mapping(uint256 => string[]) public _editionNfts;

    /// @notice Instance of Sangu721 contract
    IERC721 private sangu721;

    /// @notice artists addresses
    address[] public artists;

    constructor(address _passAddy)
        ERC1155("https://lionfish-app-jtk2f.ondigitalocean.app/nfts/{id}")
    {
        metadata_uri = "https://lionfish-app-jtk2f.ondigitalocean.app/nfts/{id}";
        sangu721 = IERC721(_passAddy);
        artists = [
            0xae96201E1db65FE789F5dAc98632EEEeECF692a0,
            0x6eA45269123997400aE07FE9Bdf849c869941d46,
            0x66506C831c2c26e6960955117D8F816b93B19410,
            0x4D068fBe24bedF42501abB33785A13Dee9cfBF35,
            0x354ca63F04B0a34Fe64e8FE1Bd76953645609486,
            0x6D2De72E1eb12aB2d1D862465cCb8f2efb50E4DA,
            0x493f22A1F3fd1fb5de53D5A7a96d473b7457b977,
            0x8B299e6cceb44D55c20346146E97C668D3c9453d,
            0x32cE49a01BAC4720F839cCe06029E64f330EF1FC,
            0x3335e4949afed6B853D3B948Ad63CBd2e73DAbcF,
            0xC2D0e8cCe2F4e8B5A6c9bdb817CbE649127A9d1a,
            0x8A944DC80e18aB5398CcCc123F8fe13bA47F2957,
            0x4683aeF58084FC762ea37fA51323898130178247
        ];
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
    /// @param max_supply maximum amount of magazines supply
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

        for (uint256 i = 0; i < artists.length; i++) {
            editionRoyalties[id].push(artists[i]);
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
    /// @param receiver address who receives the magazine
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

        require(canMint, "SanguMagazine: Max supply reached");
        
        uint256 ownerRoyalties = msg.value / 2;
        uint256 artistRoyalties = ownerRoyalties / editionRoyalties[id].length;

        vault[owner()] = ownerRoyalties;
        for (uint256 i = 0; i < _editionNfts[id].length; i++) {
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

    function fixArtists(address[] memory _addresses) public onlyOwner{
        artists = _addresses;
    }
}
