import React, { Component} from "react";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import getWeb3 from "./getWeb3.js";
import Tokens from "./build/token.json";
import weth from "./build/weth.json";
import pair from "./build/pair.json";
import aaveLend from "./build/aaveLend.json"
import Uniswap from "./build/uniswap.json"
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import "./App.css";

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();


//import { ChainId, Token, Percent, Fetcher, TokenAmount, Route, Trade, TradeType} from '@uniswap/sdk'

/*const oneinch = new Token(ChainId.KOVAN, 
  '0x32b5f743d06b54a645f351dac79270ce74acc7af', 
  18, 
  )



const weeth = new Token(ChainId.KOVAN, 
  '0xd0a1e359811322d97991e03f863a0c30c2cf029c', 
  18, 
  )

*/
//0x32B5F743D06B54A645f351DAC79270Ce74aCc7af

const tokenContract = "0xf3371032B682bC37200056a0e2F4E13717Ad5D95";
const wethContract = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
const oneinchContract = "0x32b5f743d06b54a645f351dac79270ce74acc7af";
const uniswapContract = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const pairContract = "0x0080a89561F74d4Bb5eC24e12671D3dDB7CE25A1";
const aaveLendContract = "0x9FE532197ad76c5a68961439604C037EB79681F0";
// The minimum ABI to get ERC20 Token balance
let minABI = [
  // balanceOf
  {
    "constant":true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  },
  // decimals
  {
    "constant":true,
    "inputs":[],
    "name":"decimals",
    "outputs":[{"name":"","type":"uint8"}],
    "type":"function"
  }
];

const styles ={
  fontSize: '40px',
}

const styles2 ={
  lineHeight: '2em',
}

const styles3 ={
  color: 'red',
}
class App extends Component {
  constructor(props){
    super(props);

   this.state={
     web3: "",
     accounts: "",
     tokenContract: "",
     wethContract: "",
     uniswapContract: "",
     aaveContract: "",
     GCR: 0,
     minimumTokens: 0,
     numTokens: 0,
     minimumCollateral: 0,
     numC: 0,
     error: "",
     tokenBalance: 0,
     wETHToBuy: 0,
     longAmt: 0,
     estimate: 0,
     supply: 0,
     metamaskBalance: 0,
     metamaskWethBalance: 0,
     deposit: 0,
     currEthPrice: 0,
     currOneInchPrice: 0,
     currEthOneInchRatio: 0,
     tokensMinted: 0,
     collateralPosition: 0,
     minCollateral: 0
   }

  }



  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const instance = new web3.eth.Contract(
        Tokens.abi,
        tokenContract,
      );

      //const pair = Pair.getAddress(oneinch, WETH[oneinch.chainId]);
     /* var pair = await Fetcher.fetchPairData(weeth, oneinch);
      console.log(pair);
      const route = new Route([pair], weeth);
      const trade = new Trade(route, new TokenAmount(weeth, '10000000000000000'), TradeType.EXACT_INPUT);
*/
      const instance2 = new web3.eth.Contract(
        weth.abi,
        wethContract,
      );

      const instance3 = new web3.eth.Contract(
        Uniswap.abi,
        uniswapContract,
      );

      const instance4 = new web3.eth.Contract(
        pair.abi,
        pairContract,
      );

      const instance5 = new web3.eth.Contract(
        minABI,
        oneinchContract,
      );

      const instance6 = new web3.eth.Contract(
        aaveLend.abi,
        aaveLendContract,
      );

      var userAccount;


      const accounts = await web3.eth.getAccounts();
      if (accounts[0] !== userAccount) {
        userAccount = accounts[0];
      }

      this.setState({ 
        accounts: userAccount,
        web3: web3, 
        uniswapContract: instance3,
        tokenContract: instance, 
        wethContract: instance2,
        pairContract: instance4,
        oneinchContract: instance5,
        aaveContract: instance6
      });


    

      
      var feeMultiplier = 0;
      var totalPositionCollateral = 0;
      var tokensOutstanding = 0;
      var minSponsorTokens = 0;
      var numberTokens = 0;
      var liquidSupply = 0;
      var metaBalance = 0;
      var metaWethBalance =0;
      var collateralRequirement = 0;
      



