// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/proxy/Initializable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '../interfaces/IGIBXFactory.sol';
import '../interfaces/IGIBXRouter.sol';
import '../libraries/GIBXLibrary.sol';
import '../interfaces/IGIBXPair.sol';
import '../core/SafeOwnable.sol';
import 'hardhat/console.sol';

contract GIBXSwapFee is SafeOwnable, Initializable {
    using SafeMath for uint;
    using Address for address;

    address public constant hole = 0x000000000000000000000000000000000000dEaD;
    address public vault;
    IGIBXRouter public router;
    IGIBXFactory public factory;
    address public WETH;
    address public destroyToken;
    address public USDT;
    address public receiver;
    address public caller;

    function initialize(address vault_, IGIBXRouter router_, IGIBXFactory factory_, address WETH_, address destroyToken_, address USDT_, address receiver_, address caller_) external initializer {
        require(address(vault_) != address(0), "illegal vault address");
        require(address(router_) != address(0), "illegal router address");
        require(address(factory_) != address(0), "illegal factory address");
        require(address(WETH_) != address(0), "illegal WETH address");
        require(address(destroyToken_) != address(0), "illegal destroyToken address");
        require(address(USDT_) != address(0), "illegal USDT address");
        require(address(receiver_) != address(0), "illegal receiver address");
        require(address(caller_) != address(0), "illegal caller address");
        vault = vault_;
        router = router_;
        factory = factory_;
        WETH = WETH_;
        destroyToken = destroyToken_;
        USDT = USDT_;
        receiver = receiver_;
        caller = caller_;
    }

    function setCaller(address newCaller_) external onlyOwner {
        require(newCaller_ != address(0), "caller is zero");
        caller = newCaller_;
    }

    function setReceiver(address newReceiver_) external onlyOwner {
        require(newReceiver_ != address(0), "receiver is zero");
        receiver = newReceiver_;
    }

    function setVault(address newVault) external onlyOwner {
        require(newVault != address(0), "vault is zero");
        vault = newVault;
    }

    function transferToVault(address token, uint balance) internal returns (uint balanceRemained) {
        //uint balanceUsed = balance.mul(1).div(2); //1/2
        uint balanceUsed = balance.div(2); //1/2
        balanceRemained = balance.sub(balanceUsed);
        SafeERC20.safeTransfer(IERC20(token), vault, balanceUsed);
    }

    function canRemove(IGIBXPair pair) internal view returns (bool) {
        address token0 = pair.token0();
        address token1 = pair.token1();
        uint balance0 = IERC20(token0).balanceOf(address(pair));
        uint balance1 = IERC20(token1).balanceOf(address(pair));
        uint totalSupply = pair.totalSupply();
        if (totalSupply == 0) {
            return false;
        }
        uint liquidity = pair.balanceOf(address(this));
        uint amount0 = liquidity.mul(balance0) / totalSupply; // using balances ensures pro-rata distribution
        uint amount1 = liquidity.mul(balance1) / totalSupply; // using balances ensures pro-rata distribution
        if (amount0 == 0 || amount1 == 0) {
            return false;
        }
        return true;
    }

    function doHardwork(address[] calldata pairs, uint minAmount) external {
        require(msg.sender == caller, "illegal caller");
        for (uint i = 0; i < pairs.length; i ++) {
            IGIBXPair pair = IGIBXPair(pairs[i]);
            if (pair.token0() != USDT && pair.token1() != USDT) {
                continue;
            }
            uint balance = pair.balanceOf(address(this));
            if (balance == 0) {
                continue;
            }
            if (balance < minAmount) {
                continue;
            }
            if (!canRemove(pair)) {
                continue;
            }
            address token = pair.token0() != USDT ? pair.token0() : pair.token1();
            pair.approve(address(router), balance);
            router.removeLiquidity(
                token,
                USDT,
                balance,
                0,
                0,
                address(this),
                block.timestamp
            );
            address[] memory path = new address[](2);
            path[0] = token;path[1] = USDT;
            balance = IERC20(token).balanceOf(address(this));
            IERC20(token).approve(address(router), balance);
            router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
                balance,
                0,
                path,
                address(this),
                block.timestamp
            );
        }
    }

    function destroyAll() external onlyOwner {
        uint balance = IERC20(USDT).balanceOf(address(this));
        balance = transferToVault(USDT, balance);
        address[] memory path = new address[](2);
        path[0] = USDT;path[1] = destroyToken;
        balance = IERC20(USDT).balanceOf(address(this));
        IERC20(USDT).approve(address(router), balance);
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            balance,
            0,
            path,
            address(this),
            block.timestamp
        );
        balance = IERC20(destroyToken).balanceOf(address(this));
        SafeERC20.safeTransfer(IERC20(destroyToken), hole, balance);
    }

    function transferOut(address token, uint amount) external onlyOwner {
        IERC20 erc20 = IERC20(token);
        uint balance = erc20.balanceOf(address(this));
        if (balance < amount) {
            amount = balance;
        }
        SafeERC20.safeTransfer(erc20, receiver, amount);
    }
}
