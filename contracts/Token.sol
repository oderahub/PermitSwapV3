// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@rari-capital/solmate/src/tokens/ERC20.sol";


contract Token is ERC20 {

    constructor() ERC20("Chidera", "CHID", 18) {}


    function mint(address _to, uint256 _amount) external {
        _mint(_to, _amount);
    }
}
