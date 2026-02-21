// SPDX-License-Identifier: MIT

pragma solidity ^0.8.30;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint minimum) public{
        address new_Campaign = address(new Campaign(minimum, msg.sender));

        deployedCampaigns.push(new_Campaign);
    }

    function getDeployedCampaigns() view public returns(address[] memory){
        return deployedCampaigns;
    }
}

contract Campaign {
    struct Request {
        string description;
        uint256 value;
        address payable recipient;
        bool complete;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    Request[] public requests;
    address public manager;
    uint256 public minimumContribution;
    mapping(address => bool) public approvers;
    uint public approversCount = 0;

    modifier restricted() {
        require(msg.sender == manager, "Only manager can Perform this task");
        _;
    }

    constructor(uint256 minimum, address creator) {
        manager = creator;
        minimumContribution = minimum;
    }

    function contribute() public payable {
        require(
            msg.value > minimumContribution,
            "Amount is less than minimum Contribution"
        );

        approvers[msg.sender] = true;
        approversCount++;
    }

    function createRequest(
        string memory description,
        uint256 value,
        address payable recipient
    ) public restricted {
        
        requests.push(); // push a blank Request to grow the array
        Request storage newRequest = requests[requests.length - 1];

        newRequest.description = description;
        newRequest.value = value;
        newRequest.recipient = recipient;
        newRequest.complete = false;
        newRequest.approvalCount = 0;

    }

    function approveRequest(uint256 index) public {
        Request storage request = requests[index];

        require(
            approvers[msg.sender] == true,
            "You have to first contribute to vote"
        );
        require(
            request.approvals[msg.sender] == false,
            "You have already voted"
        );

        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finalizeRequest(uint index) public payable restricted {
        Request storage request = requests[index];

        require( request.approvalCount > (approversCount / 2), "Not enough approvers have voted");
        require( request.complete == false, "Request is already completed");

        request.recipient.transfer(request.value);

        request.complete = true;
    }

    function getRequestsCount() public view returns (uint) {
        return requests.length;
    }


}
