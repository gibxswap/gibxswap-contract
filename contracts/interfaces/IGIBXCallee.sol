// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

interface IGIBXCallee {
    function flyCall(address sender, uint amount0, uint amount1, bytes calldata data) external;
}
