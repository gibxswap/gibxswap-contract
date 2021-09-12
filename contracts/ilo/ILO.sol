// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../core/SafeOwnable.sol';
import 'hardhat/console.sol';

contract ILO is SafeOwnable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct UserInfo {
        uint256 amount;     
        uint256 lastTime;
    }
    struct PoolInfo {
        IERC20 lpToken;           
        uint256 allocPoint;       
        uint256 totalAmount;
    }

    IERC20 public rewardToken;

    PoolInfo[] public poolInfo;
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    uint256 public totalAllocPoint = 0;
    uint256 public startBlock;
    uint256 public endBlock;
    
    function setStartBlock(uint256 blockNumber) public onlyOwner {
        startBlock = blockNumber;
    }

    function setEndBlock(uint256 blockNumber) public onlyOwner {
        endBlock = blockNumber;
    }
    
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Claim(address indexed user, uint256 indexed pid, uint256 amount);

    constructor(
        IERC20 _rewardToken,
        uint256 _startBlock,
        uint256 _endBlock
    ) {
        rewardToken = _rewardToken;
        startBlock = _startBlock;
        endBlock = _endBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function add(uint256 _allocPoint, IERC20 _lpToken) external onlyOwner {
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            totalAmount: 0
        }));
    }

    function pending(uint256 _pid, address _user) public view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 balance = rewardToken.balanceOf(address(this));
        if (balance == 0) {
            return 0; 
        }
        uint256 poolBalance = balance.mul(pool.allocPoint).div(totalAllocPoint);
        if (poolBalance == 0) {
            return 0;
        }
        if (pool.totalAmount == 0) {
            return 0;
        }
        return balance.mul(pool.allocPoint).mul(user.amount).div(totalAllocPoint).div(pool.totalAmount);
    }

    function deposit(uint256 _pid, uint256 _amount) external {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(block.number >= startBlock, "ILO not begin");
        require(block.number <= endBlock, "ILO already finish");
        require(_amount > 0, "illegal amount");

        user.amount = user.amount.add(_amount);
        user.lastTime = block.timestamp;
        pool.totalAmount = pool.totalAmount.add(_amount);
        pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);

        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid) external {
        require(block.number > endBlock, "Can not claim now");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 pendingAmount = pending(_pid, msg.sender);
        if (pendingAmount > 0) {
            safeRewardTransfer(msg.sender, pendingAmount);
            emit Claim(msg.sender, _pid, pendingAmount);
        }
        if (user.amount > 0) {
            uint _amount = user.amount;
            user.amount = 0;
            user.lastTime = block.timestamp;
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
            emit Withdraw(msg.sender, _pid, _amount);
        }
    }

    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 balance = rewardToken.balanceOf(address(this));
        if (_amount > balance) {
            _amount = balance;
        }
        rewardToken.safeTransfer(_to, _amount);
    }

    function ownerWithdraw(address _to, uint256 _amount) public onlyOwner {
        require(block.number < startBlock || block.number >= endBlock + 403200, "ILO already start");  //after a week can withdraw
        safeRewardTransfer(_to, _amount);
    }

}
