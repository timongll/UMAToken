import React, { Component} from "react";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import getWeb3 from "./getWeb3.js";
import Tokens from "./build/token.json";
import Weth from "./build/weth.json";
import Uniswap from "./build/uniswap.json";
import Aave from "./build/aave.json";
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import "./App.css";

const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

const tokenAddress = "0xf3371032B682bC37200056a0e2F4E13717Ad5D95";
const wethAddress = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
const u1inchAddress = "0x32b5f743d06b54a645f351dac79270ce74acc7af";
const uniswapAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const aaveAddress = "0x9FE532197ad76c5a68961439604C037EB79681F0";
const aWethAddress = "0xe2735adf49d06fbc2c09d9c0cffba5ef5ba35649";
// The minimum ABI to get ERC20 Token balance
let minABI = [
  // balanceOf
  {
    "constant": true,
    "inputs":[{"name":"_owner","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"name":"balance","type":"uint256"}],
    "type":"function"
  },
];

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
     u1inchContract: "",
     error: "",
     GCR: 0,
     minTokens: 0,
     numTokens: 0,
     minCollateral: 0,
     numCollateral: 0,
     tokenBalance: 0,
     numWeth: 0,
     supply: 0,
     metamaskBalance: 0,
     metamaskWethBalance: 0,
     deposit: 0,
     currEthPrice: 0,
     curr1inchPrice: 0,
     coinGeckoRatio: 0,
     uniswapRatio: 0,
     tokensMinted: 0,
     collateralPosition: 0,
   }
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const tokenContract = new web3.eth.Contract(
        Tokens.abi,
        tokenAddress,
      );

      const wethContract = new web3.eth.Contract(
        Weth.abi,
        wethAddress,
      );

      const uniswapContract = new web3.eth.Contract(
        Uniswap.abi,
        uniswapAddress,
      );

      const aaveContract = new web3.eth.Contract(
        Aave.abi,
        aaveAddress,
      );

      const u1inchContract = new web3.eth.Contract(
        minABI,
        u1inchAddress,
      );

      var userAccount;
      const accounts = await web3.eth.getAccounts();
      if (accounts[0] !== userAccount) {
        userAccount = accounts[0];
      }

      this.setState({ 
        accounts: userAccount,
        web3: web3, 
        uniswapContract: uniswapContract,
        tokenContract: tokenContract, 
        wethContract: wethContract,
        u1inchContract: u1inchContract,
        aaveContract: aaveContract,
      });
      
      var feeMultiplier;
      var totalPositionCollateral;
      var tokensOutstanding;
      var minTokens;
      var tokenBalance;
      var metamaskBalance;
      var metamaskWethBalance;
      var collateralRequirement;
      var uniswapRatio;
      var currEthPrice;
      var curr1inchPrice;
      var coinGeckoRatio;
      
      await this.state.tokenContract.methods.cumulativeFeeMultiplier().call().then(async cfm=>{
        feeMultiplier = web3.utils.fromWei(cfm, "ether");
      })

      await this.state.tokenContract.methods.rawTotalPositionCollateral().call().then(async rtpc=>{
        totalPositionCollateral = web3.utils.fromWei(rtpc, "ether");
      })

      await this.state.tokenContract.methods.totalTokensOutstanding().call().then(async tto=>{
        tokensOutstanding = web3.utils.fromWei(tto, "ether");
      })
      
      await this.state.tokenContract.methods.minSponsorTokens().call().then(async mst=>{
        minTokens = web3.utils.fromWei(mst, "ether");
      })

      await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
        tokenBalance = web3.utils.fromWei(cc.tokensOutstanding[0], "ether");
      })

      this.setState({GCR: feeMultiplier*totalPositionCollateral/tokensOutstanding});
      this.setState({minTokens: minTokens});
      this.setState({tokenBalance: tokenBalance});
      

      setInterval(async () => {
        await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
          tokenBalance = web3.utils.fromWei(cc.tokensOutstanding[0], "ether");
        })
        this.setState({tokenBalance: tokenBalance});

        this.state.u1inchContract.methods.balanceOf(this.state.accounts).call().then(async cfm => {
          metamaskBalance = web3.utils.fromWei(cfm, "ether");
        });
        
        this.state.wethContract.methods.balanceOf(this.state.accounts).call().then(async cfm => {
          metamaskWethBalance = web3.utils.fromWei(cfm, "ether");
        });

        await this.state.tokenContract.methods.rawTotalPositionCollateral().call().then(async rtpc=>{
          totalPositionCollateral = web3.utils.fromWei(rtpc, "ether");
        })

        await this.state.tokenContract.methods.totalTokensOutstanding().call().then(async tto=>{
          tokensOutstanding = web3.utils.fromWei(tto, "ether");
        })

        await this.state.tokenContract.methods.collateralRequirement().call().then(async tto=>{
          collateralRequirement = web3.utils.fromWei(tto, "ether");
        })

        await this.state.uniswapContract.methods.getAmountsOut(
          "1000000000000000000",
          [ u1inchAddress, wethAddress]
        ).call().then(async tto=>{
            uniswapRatio = web3.utils.fromWei(tto[1], "ether");
        })

        await CoinGeckoClient.simple.price({
          ids: ['1inch','ethereum'],
          vs_currencies: ['eth','usd'],
        }).then(async data2 => {
          curr1inchPrice = data2.data["1inch"].usd;
          currEthPrice =data2.data["ethereum"].usd;
          coinGeckoRatio =data2.data["1inch"].eth;
        })
        
        this.setState({metamaskBalance: metamaskBalance});
        this.setState({tokensMinted: tokensOutstanding});
        this.setState({totalPositionCollateral: totalPositionCollateral});
        this.setState({collateralRequirement: collateralRequirement});
        this.setState({currEthPrice: currEthPrice});
        this.setState({curr1inchPrice: curr1inchPrice});
        this.setState({coinGeckoRatio: coinGeckoRatio});
        this.setState({uniswapRatio: uniswapRatio})
        this.setState({metamaskWethBalance: metamaskWethBalance});
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
    if(parseInt(tokenAmt) < parseInt(this.state.minTokens)){
      this.setState({error: "too little tokens"})
    } else if(collateral < (this.state.numTokens* this.state.GCR) ){
      this.setState({error: "too little collateral"})
    } else {
      this.setState({error: ""})
      await this.state.wethContract.methods.approve(tokenAddress, "1000000000000000000000000000")
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
    if(parseInt(tokenAmt) < parseInt(this.state.minTokens)){
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

  async approveAndDepositWeth(amount){
    await this.state.wethContract.methods.approve(aaveAddress, "1000000000000000000000000000")
        .send({ from: this.state.accounts})
        .on("receipt", async (receipt)=> {
          this.setState({error: "Approved to send wETH to Aave!"});
           await this.state.aaveContract.methods.deposit(
            wethAddress,
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
        }).on("error",  function(error) {
          console.log("error: "+ error)
        })
  }

  async depositWeth(amount){
           await this.state.aaveContract.methods.deposit(
            wethAddress,
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

  async getWeth(amount){
    this.state.web3.eth.sendTransaction({
     from: this.state.accounts, 
     to: wethAddress, 
     value:this.state.web3.utils.toWei(amount.toString(), "ether")
     }).on("receipt", async (receipt)=> {
    })
  } 

  handleNumTokenChange = (event) =>   { 
    this.setState({numTokens: event.target.value});
  }

  handleNumCollateralChange = (event) =>   { 
    this.setState({numCollateral: event.target.value});
  }

  handleApproveAndMintTokens = (event) =>   { 
    this.approveAndMintTokens(this.state.numCollateral,this.state.numTokens);
  }

  handleMintTokens = (event) =>   { 
    this.mintTokens(this.state.numCollateral,this.state.numTokens);
  }

  handleWethChange = (event) =>   { 
    this.setState({numWeth: event.target.value});
  }

  handleDepositChange = async (event) =>   { 
    this.setState({deposit: event.target.value});
  }

  handleApproveAndDepositWeth = (event) => {
    this.approveAndDepositWeth(this.state.deposit);
  }

  handleDepositWeth = (event) => {
    this.depositWeth(this.state.deposit);
  }

  handleBuyWeth = (event) => {
    this.getWeth(this.state.numWeth);
  }

  handleClick = (event) => {
    this.setState({error: "copied"});
  }

  render() {
    return (
      <div className="App" style ={{fontFamily: "Helvetica, Sans-Serif", backgroundColor: "LavenderBlush"}} > 
        <div style ={{fontSize: '40px', fontWeight: "bold"}}>Mint your own synthetic 1inch! </div>
        (Expires 01/01/2022 00:00 UTC)
        <br></br><br></br>
        <div style = {{lineHeight: '2em'}}>
          ETH: {"$" + this.state.currEthPrice}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          1inch: {"$" + this.state.curr1inchPrice}
          <br></br>
          CoinGecko: {parseFloat(this.state.coinGeckoRatio).toFixed(6) + " ETH per 1inch"}
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Uniswap: {parseFloat(this.state.uniswapRatio).toFixed(6) + " ETH per u1inch"}
          <br></br>
          u1inch balance: {parseFloat(this.state.tokenBalance).toFixed(2)}
          <br></br><br></br>
          <text style={{fontWeight: "bold"}}>Make sure you have enough wETH in your account</text>
          <br></br>
          wETH balance: {parseFloat(this.state.metamaskWethBalance).toFixed(2)}
          <br></br>
          Dont have wETH? wrap some here: &nbsp;
          <Input type="number" style={{width:"100px", height:"20px"}} placeholder= "0" onChange={this.handleWethChange}/> &nbsp;
          <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" onClick={this.handleBuyWeth}>Mint WETH</Button>
          <br></br><br></br>
          <text style={{fontWeight: "bold"}}>Mint u1inch</text>
          <br></br>
          Minimum tokens: {this.state.minTokens}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Minimum collateral: {this.state.numTokens* this.state.GCR}
          <br></br>
          Mint amount:&nbsp;
          <Input type="number"  style={{width:"100px", height:"20px"}} placeholder="100" onChange={this.handleNumTokenChange}/> &nbsp;
          wETH collateral amount: &nbsp;
          <Input type="number" style={{width:"100px", height:"20px"}} placeholder= {(this.state.numTokens*this.state.GCR)} onChange={this.handleNumCollateralChange} />
          <br></br>
          <Button style={{ borderRadius: 100 }}variant="outlined" color="secondary" onClick={this.handleApproveAndMintTokens}>Approve and Mint</Button> &nbsp;
          Already approved?&nbsp;
          <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" onClick={this.handleMintTokens}>Mint</Button>
          <br></br><br></br>
          <text style={{fontWeight: "bold"}}>Short and long u1inch on Uniswap</text>
          <br></br>
          <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" target="_blank" href={"https://app.uniswap.org/#/add/0x32B5F743D06B54A645f351DAC79270Ce74aCc7af/ETH"}>Add liquidity</Button>&nbsp;
          <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" target="_blank" href={"https://app.uniswap.org/#/swap"}>SHORT or LONG</Button>
          <br></br><br></br>
          BONUS: After swapping, deposit some wETH to Aave: &nbsp;
          <Input style={{width:"100px", height:"20px"}} type="number" placeholder= "0" onChange={this.handleDepositChange} />
          <br></br>
          <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" onClick={this.handleApproveAndDepositWeth}>Approve and deposit</Button>&nbsp;
          Already approved? &nbsp;
          <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" onClick={this.handleDepositWeth}>Deposit</Button>
          <br></br><br></br>
          <CopyToClipboard text={wethAddress} onCopy={this.onCopy} >
            <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" onClick={this.handleClick}>copy wETH address</Button>
          </CopyToClipboard>&nbsp; 
          <CopyToClipboard text={u1inchAddress} onCopy={this.onCopy}>
            <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" onClick={this.handleClick}>copy u1inch address</Button>
          </CopyToClipboard>&nbsp; 
          <CopyToClipboard text={aWethAddress} onCopy={this.onCopy}>
            <Button style={{ borderRadius: 100 }} variant="outlined" color="secondary" onClick={this.handleClick}>copy awETH address</Button>
          </CopyToClipboard>
          <div style = {{color: "red"}}>{this.state.error}</div>
        </div>
      </div>
      
    );
  }
}
export default App;