    //cumulativeFeeMultiplier = 1
    //rawTotalPositionCollateral = 1.64
    //totalTokensOutstanding = 500
    //GCR = (cumulativeFeeMultiplier*rawTotalPositionCollateral)/totalTokensOutstanding = 0.00328
    //mintokens = 100
    //want to mint 100 tokens : 0.00328 * 100 = 0.328
    //approveAndcreate("0.4", "100")
      await instance.methods.cumulativeFeeMultiplier().call().then(async cfm=>{
        feeMultiplier = web3.utils.fromWei(cfm, "ether");
      })

      await instance.methods.rawTotalPositionCollateral().call().then(async rtpc=>{
        totalPositionCollateral = web3.utils.fromWei(rtpc, "ether");
      })

      await instance.methods.totalTokensOutstanding().call().then(async tto=>{
        tokensOutstanding = web3.utils.fromWei(tto, "ether");
      })
      
      await instance.methods.minSponsorTokens().call().then(async mst=>{
        minSponsorTokens = web3.utils.fromWei(mst, "ether");
      })

      await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
        numberTokens = web3.utils.fromWei(cc.tokensOutstanding[0], "ether");
      })

      this.setState({GCR: feeMultiplier*totalPositionCollateral/tokensOutstanding});
      this.setState({minimumTokens: minSponsorTokens});
      this.setState({tokenBalance: numberTokens});
      

      setInterval(async () => {
        await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
          numberTokens = web3.utils.fromWei(cc.tokensOutstanding[0], "ether");
        })
        this.setState({tokenBalance: numberTokens});

        this.state.pairContract.methods.totalSupply().call().then(async cc=>{
          liquidSupply = web3.utils.fromWei(cc, "ether");
        })
        this.setState({supply: liquidSupply});

        this.state.oneinchContract.methods.balanceOf(this.state.accounts).call().then(async cfm => {
          // Get decimals
            metaBalance = web3.utils.fromWei(cfm, "ether");
          });
          this.setState({metamaskBalance: metaBalance});

          await instance.methods.rawTotalPositionCollateral().call().then(async rtpc=>{
            totalPositionCollateral = web3.utils.fromWei(rtpc, "ether");
          })
          await this.state.tokenContract.methods.totalTokensOutstanding().call().then(async tto=>{
            tokensOutstanding = web3.utils.fromWei(tto, "ether");
          })
          await this.state.tokenContract.methods.collateralRequirement().call().then(async tto=>{
            collateralRequirement = web3.utils.fromWei(tto, "ether");
          })
