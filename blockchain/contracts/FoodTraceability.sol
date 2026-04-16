// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FoodTraceability {

    // role-based access control has been removed to allow any caller to interact with the contract.
    // Off-chain authentication (JWT, email/password) will determine who is a farmer, distributor, retailer, etc.
    // We keep owner checks on batch-specific operations but no global restrictions.


    // ================= EVENTS =================
    event BatchCreated(string batchId, address owner);
    event BatchPurchased(string parentId, string newBatchId, address buyer);
    event DistributorDetailsAdded(string batchId);
    event RetailerDetailsAdded(string batchId);

    // ================= BATCH STRUCT =================
    struct Batch {
        string batchId;
        string parentBatchId;
        address owner;
        uint totalQuantity;
        uint remainingQuantity;
        string unit;
        uint timestamp;
        bool exists;
        string productPhotoHash; // IPFS hash for product photo
    }

    mapping(string => Batch) public batches;
    mapping(string => string[]) public childBatches;
    string[] public allBatchIds;

    uint private batchCounter;

    // ================= FARMER DATA =================
    struct FarmerData {
        uint farmerId;
        string farmerName;
        string farmAddressFull;
        string gpsCoordinates;
        uint farmAreaInAcres;
        string cropName;
        string cropVariety;
        string seedSource;
        uint sowingDate;
        uint harvestDate;
        string soilHealthStatus;         // NEW: Soil quality info
        string fertilizerUsed;           // NEW: Confirming organic inputs
        string organicCertificationAuthority;
        string certificationNumber;
        uint certificationExpiryDate;
        string farmPhotoHash;            // NEW: IPFS link to farm/crop photo
    }

    mapping(string => FarmerData) public farmerDetails;

    // ================= DISTRIBUTOR DATA =================
    struct DistributorData {
        uint distributorId;
        string companyName;
        string companyAddressFull;
        string transportVehicleNumber;
        string vehicleType;              // NEW: e.g., Refrigerated truck
        uint pickupDate;
        uint deliveryDate;
        int transportTempCelsius;        // NEW: Specific temperature record
        uint humidityLevel;              // NEW: Important for organics
        string warehouseLocation;
        string qualityCheckStatus;
        string distributorLicenseNum;    // NEW: Regulatory field
        string transitPhotoHash;         // NEW: IPFS link to loading/unloading photo
    }

    mapping(string => DistributorData) public distributorDetails;

    // ================= RETAILER DATA =================
    struct RetailerData {
        uint retailerId;
        string storeName;
        string storeAddressFull;
        uint productReceivedDate;
        uint productExpiryDate;
        uint shelfLifeInDays;
        string storageCondition;
        uint retailPricePerKg;
        string availabilityStatus;
        string retailerLicenseNum;       // NEW: Regulatory field
    }

    mapping(string => RetailerData) public retailerDetails;

    // ================= INTERNAL UTILITIES =================
    function _generateBatchId(string memory _parentId) internal returns (string memory) {
        batchCounter++;

        if (bytes(_parentId).length == 0) {
            return string(abi.encodePacked("B", _uintToString(batchCounter)));
        } else {
            return string(abi.encodePacked(_parentId, "-", _uintToString(batchCounter)));
        }
    }

    function _uintToString(uint _i) internal pure returns (string memory) {
        if (_i == 0) return "0";

        uint j = _i;
        uint length;
        while (j != 0) {
            length++;
            j /= 10;
        }

        bytes memory bstr = new bytes(length);
        uint k = length;

        while (_i != 0) {
            k--;
            bstr[k] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }

        return string(bstr);
    }

    // ================= CREATE FARMER BATCH =================
    function createFarmerBatch(
        FarmerData memory _farmerData,
        uint _totalQuantity,
        string memory _unit,
        string memory _productPhotoHash
    ) external returns (string memory) {

        string memory newBatchId = _generateBatchId("");

        batches[newBatchId] = Batch({
            batchId: newBatchId,
            parentBatchId: "",
            owner: msg.sender,
            totalQuantity: _totalQuantity,
            remainingQuantity: _totalQuantity,
            unit: _unit,
            timestamp: block.timestamp,
            exists: true,
            productPhotoHash: _productPhotoHash
        });

        farmerDetails[newBatchId] = _farmerData;
        allBatchIds.push(newBatchId);

        emit BatchCreated(newBatchId, msg.sender);
        return newBatchId;
    }

    // ================= PURCHASE (SPLIT) =================
    function purchaseBatch(string memory _parentId, uint _quantity)
        external
        returns (string memory)
    {
        require(batches[_parentId].exists, "Batch not found");
        require(_quantity > 0, "Invalid quantity");
        require(batches[_parentId].remainingQuantity >= _quantity, "Insufficient quantity");
        // anyone can purchase/split a batch; off‑chain logic should enforce business roles

        batches[_parentId].remainingQuantity -= _quantity;

        string memory newBatchId = _generateBatchId(_parentId);

        batches[newBatchId] = Batch({
            batchId: newBatchId,
            parentBatchId: _parentId,
            owner: msg.sender,
            totalQuantity: _quantity,
            remainingQuantity: _quantity,
            unit: batches[_parentId].unit,
            timestamp: block.timestamp,
            exists: true,
            productPhotoHash: batches[_parentId].productPhotoHash
        });

        childBatches[_parentId].push(newBatchId);
        allBatchIds.push(newBatchId);

        emit BatchPurchased(_parentId, newBatchId, msg.sender);
        return newBatchId;
    }

    // ================= ADD DISTRIBUTOR DETAILS =================
    function addDistributorDetails(
        string memory _batchId,
        DistributorData memory _distributorData
    ) external {

        require(distributorDetails[_batchId].distributorId == 0,"Distributor details already added");
        require(batches[_batchId].owner == msg.sender, "Not batch owner");

        distributorDetails[_batchId] = _distributorData;
        emit DistributorDetailsAdded(_batchId);
    }

    // ================= ADD RETAILER DETAILS =================
    function addRetailerDetails(
        string memory _batchId,
        RetailerData memory _retailerData
    ) external {

        require(batches[_batchId].owner == msg.sender, "Not batch owner");

        retailerDetails[_batchId] = _retailerData;
        emit RetailerDetailsAdded(_batchId);
    }

    // ================= VIEW FUNCTIONS =================
    function getBatch(string memory _batchId)
        external
        view
        returns (Batch memory)
    {
        require(batches[_batchId].exists, "Batch not found");
        return batches[_batchId];
    }

    function getChildBatches(string memory _batchId)
        external
        view
        returns (string[] memory)
    {
        return childBatches[_batchId];
    }

    function getAllBatchIds()
        external
        view
        returns (string[] memory)
    {
        return allBatchIds;
    }
}