import React, { Component} from "react";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import getWeb3 from "./getWeb3.js";
import Tokens from "./build/token.json";
import Weth from "./build/weth.json";
import U1inch from "./build/u1inch.json";
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
     numTokens2: 0,
     numCollateral: 0,
     numCollateral2: 0,
     tokensOutstanding: 0,
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
     collateralAmount: 0,
     totalCollateral: 0,
     userCollateral: 0,
     userTokens: 0,
     userCR: 0,
     minCollateral: 0,
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
        U1inch.abi,
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
      var totalCollateral;
      var tokensOutstanding;
      var minTokens;
      var metamaskBalance;
      var metamaskWethBalance;
      var collateralRequirement;
      var uniswapRatio;
      var currEthPrice;
      var curr1inchPrice;
      var coinGeckoRatio;
      var userCollateral;
      var userTokens;
      var userCR;
      var minCollateral;
      setInterval(async () => {
        await this.state.tokenContract.methods.cumulativeFeeMultiplier().call().then(async cfm=>{
          feeMultiplier = web3.utils.fromWei(cfm, "ether");
        })
        
        await this.state.tokenContract.methods.rawTotalPositionCollateral().call().then(async rtpc=>{
          totalCollateral = web3.utils.fromWei(rtpc, "ether");
        })
  
        await this.state.tokenContract.methods.totalTokensOutstanding().call().then(async tto=>{
          tokensOutstanding = web3.utils.fromWei(tto, "ether");
        })
        
        await this.state.tokenContract.methods.minSponsorTokens().call().then(async mst=>{
          minTokens = web3.utils.fromWei(mst, "ether");
        })

        this.state.u1inchContract.methods.balanceOf(this.state.accounts).call().then(async cfm => {
          metamaskBalance = web3.utils.fromWei(cfm, "ether");
        });
        
        this.state.wethContract.methods.balanceOf(this.state.accounts).call().then(async cfm => {
          metamaskWethBalance = web3.utils.fromWei(cfm, "ether");
        });

        await this.state.tokenContract.methods.collateralRequirement().call().then(async tto=>{
          collateralRequirement = web3.utils.fromWei(tto, "ether");
        })

        await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async tto=>{
          userCollateral = web3.utils.fromWei(tto.rawCollateral[0], "ether");
          userTokens = web3.utils.fromWei(tto.tokensOutstanding[0], "ether");
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

        this.setState({GCR: feeMultiplier*totalCollateral/tokensOutstanding});
        this.setState({minTokens: minTokens});
        this.setState({tokensOutstanding: tokensOutstanding});
        this.setState({metamaskBalance: metamaskBalance});
        this.setState({tokensMinted: tokensOutstanding});
        this.setState({totalCollateral: totalCollateral});
        this.setState({collateralRequirement: collateralRequirement});
        this.setState({currEthPrice: currEthPrice});
        this.setState({curr1inchPrice: curr1inchPrice});
        this.setState({coinGeckoRatio: coinGeckoRatio});
        this.setState({uniswapRatio: uniswapRatio})
        this.setState({metamaskWethBalance: metamaskWethBalance});
        this.setState({userCollateral: userCollateral});
        this.setState({userTokens: userTokens});
        if(Number.isNaN(this.state.userCollateral/this.state.userTokens)){
          userCR = 0;
        }else {
          userCR =this.state.userCollateral/this.state.userTokens;
        }
        let minColl1 = (this.state.userCollateral + this.state.numCollateral)/(this.state.userTokens+this.state.numTokens)
        let minColl2 = this.state.numTokens* this.state.GCR;
        if(Number.isNaN(minColl1) || parseInt(this.state.userCollateral) === 0){
          minCollateral = minColl2;
        }else {
          minCollateral = Math.min(minColl1, minColl2);
        }
        this.setState({userCR: userCR});
        this.setState({minCollateral: minCollateral});
      }, 1000);

 
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  }

  async approveWeth(){
    await this.state.wethContract.methods.approve(tokenAddress, "1000000000000000000000000000")
      .send({ from: this.state.accounts})
      .on("receipt", async (receipt)=> {
        this.setState({error: "Approved to send wETH to EMP!"});
      }).on("error",  function(error) {
        console.log("error: "+ error)
      })
  }

  async approveU1inch(){
    await this.state.u1inchContract.methods.approve(tokenAddress, "1000000000000000000000000000")
      .send({ from: this.state.accounts})
      .on("receipt", async (receipt)=> {
        this.setState({error: "Approved to send u1inch to EMP!"});
      }).on("error",  function(error) {
        console.log("error: "+ error)
      })
  }

  async redeemToken(tokenAmount){
    if(parseInt(this.state.userTokens) ===0){
      this.setState({error: "no sponsor position"})
    }else if(tokenAmount <=0){
      this.setState({error: "input valid amount"})
    }else if(tokenAmount > this.state.userTokens){
      this.setState({error: "too little token balance"})
    }else if(this.state.userTokens !== tokenAmount &&
      this.state.userTokens - tokenAmount < this.state.minTokens){
      this.setState({error: "token balance below min sponsor position"})
    }else{
      await this.state.tokenContract.methods.redeem([this.state.web3.utils.toWei(tokenAmount)])
        .send({ from: this.state.accounts})
        .on("receipt", async (receipt)=> {
          this.setState({error: "You've redeemed " + tokenAmount + " u1inch"})
        })
        .on("error",  function(error) {
          console.log("error: "+ error)
        })
    }
  }

  async depositCollateral(collateralAmount){
    if(parseInt(this.state.userCollateral) ===0){
      this.setState({error: "no sponsor position"})
    }else if(collateralAmount <=0){
      this.setState({error: "input valid amount"})
    }else{
      await this.state.tokenContract.methods.deposit([this.state.web3.utils.toWei(collateralAmount)])
        .send({ from: this.state.accounts})
        .on("receipt", async (receipt)=> {
          this.setState({error: "You've deposited " + collateralAmount + " wETH"})
        })
        .on("error",  function(error) {
          console.log("error: "+ error)
        })
    }
  }

  async withdrawCollateral(collateralAmount){
    if(parseInt(this.state.userCollateral) ===0){
      this.setState({error: "no sponsor position"})
    }else if(collateralAmount <=0){
      this.setState({error: "input valid amount"})
    }else if(this.state.GCR > (this.state.userCollateral-collateralAmount)/this.state.userTokens){
      this.setState({error: "too little collateral left"});
    }else {
      await this.state.tokenContract.methods.withdraw([this.state.web3.utils.toWei(collateralAmount)])
        .send({ from: this.state.accounts})
        .on("receipt", async (receipt)=> {
          this.setState({error: "You've withdrawn " + collateralAmount + " wETH"})
        })
        .on("error",  function(error) {
          console.log("error: "+ error)
        })
    }
  }

  async mintTokens(collateral, tokenAmt){
    if(tokenAmt <=0){
      this.setState({error: "input valid amount"})
    } else if(parseInt(this.state.userTokens)+ parseInt(tokenAmt) < parseInt(this.state.minTokens)){
      this.setState({error: "token amount below minimum sponsor tokens"})
    } else if(collateral < (this.state.minCollateral)){
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
    if(amount <=0){
      this.setState({error: "input valid amount"})
    }else{
      this.state.web3.eth.sendTransaction({
      from: this.state.accounts, 
      to: wethAddress, 
      value:this.state.web3.utils.toWei(amount.toString(), "ether")
      })
    }
  } 

  handleNumTokenChange = (event) =>   { 
    this.setState({numTokens: event.target.value});
  }

  handleNumTokenChange2 = (event) =>   { 
    this.setState({numTokens2: event.target.value});
  }

  handleNumCollateralChange = (event) =>   { 
    this.setState({numCollateral: event.target.value});
  }

  handleNumCollateralChange2 = (event) =>   { 
    this.setState({numCollateral2: event.target.value});
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

  handleDepositCollateral = (event) => {
    this.depositCollateral(this.state.numCollateral2);
  }

  handleWithDrawCollateral = (event) => {
    this.withdrawCollateral(this.state.numCollateral2);
  }

  handleDepositWeth = (event) => {
    this.depositWeth(this.state.deposit);
  }

  handleApproveWeth = (event) => {
    this.approveWeth();
  }

  handleApproveU1inch = (event) => {
    this.approveU1inch();
  }

  handleBuyWeth = (event) => {
    this.getWeth(this.state.numWeth);
  }

  handleClick = (event) => {
    this.setState({error: "copied"});
  }
  
  handleRedeemTokens = (event) => {
    this.redeemToken(this.state.numTokens2);
  }

  render() {
    return (
      <div className="App" style ={{fontFamily: "Helvetica, Sans-Serif", 
      '--color-1': 'cornsilk',
      '--color-2': 'lavenderblush',
      '--color-3': 'pink',
      background: `
        linear-gradient(
          90deg,
          var(--color-1),
          var(--color-2),
          var(--color-3) 
        )
      `,}} > 
        <div style ={{fontSize: '40px', fontWeight: "bold"}}>Mint your own synthetic 1inch! </div>
        (Expires 01/01/2022 00:00 UTC)
        <br></br><br></br>
        <div style = {{lineHeight: '2em'}}>
        <table className = "table">
          <tr>
            <td>ETH: <strong>{"$" + this.state.currEthPrice}</strong></td>
            <td>CoinGecko: <strong>{parseFloat(this.state.coinGeckoRatio).toFixed(6)}</strong> ETH per 1inch</td>
            <td>Global collateral ratio: <strong>{parseFloat(this.state.GCR).toFixed(6)}</strong></td>
          </tr>
          <tr>
            <td>1inch: <strong>{"$" + this.state.curr1inchPrice}</strong></td>
            <td>Uniswap: <strong>{parseFloat(this.state.uniswapRatio).toFixed(6)}</strong> ETH per u1inch</td>
            <td>Your collateral ratio: <strong>{parseFloat(this.state.userCR).toFixed(6)}</strong></td>
          </tr>
        </table>
          <div style = {{color: "red"}}>&nbsp;{this.state.error}&nbsp;</div>
          <table className = "table2">
          <tr>
            <td>Your u1inch position: <strong>{parseFloat(this.state.userTokens).toFixed(2)}</strong></td>
            <td> wETH balance: <strong>{parseFloat(this.state.metamaskWethBalance).toFixed(2)}</strong></td>
          </tr>
          <tr>
            <td>Collateral position: <strong>{parseFloat(this.state.userCollateral).toFixed(6)}</strong></td>
            <td> Dont have wETH? wrap some here: &nbsp;
            <Input type="number" style={{width:"70px", height:"20px"}} placeholder= "0" onChange={this.handleWethChange}/> 
            </td>
          </tr>
          <tr>
            <td>Minimum u1inch tokens: <strong>{this.state.minTokens}</strong></td>
            <td><Button style={{ borderRadius: 100, height: 30 }} variant="outlined" color="secondary" onClick={this.handleBuyWeth}>Mint WETH</Button></td>
          </tr>
          </table>
          <br></br>
          <table className = "table3">
          <tr>
            <td style={{fontWeight: "bold", textAlign: "center"}}>Mint u1inch</td>
            <td style={{fontWeight: "bold", textAlign: "center"}}>Deposit/Withdraw Collateral</td>
            <td style={{fontWeight: "bold", textAlign: "center"}}>Redeem u1inch</td>
          </tr>
          <tr>
            <td>u1inch: <Input type="number"  style={{width:"70px", height:"20px"}} placeholder="0" onChange={this.handleNumTokenChange}/>&nbsp;
            wETH: <Input type="number" style={{width:"70px", height:"20px"}} placeholder= {this.state.minCollateral} onChange={this.handleNumCollateralChange}/>
            </td>
            <td>wETH: <Input type="number" style={{width:"70px", height:"20px"}} placeholder= "0" onChange={this.handleNumCollateralChange2}/></td>
            <td>u1inch: <Input type="number"  style={{width:"70px", height:"20px"}} placeholder="0" onChange={this.handleNumTokenChange2}/></td>
          </tr>
          <tr>
            <td><Button style={{ borderRadius: 100, height: 30 }} title ="approve wETH before using as collateral" variant="outlined" color="secondary" onClick={this.handleApproveWeth}>Approve wETH</Button>&nbsp;
            <Button style={{ borderRadius: 100, height: 30 }} title ="approve wETH before using as collateral" variant="outlined" color="secondary" onClick={this.handleMintTokens}>Mint u1inch</Button></td>
            <td><Button style={{ borderRadius: 100, height: 30 }} title ="deposit collateral to increase collateral position" variant="outlined" color="secondary" onClick={this.handleDepositCollateral}>Deposit</Button>&nbsp;
            <Button style={{ borderRadius: 100, height: 30 }} title ="withdraw collateral to decrease collateral position"variant="outlined" color="secondary" onClick={this.handleWithDrawCollateral}>Withdraw</Button>
            </td>
            <td><Button style={{ borderRadius: 100, height: 30 }} title ="approve u1inch to enable redeeming" variant="outlined" color="secondary" onClick={this.handleApproveU1inch}>Approve u1inch</Button>&nbsp;
            <Button style={{ borderRadius: 100, height: 30  }} title ="redeem u1inch to get back wETH" variant="outlined" color="secondary" onClick={this.handleRedeemTokens}>Redeem</Button>
            </td>
          </tr>
        </table>
          <br></br>
          <text style={{fontWeight: "bold"}}>Short and long u1inch on Uniswap</text>
          <br></br>
          <Button style={{ borderRadius: 100, height: 30  }} variant="outlined" color="secondary" target="_blank" href={"https://app.uniswap.org/#/add/0x32B5F743D06B54A645f351DAC79270Ce74aCc7af/ETH"}>Add liquidity</Button>&nbsp;
          <Button style={{ borderRadius: 100, height: 30 }} variant="outlined" color="secondary" target="_blank" href={"https://app.uniswap.org/#/swap"}>SHORT or LONG</Button>
          <br></br><br></br>
          BONUS: After swapping, deposit some wETH to Aave: &nbsp;
          <Input style={{width:"70px", height:"20px"}} type="number" placeholder= "0" onChange={this.handleDepositChange} />
          <br></br>
          <Button style={{ borderRadius: 100, height: 30  }} variant="outlined" color="secondary" onClick={this.handleApproveAndDepositWeth}>Approve and deposit</Button>&nbsp;
          Already approved? &nbsp;
          <Button style={{ borderRadius: 100, height: 30  }} variant="outlined" color="secondary" onClick={this.handleDepositWeth}>Deposit</Button>
          <br></br><br></br>
          <CopyToClipboard text={wethAddress} onCopy={this.onCopy} >
            <Button style={{ borderRadius: 100, height: 30  }} variant="outlined" color="secondary" onClick={this.handleClick}>copy wETH address</Button>
          </CopyToClipboard>&nbsp; 
          <CopyToClipboard text={u1inchAddress} onCopy={this.onCopy}>
            <Button style={{ borderRadius: 100, height: 30  }} variant="outlined" color="secondary" onClick={this.handleClick}>copy u1inch address</Button>
          </CopyToClipboard>&nbsp; 
          <CopyToClipboard text={aWethAddress} onCopy={this.onCopy}>
            <Button style={{ borderRadius: 100, height: 30  }} variant="outlined" color="secondary" onClick={this.handleClick}>copy awETH address</Button>
          </CopyToClipboard>
          
        </div>
      </div>
      
    );
  }
}
export default App;
