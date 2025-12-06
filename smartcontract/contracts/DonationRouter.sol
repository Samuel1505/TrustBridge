// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface INGORegistry {
    function isVerified(address _ngo) external view returns (bool);
    function recordDonation(address _ngo, address _donor, uint256 _amount) external;
}

contract DonationRouter is ReentrancyGuard {
    
    struct Donation {
        address donor;
        address ngo;
        uint256 amount;
        uint256 timestamp;
        string message;
    }
    
    IERC20 public immutable cUSD;
    INGORegistry public immutable registry;
    
    Donation[] public donations;
    
    mapping(address => uint256) public totalByDonor;
    mapping(address => uint256) public totalByNGO;
    mapping(address => uint256[]) public donationsByDonor;
    mapping(address => uint256[]) public donationsByNGO;
    
    uint256 public totalDonationsAmount;
    uint256 public totalDonationsCount;
    
    event DonationMade(
        uint256 indexed donationId,
        address indexed donor,
        address indexed ngo,
        uint256 amount,
        string message,
        uint256 timestamp
    );
    
    constructor(address _cUSD, address _registry) {
        require(_cUSD != address(0), "Invalid cUSD address");
        require(_registry != address(0), "Invalid registry address");
        
        cUSD = IERC20(_cUSD);
        registry = INGORegistry(_registry);
    }
    
    function donate(
        address _ngo,
        uint256 _amount,
        string memory _message
    ) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(_ngo != address(0), "Invalid NGO address");
        require(registry.isVerified(_ngo), "NGO not verified");
        require(bytes(_message).length <= 200, "Message too long");
        
        require(
            cUSD.transferFrom(msg.sender, _ngo, _amount),
            "cUSD transfer failed"
        );
        
        uint256 donationId = donations.length;
        donations.push(Donation({
            donor: msg.sender,
            ngo: _ngo,
            amount: _amount,
            timestamp: block.timestamp,
            message: _message
        }));
        
        totalByDonor[msg.sender] += _amount;
        totalByNGO[_ngo] += _amount;
        donationsByDonor[msg.sender].push(donationId);
        donationsByNGO[_ngo].push(donationId);
        
        totalDonationsAmount += _amount;
        totalDonationsCount++;
        
        registry.recordDonation(_ngo, msg.sender, _amount);
        
        emit DonationMade(donationId, msg.sender, _ngo, _amount, _message, block.timestamp);
    }
    
    function getDonation(uint256 _donationId) external view returns (Donation memory) {
        require(_donationId < donations.length, "Invalid donation ID");
        return donations[_donationId];
    }
    
    function getRecentDonations(uint256 _count) 
        external 
        view 
        returns (Donation[] memory) 
    {
        uint256 count = _count > donations.length ? donations.length : _count;
        Donation[] memory recent = new Donation[](count);
        
        for (uint256 i = 0; i < count; i++) {
            recent[i] = donations[donations.length - 1 - i];
        }
        
        return recent;
    }
    
    function getDonationsByDonor(address _donor) 
        external 
        view 
        returns (Donation[] memory) 
    {
        uint256[] memory donationIds = donationsByDonor[_donor];
        Donation[] memory donorDonations = new Donation[](donationIds.length);
        
        for (uint256 i = 0; i < donationIds.length; i++) {
            donorDonations[i] = donations[donationIds[i]];
        }
        
        return donorDonations;
    }
    
    function getDonationsByNGO(address _ngo) 
        external 
        view 
        returns (Donation[] memory) 
    {
        uint256[] memory donationIds = donationsByNGO[_ngo];
        Donation[] memory ngoDonations = new Donation[](donationIds.length);
        
        for (uint256 i = 0; i < donationIds.length; i++) {
            ngoDonations[i] = donations[donationIds[i]];
        }
        
        return ngoDonations;
    }
    
    function getTotalDonations() external view returns (uint256) {
        return donations.length;
    }
    
    function getPlatformStats() 
        external 
        view 
        returns (
            uint256 totalAmount,
            uint256 totalCount,
            uint256 avgDonation
        ) 
    {
        totalAmount = totalDonationsAmount;
        totalCount = totalDonationsCount;
        avgDonation = totalCount > 0 ? totalAmount / totalCount : 0;
    }
}