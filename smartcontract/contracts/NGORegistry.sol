// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title NGORegistry
 * @notice Registry for verified NGOs using Self Protocol identity verification
 * @dev Stores NGO data and validates Self Protocol Verifiable Credentials
 */
contract NGORegistry is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct NGO {
        // Identity info (from Self Protocol)
        string founderDID;           // Self Protocol DID
        bytes32 vcProofHash;         // Hash of the VC proof
        
        // Founder attributes (from VC)
        uint8 founderAge;            // Age of founder (must be 18+)
        string founderCountry;       // ISO country code (e.g., "KE")
        
        // NGO info
        address ngoWallet;           // Where donations go
        string ipfsProfile;          // IPFS hash with org details
        
        // Status
        uint256 registeredAt;        // Registration timestamp
        uint256 vcExpiryDate;        // VC expiration (annual renewal)
        bool isActive;               // Can be revoked
        
        // Stats
        uint256 totalDonationsReceived;
        uint256 donorCount;
    }
    
    // State variables
    mapping(address => NGO) public ngoByWallet;
    mapping(string => address) public walletByDID;  // Prevent DID reuse
    mapping(bytes32 => bool) public usedVCProofs;   // Prevent VC reuse
    
    address[] public verifiedNGOs;
    
    // Self Protocol verification
    address public selfProtocolVerifier;
    
    // Anti-spam registration fee
    IERC20 public immutable cUSD;
    uint256 public registrationFee;
    address public feeCollector;
    
    // Community governance
    mapping(address => uint256) public challengeCount;
    mapping(address => mapping(address => bool)) public hasChallenger;
    uint256 public constant CHALLENGE_THRESHOLD = 5;
    
    // Admin
    address public admin;
    
    // Events
    event NGORegistered(
        address indexed ngoWallet,
        string founderDID,
        string country,
        uint256 timestamp
    );
    
    event NGOProfileUpdated(
        address indexed ngoWallet,
        string newIpfsHash
    );
    
    event NGOChallenged(
        address indexed ngo,
        address indexed challenger,
        string reason,
        uint256 challengeCount
    );
    
    event NGORevoked(
        address indexed ngo,
        string reason
    );
    
    event DonationRecorded(
        address indexed ngo,
        address indexed donor,
        uint256 amount
    );
    
    event RegistrationFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event SelfProtocolVerifierUpdated(address oldVerifier, address newVerifier);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }
    
    modifier onlyVerifiedNGO() {
        require(ngoByWallet[msg.sender].isActive, "Not verified NGO");
        require(!isVCExpired(msg.sender), "VC expired");
        _;
    }
    
    constructor(
        address _selfProtocolVerifier,
        address _cUSD,
        address _feeCollector,
        uint256 _registrationFee
    ) {
        require(_selfProtocolVerifier != address(0), "Invalid verifier");
        require(_cUSD != address(0), "Invalid cUSD");
        require(_feeCollector != address(0), "Invalid fee collector");
        
        selfProtocolVerifier = _selfProtocolVerifier;
        cUSD = IERC20(_cUSD);
        feeCollector = _feeCollector;
        registrationFee = _registrationFee;
        admin = msg.sender;
    }
    
    function registerNGO(
        string memory _founderDID,
        bytes32 _vcProofHash,
        bytes memory _vcSignature,
        uint8 _founderAge,
        string memory _founderCountry,
        string memory _ipfsProfile,
        uint256 _vcExpiryDate
    ) external nonReentrant {
        // Validation checks
        require(!ngoByWallet[msg.sender].isActive, "Already registered");
        require(walletByDID[_founderDID] == address(0), "DID already used");
        require(!usedVCProofs[_vcProofHash], "VC already used");
        require(_founderAge >= 18, "Founder must be 18+");
        require(_vcExpiryDate > block.timestamp, "VC expired");
        require(bytes(_founderDID).length > 0, "Invalid DID");
        require(bytes(_ipfsProfile).length > 0, "Invalid profile");
        require(bytes(_founderCountry).length >= 2, "Invalid country code");
        
        // Verify VC signature from Self Protocol
        require(
            _verifyVCSignature(_vcProofHash, _vcSignature),
            "Invalid VC signature"
        );
        
        // Collect registration fee
        require(
            cUSD.transferFrom(msg.sender, feeCollector, registrationFee),
            "Registration fee payment failed"
        );
        
        // Register NGO
        ngoByWallet[msg.sender] = NGO({
            founderDID: _founderDID,
            vcProofHash: _vcProofHash,
            founderAge: _founderAge,
            founderCountry: _founderCountry,
            ngoWallet: msg.sender,
            ipfsProfile: _ipfsProfile,
            registeredAt: block.timestamp,
            vcExpiryDate: _vcExpiryDate,
            isActive: true,
            totalDonationsReceived: 0,
            donorCount: 0
        });
        
        // Mark as used
        walletByDID[_founderDID] = msg.sender;
        usedVCProofs[_vcProofHash] = true;
        
        // Add to verified list
        verifiedNGOs.push(msg.sender);
        
        emit NGORegistered(msg.sender, _founderDID, _founderCountry, block.timestamp);
    }
    
    function _verifyVCSignature(
        bytes32 _vcProofHash,
        bytes memory _vcSignature
    ) internal view returns (bool) {
        bytes32 ethSignedMessageHash = _vcProofHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(_vcSignature);
        return signer == selfProtocolVerifier;
    }
    
    function updateProfile(string memory _newIpfsHash) external onlyVerifiedNGO {
        require(bytes(_newIpfsHash).length > 0, "Invalid IPFS hash");
        ngoByWallet[msg.sender].ipfsProfile = _newIpfsHash;
        emit NGOProfileUpdated(msg.sender, _newIpfsHash);
    }
    
    function recordDonation(
        address _ngo,
        address _donor,
        uint256 _amount
    ) external {
        require(ngoByWallet[_ngo].isActive, "NGO not active");
        require(!isVCExpired(_ngo), "NGO VC expired");
        
        NGO storage ngo = ngoByWallet[_ngo];
        ngo.totalDonationsReceived += _amount;
        ngo.donorCount++;
        
        emit DonationRecorded(_ngo, _donor, _amount);
    }
    
    function challengeNGO(
        address _ngo,
        string memory _reason
    ) external {
        require(ngoByWallet[_ngo].isActive, "NGO not active");
        require(msg.sender != _ngo, "Cannot challenge self");
        require(!hasChallenger[_ngo][msg.sender], "Already challenged");
        require(bytes(_reason).length > 10, "Reason too short");
        
        hasChallenger[_ngo][msg.sender] = true;
        challengeCount[_ngo]++;
        
        emit NGOChallenged(_ngo, msg.sender, _reason, challengeCount[_ngo]);
        
        if (challengeCount[_ngo] >= CHALLENGE_THRESHOLD) {
            ngoByWallet[_ngo].isActive = false;
            emit NGORevoked(_ngo, "Community challenge threshold reached");
        }
    }
    
    function adminRevokeNGO(
        address _ngo,
        string memory _reason
    ) external onlyAdmin {
        require(ngoByWallet[_ngo].isActive, "NGO not active");
        ngoByWallet[_ngo].isActive = false;
        emit NGORevoked(_ngo, _reason);
    }
    
    function isVCExpired(address _ngo) public view returns (bool) {
        return block.timestamp > ngoByWallet[_ngo].vcExpiryDate;
    }
    
    function isVerified(address _ngo) external view returns (bool) {
        return ngoByWallet[_ngo].isActive && !isVCExpired(_ngo);
    }
    
    function getNGO(address _ngo) external view returns (NGO memory) {
        return ngoByWallet[_ngo];
    }
    
    function getAllVerifiedNGOs() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < verifiedNGOs.length; i++) {
            address ngo = verifiedNGOs[i];
            if (ngoByWallet[ngo].isActive && !isVCExpired(ngo)) {
                activeCount++;
            }
        }
        
        address[] memory activeNGOs = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < verifiedNGOs.length; i++) {
            address ngo = verifiedNGOs[i];
            if (ngoByWallet[ngo].isActive && !isVCExpired(ngo)) {
                activeNGOs[index] = ngo;
                index++;
            }
        }
        
        return activeNGOs;
    }
    
    function getNGOsByCountry(string memory _countryCode) 
        external 
        view 
        returns (address[] memory) 
    {
        uint256 count = 0;
        bytes32 countryHash = keccak256(bytes(_countryCode));
        
        for (uint256 i = 0; i < verifiedNGOs.length; i++) {
            address ngo = verifiedNGOs[i];
            if (ngoByWallet[ngo].isActive && 
                !isVCExpired(ngo) &&
                keccak256(bytes(ngoByWallet[ngo].founderCountry)) == countryHash) {
                count++;
            }
        }
        
        address[] memory matchingNGOs = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < verifiedNGOs.length; i++) {
            address ngo = verifiedNGOs[i];
            if (ngoByWallet[ngo].isActive && 
                !isVCExpired(ngo) &&
                keccak256(bytes(ngoByWallet[ngo].founderCountry)) == countryHash) {
                matchingNGOs[index] = ngo;
                index++;
            }
        }
        
        return matchingNGOs;
    }
    
    function getTotalVerifiedNGOs() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < verifiedNGOs.length; i++) {
            if (ngoByWallet[verifiedNGOs[i]].isActive && 
                !isVCExpired(verifiedNGOs[i])) {
                count++;
            }
        }
        return count;
    }
    
    // Admin functions
    function updateRegistrationFee(uint256 _newFee) external onlyAdmin {
        uint256 oldFee = registrationFee;
        registrationFee = _newFee;
        emit RegistrationFeeUpdated(oldFee, _newFee);
    }
    
    function updateFeeCollector(address _newCollector) external onlyAdmin {
        require(_newCollector != address(0), "Invalid address");
        address oldCollector = feeCollector;
        feeCollector = _newCollector;
        emit FeeCollectorUpdated(oldCollector, _newCollector);
    }
    
    function updateSelfProtocolVerifier(address _newVerifier) external onlyAdmin {
        require(_newVerifier != address(0), "Invalid address");
        address oldVerifier = selfProtocolVerifier;
        selfProtocolVerifier = _newVerifier;
        emit SelfProtocolVerifierUpdated(oldVerifier, _newVerifier);
    }
    
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }
}