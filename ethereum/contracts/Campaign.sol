// SPDX-License-Identifier: MIT

pragma solidity ^0.8.34;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(
        uint256 minimum,
        string memory title,
        string memory description,
        string memory category,
        uint256 goal,
        string memory tagline,
        string memory creatorName,
        string memory creatorBio,
        string memory coverImage,
        uint256 deadline
    ) public {
        address newCampaign = address(
            new Campaign(
                minimum, msg.sender,
                title, description, category, goal,
                tagline, creatorName, creatorBio, coverImage, deadline
            )
        );
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }
}

contract Campaign {

    // ─── Request struct ───────────────────────────────────────────────────────
    struct Request {
        string description;
        uint256 value;
        address payable recipient;
        bool complete;
        uint256 approvalCount;
        mapping(address => bool) approvals;
        // NEW fields
        string proofLink;      // URL to invoice, quote, or supporting doc
        string requestType;    // e.g. "Equipment", "Marketing", "Development"
        uint256 createdAt;     // block.timestamp when request was created
    }

    // ─── Campaign identity ────────────────────────────────────────────────────
    string public title;
    string public description;
    string public category;
    string public tagline;       // one-line hook shown on cards
    string public creatorName;   // human name of the manager
    string public creatorBio;    // short background / context
    string public coverImage;    // URL or IPFS hash for cover photo
    uint256 public goal;
    uint256 public deadline;     // unix timestamp, 0 = no deadline

    // ─── Core state ───────────────────────────────────────────────────────────
    Request[] public requests;
    address public manager;
    uint256 public minimumContribution;
    mapping(address => bool) public approvers;
    uint256 public approversCount;
    uint256 public createdAt;
    uint256 public lastContributedAt;

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier restricted() {
        require(msg.sender == manager, "Only manager can perform this action");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(
        uint256 minimum,
        address creator,
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _goal,
        string memory _tagline,
        string memory _creatorName,
        string memory _creatorBio,
        string memory _coverImage,
        uint256 _deadline
    ) {
        manager              = creator;
        minimumContribution  = minimum;
        title                = _title;
        description          = _description;
        category             = _category;
        goal                 = _goal;
        tagline              = _tagline;
        creatorName          = _creatorName;
        creatorBio           = _creatorBio;
        coverImage           = _coverImage;
        deadline             = _deadline;
        createdAt            = block.timestamp;
        lastContributedAt    = 0;
    }

    // ─── Contribute ───────────────────────────────────────────────────────────
    function contribute() public payable {
        require(msg.value >= minimumContribution, "Below minimum contribution");

        if (!approvers[msg.sender]) {
            approvers[msg.sender] = true;
            approversCount++;
        }
        lastContributedAt = block.timestamp;
    }

    // ─── Create Request ───────────────────────────────────────────────────────
    function createRequest(
        string memory _description,
        uint256 value,
        address payable recipient,
        string memory _proofLink,
        string memory _requestType
    ) public restricted {
        requests.push();
        Request storage r   = requests[requests.length - 1];
        r.description       = _description;
        r.value             = value;
        r.recipient         = recipient;
        r.complete          = false;
        r.approvalCount     = 0;
        r.proofLink         = _proofLink;
        r.requestType       = _requestType;
        r.createdAt         = block.timestamp;
    }

    // ─── Approve Request ──────────────────────────────────────────────────────
    function approveRequest(uint256 index) public {
        Request storage r = requests[index];
        require(approvers[msg.sender],        "Must contribute first to vote");
        require(msg.sender != manager,        "Manager cannot vote on own requests");
        require(!r.approvals[msg.sender],     "Already voted on this request");

        r.approvals[msg.sender] = true;
        r.approvalCount++;
    }

    // ─── Finalize Request ─────────────────────────────────────────────────────
    function finalizeRequest(uint256 index) public restricted {
        Request storage r = requests[index];
        require(r.approvalCount > (approversCount / 2), "Not enough approvals");
        require(!r.complete,                            "Already completed");

        r.recipient.transfer(r.value);
        r.complete = true;
    }

    // ─── View: request count ──────────────────────────────────────────────────
    function getRequestsCount() public view returns (uint256) {
        return requests.length;
    }

    // ─── View: full campaign summary (single RPC call) ────────────────────────
    function getSummary() public view returns (
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _tagline,
        string memory _creatorName,
        string memory _creatorBio,
        string memory _coverImage,
        uint256 _goal,
        uint256 _deadline,
        uint256 _minimumContribution,
        uint256 _balance,
        uint256 _approversCount,
        uint256 _requestsCount,
        address _manager,
        uint256 _createdAt,
        uint256 _lastContributedAt
    ) {
        return (
            title, description, category, tagline,
            creatorName, creatorBio, coverImage,
            goal, deadline,
            minimumContribution,
            address(this).balance,
            approversCount,
            requests.length,
            manager,
            createdAt,
            lastContributedAt
        );
    }

    // ─── View: single request (includes new fields) ───────────────────────────
    // Solidity can't return a struct with a mapping, so we expose fields manually
    function getRequest(uint256 index) public view returns (
        string memory _description,
        uint256 _value,
        address _recipient,
        bool _complete,
        uint256 _approvalCount,
        string memory _proofLink,
        string memory _requestType,
        uint256 _createdAt
    ) {
        Request storage r = requests[index];
        return (
            r.description,
            r.value,
            r.recipient,
            r.complete,
            r.approvalCount,
            r.proofLink,
            r.requestType,
            r.createdAt
        );
    }
}
