// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(
        uint minimum,
        string memory title,
        string memory description,
        string memory category,
        uint256 goal
    ) public {
        address newCampaign = address(
            new Campaign(minimum, msg.sender, title, description, category, goal)
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
    }

    // ─── Campaign identity fields (new) ──────────────────────────────────────
    string public title;
    string public description;
    string public category;
    uint256 public goal;           // fundraising target in wei
    uint256 public createdAt;      // block.timestamp at deployment
    uint256 public lastContributedAt; // block.timestamp of most recent contribution

    // ─── Core campaign state ─────────────────────────────────────────────────
    Request[] public requests;
    address public manager;
    uint256 public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approversCount = 0;

    // ─── Access control ───────────────────────────────────────────────────────
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
        uint256 _goal
    ) {
        manager = creator;
        minimumContribution = minimum;
        title = _title;
        description = _description;
        category = _category;
        goal = _goal;
        createdAt = block.timestamp;
        lastContributedAt = 0; // 0 = no contributions yet
    }

    // ─── Contribute ───────────────────────────────────────────────────────────
    // FIX 1: Changed > to >= so the exact minimum is accepted
    // FIX 2: Guard prevents same address from inflating approversCount
    function contribute() public payable {
        require(
            msg.value >= minimumContribution,
            "Contribution must meet the minimum amount"
        );

        if (!approvers[msg.sender]) {
            approvers[msg.sender] = true;
            approversCount++;
        }

        lastContributedAt = block.timestamp; // track activity
    }

    // ─── Create Request ───────────────────────────────────────────────────────
    function createRequest(
        string memory _description,
        uint256 value,
        address payable recipient
    ) public restricted {
        requests.push();
        Request storage newRequest = requests[requests.length - 1];
        newRequest.description = _description;
        newRequest.value = value;
        newRequest.recipient = recipient;
        newRequest.complete = false;
        newRequest.approvalCount = 0;
    }

    // ─── Approve Request ──────────────────────────────────────────────────────
    // FIX 3: Manager cannot vote on their own requests
    function approveRequest(uint256 index) public {
        Request storage request = requests[index];

        require(
            approvers[msg.sender],
            "You must contribute first to vote"
        );
        require(
            msg.sender != manager,
            "Manager cannot approve their own requests"
        );
        require(
            !request.approvals[msg.sender],
            "You have already voted on this request"
        );

        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    // ─── Finalize Request ─────────────────────────────────────────────────────
    // FIX 4: Removed unnecessary `payable` from function signature
    function finalizeRequest(uint index) public restricted {
        Request storage request = requests[index];

        require(
            request.approvalCount > (approversCount / 2),
            "Not enough approvals to finalize"
        );
        require(
            !request.complete,
            "This request has already been completed"
        );

        request.recipient.transfer(request.value);
        request.complete = true;
    }

    // ─── View helpers ─────────────────────────────────────────────────────────
    function getRequestsCount() public view returns (uint) {
        return requests.length;
    }

    // Returns all campaign summary data in one call (reduces frontend RPC calls)
    function getSummary() public view returns (
        string memory _title,
        string memory _description,
        string memory _category,
        uint256 _goal,
        uint256 _minimumContribution,
        uint256 _balance,
        uint256 _approversCount,
        uint256 _requestsCount,
        address _manager,
        uint256 _createdAt,
        uint256 _lastContributedAt
    ) {
        return (
            title,
            description,
            category,
            goal,
            minimumContribution,
            address(this).balance,
            approversCount,
            requests.length,
            manager,
            createdAt,
            lastContributedAt
        );
    }
}