var ethPrice;
var oneInchPrice;
var oneInchEthRatio;
          await CoinGeckoClient.simple.price({
            ids: ['1inch','ethereum'],
            vs_currencies: ['eth','usd'],
        }).then(async data2 => {
          oneInchPrice = data2.data["1inch"].usd;
          ethPrice =data2.data["ethereum"].usd;
          oneInchEthRatio =data2.data["1inch"].eth;
        })
        this.setState({currEthPrice: ethPrice});
        this.setState({currOneInchPrice: oneInchPrice});
        this.setState({currEthOneInchRatio: oneInchEthRatio});
        this.setState({tokensMinted: tokensOutstanding});
        this.setState({collateralPosition: totalPositionCollateral});
        this.setState({minCollateral: collateralRequirement});
  
  
        this.state.wethContract.methods.balanceOf(this.state.accounts).call().then(async cfm => {
          // Get decimals
            metaWethBalance = web3.utils.fromWei(cfm, "ether");
          });
        this.setState({metamaskWethBalance: metaWethBalance});
      }, 1000);

    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  async approveAndMintTokens(collateral, tokenAmt){
    if(parseInt(tokenAmt) < parseInt(this.state.minimumTokens)){
      this.setState({error: "too little tokens"})
    } else if(collateral < (this.state.numTokens* this.state.GCR) ){
      this.setState({error: "too little collateral"})
    } else {
      this.setState({error: ""})
      await this.state.wethContract.methods.approve(tokenContract, "1000000000000000000000000000")
        .send({ from: this.state.accounts})
        .on("receipt", async (receipt)=> {
          this.setState({error: "Approved to send wETH to EMP!"});
          await this.state.tokenContract.methods.create([this.state.web3.utils.toWei(collateral)],[this.state.web3.utils.toWei(tokenAmt)])
            .send({ from: this.state.accounts})
            .on("receipt", async (receipt)=> {
              await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
                this.setState({error: "Congratulations you minted " + tokenAmt + " tokens! You now have " + this.state.web3.utils.fromWei(cc.tokensOutstanding[0], "ether") + " u1INCHwETH!"});
              })
            })
            .on("error",  function(error) {
              console.log("error: "+ error)
            })
          })
        .on("error",  function(error) {
          console.log("error: "+ error)
        })
    }
  }

  async mintTokens(collateral, tokenAmt){
    if(parseInt(tokenAmt) < parseInt(this.state.minimumTokens)){
      this.setState({error: "too little tokens"})
    } else if(collateral < (this.state.numTokens* this.state.GCR)){
      this.setState({error: "too little collateral"})
    } else {
      this.setState({error: ""})
    await this.state.tokenContract.methods.create([this.state.web3.utils.toWei(collateral)],[this.state.web3.utils.toWei(tokenAmt)])
      .send({ from: this.state.accounts})
      .on("receipt", async (receipt)=> {
        await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
          this.setState({error: "Congratulations you minted " + tokenAmt + " tokens! You now have " + this.state.web3.utils.fromWei(cc.tokensOutstanding[0], "ether") + " u1INCHwETH!"});
        })
      })
      .on("error",  function(error) {
        console.log("error: "+ error)
      })
    }
  }

  async depositWETH(amount){
    await this.state.aaveContract.methods.deposit(
      wethContract,
      this.state.web3.utils.toWei(amount),
      this.state.accounts,
      '0'
    ).send({ from: this.state.accounts})
    .on("receipt", async (receipt)=> {
      this.setState({error: "Congratulations! You have deposited " + amount + " wETH. You received " + amount + " aWETH" });
    })
    .on("error",  function(error) {
      console.log("error: "+ error)
    })
  }
  /*async longTokens(value){
    const path = [ weeth.address,oneinch.address];
    const to = this.state.accounts; // should be a checksummed recipient address
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
    const valueToEth = this.state.web3.utils.toWei(value);// // needs to be converted to e.g. hex
    await this.state.uniswapContract.methods.swapExactETHForTokens(
      1,
      path,
      to,
      deadline,
      )
    .send({ from: this.state.accounts, value: valueToEth})
    .on("receipt", async (receipt)=> {
      console.log("success!");
    })
    .on("error",  function(error) {
      console.log("error: "+ error)
    })  
  }

  async calculateEst(amount) {
    var x;
    if(amount !== 0){
    await this.state.uniswapContract.methods.getAmountsOut(
    this.state.web3.utils.toWei(amount.toString(), "ether"),
    [wethContract,
    oneinchContract]
    ).call().then(async cfm=>{
      x = this.state.web3.utils.fromWei(cfm[1], "ether");
      console.log("reached");
    })
    }
  }
  */

  async getWETH(amount){
    this.state.web3.eth.sendTransaction({
     from: this.state.accounts, 
     to: wethContract, 
     value:this.state.web3.utils.toWei(amount.toString(), "ether")
     }).on("receipt", async (receipt)=> {
    })
  } 

  async getSupply(){

  } 

  handleNumTokenChange = (event) =>   { 
    this.setState({numTokens: event.target.value});
  }

  handleNumCChange = (event) =>   { 
    this.setState({numC: event.target.value});
  }

  handleApproveAndMintTokens = (event) =>   { 
    this.approveAndMintTokens(this.state.numC,this.state.numTokens);
  }

  handleMintTokens = (event) =>   { 
    this.mintTokens(this.state.numC,this.state.numTokens);
  }

  handleWETHChange = (event) =>   { 
    this.setState({wETHToBuy: event.target.value});
  }

  handleLongChange = async (event) =>   { 
    this.setState({longAmt: event.target.value});
  }

  handleDepositChange = async (event) =>   { 
    this.setState({deposit: event.target.value});
  }

  handleLongToken = async (event) => {
    this.longTokens(this.state.longAmt);
  }

  handleDepositWETH = (event) => {
    this.depositWETH(this.state.deposit);
  }

  handleBuyWETH = (event) => {
    this.getWETH(this.state.wETHToBuy);
  }

  handleClick = (event) => {
    this.setState({error: "copied"});
  }

  render() {
    return (
      <div className="App" > 
      <div style ={styles}>Mint your own synthetic 1inch! </div>
      (Expires 01/01/2022 00:00 UTC)
      <br></br>
      <br></br>
      <div style = {styles2}>
      ETH: {"$" + this.state.currEthPrice}
      &nbsp;&nbsp;&nbsp;
      1inch: {"$" + this.state.currOneInchPrice}
      &nbsp;&nbsp;&nbsp;
      ETH:1inch: {this.state.currEthOneInchRatio}
      <br></br>
      Total u1inch minted: {parseFloat(this.state.tokensMinted).toFixed(2)}
      &nbsp;&nbsp;&nbsp;
      Total u1inch balance: {parseFloat(this.state.tokenBalance).toFixed(2)}
      &nbsp;&nbsp;&nbsp;
      Metamask u1inch balance: {parseFloat(this.state.metamaskBalance).toFixed(2)}
      
      {/*CollateralPosition: {this.state.collateralPosition}
      &nbsp;&nbsp;&nbsp;
      MinCollateralPosition: {this.state.minCollateral}
      <br></br>
    */}
      <br></br>
      <text style={{fontWeight: "bold"}}>Make sure you have enough wETH in your account</text>
      <br></br>
      wETH balance: {parseFloat(this.state.metamaskWethBalance).toFixed(2)}
      <br></br>
      Dont have wETH? wrap some here with ETH: <Input type="number" placeholder= "0" onChange={this.handleWETHChange} />
      &nbsp;<Button variant="contained" color="secondary" onClick={this.handleBuyWETH}>Mint WETH</Button>
      <br></br>
      <br></br>
      <text style={{fontWeight: "bold"}}>Mint u1inch</text>
      <br></br>
      Minimum tokens mintable: {this.state.minimumTokens}
      &nbsp;&nbsp;&nbsp;
      Minimum collateral: {this.state.numTokens* this.state.GCR}
      <br></br>
      Token amount to mint: <Input type="number"  placeholder="100" onChange={this.handleNumTokenChange} />
      &nbsp;&nbsp;&nbsp;
      wETH amount as collateral: <Input type="number" placeholder= {(this.state.numTokens* this.state.GCR)} onChange={this.handleNumCChange} />
      <br></br>
      Approve wETH and mint tokens:  <Button variant="contained" color="secondary" onClick={this.handleApproveAndMintTokens}>Approve wETH and Mint Tokens</Button>
      &nbsp;&nbsp;&nbsp;
      Already approved? <Button variant="contained" color="secondary" onClick={this.handleMintTokens}>Mint Tokens</Button>
      <br></br>
      <br></br>
      {/*}
       Use ETH to Long u1INCHwETH on Uniswap: <Input type="number" placeholder= "0"   onChange={this.handleLongChange}/>
      <Button variant="contained" color="secondary" onClick={this.handleLongToken} >Long Tokens</Button>
      <br></br> 
      Amount of u1INCHwETH you will get: {this.state.estimate}
      <br></br>
    */}
      <text style={{fontWeight: "bold"}}>Head to Uniswap to short and long u1inch!</text>
      <br></br>
      <Button variant="contained" color="secondary" target="_blank" href={"https://app.uniswap.org/#/add/0x32B5F743D06B54A645f351DAC79270Ce74aCc7af/ETH"}>Add liquidity</Button> 
      &nbsp;<Button variant="contained" color="secondary" target="_blank" href={"https://app.uniswap.org/#/swap"}>SHORT or LONG: swap u1inch with other tokens</Button>
      <br></br>
      Total u1inch supply: {parseFloat(this.state.supply).toFixed(2)}
      <br></br>
      <br></br>
      BONUS: After swapping, deposit some wETH to Aave: <Input type="number" placeholder= "0" onChange={this.handleDepositChange} />
      &nbsp;<Button variant="contained" color="secondary" onClick={this.handleDepositWETH}>Deposit WETH to Aave</Button>
      <br></br>
      <br></br>
      <CopyToClipboard text={wethContract} onCopy={this.onCopy} >
      <Button variant="contained" color="secondary" onClick={this.handleClick}>copy wETH address</Button>
        </CopyToClipboard> <CopyToClipboard text={oneinchContract} onCopy={this.onCopy}>
        <Button variant="contained" color="secondary" onClick={this.handleClick}>copy u1inch address</Button>
        </CopyToClipboard>
        <div style = {styles3}>{this.state.error}</div>
      </div>
      </div>
      
    );
  }
}
export default App;
