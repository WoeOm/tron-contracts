pragma solidity ^0.4.0;

contract IBancorExchange {

    function buyRING(uint _minReturn) payable public returns (uint);
    function buyRINGInMinRequiedETH(uint _minReturn, address _buyer, uint _errorSpace) payable public returns (uint, uint);
}