// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IERC20Permit.sol";


contract ERC20Permit is IERC20Permit  {
    
    ERC20Permit public immutable token;


    constructor(address _token) {
        token = ERC20Permit(_token);    
    }

    function deposit(uint256 _amount) external {
        token.approve(address(this), _amount);
        token.transferFrom(msg.sender, address(this), _amount);
    } 

    function depositWithPermit(
        uint256 _amount,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        token.permit(msg.sender, address(this), _amount, _deadline, v, r, s);
        token.transferFrom(msg.sender, address(this), _amount);
    }

    function transferFrom(address _from, address _to, uint256 _amount) public  returns (bool) {
        return token.transferFrom(_from, _to, _amount);
    }
    
    function approve(address _spender, uint256 _amount) external returns(bool) {
        _spender = address(this);
        token.approve(_spender, _amount);
        return true;
    }

    function permit(
        address _owner,
        address _spender,
        uint256 _value,
        uint256 _deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        token.permit(_owner, _spender, _value, _deadline, v, r, s);
    }
}
