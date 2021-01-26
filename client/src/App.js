import React, { Component} from "react";
import {CopyToClipboard} from 'react-copy-to-clipboard';
import getWeb3 from "./getWeb3.js";
import Tokens from "./build/token.json";
import weth from "./build/weth.json";
import Uniswap from "./build/uniswap.json"
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import "./App.css";

import { ChainId, Token, Percent, Fetcher, TokenAmount, Route, Trade, TradeType} from '@uniswap/sdk'

const oneinch = new Token(ChainId.KOVAN, 
  '0x32b5f743d06b54a645f351dac79270ce74acc7af', 
  18, 
  )



const weeth = new Token(ChainId.KOVAN, 
  '0xd0a1e359811322d97991e03f863a0c30c2cf029c', 
  18, 
  )


//0x32B5F743D06B54A645f351DAC79270Ce74aCc7af

const tokenContract = "0xf3371032B682bC37200056a0e2F4E13717Ad5D95";
const wethContract = "0xd0a1e359811322d97991e03f863a0c30c2cf029c";
const oneinchContract = "0x32b5f743d06b54a645f351dac79270ce74acc7af";
const uniswapContract = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const styles ={
  fontSize: '40px',
}

const styles2 ={
  lineHeight: '2.5em',
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
     GCR: 0,
     minimumTokens: 0,
     numTokens: 0,
     minimumCollateral: 0,
     numC: 0,
     error: "",
     tokenBalance: 0,
     wETHToBuy: 0,
     longAmt: 0,
     estimate: 0
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
      var pair = await Fetcher.fetchPairData(weeth, oneinch);
      console.log(pair);
      const route = new Route([pair], weeth);
      const trade = new Trade(route, new TokenAmount(weeth, '10000000000000000'), TradeType.EXACT_INPUT);

      const instance2 = new web3.eth.Contract(
        weth.abi,
        wethContract,
      );

      const instance3 = new web3.eth.Contract(
        Uniswap.abi,
        uniswapContract,
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
        wethContract: instance2
      });
      
      var feeMultiplier = 0;
      var totalPositionCollateral = 0;
      var tokensOutstanding = 0;
      var minSponsorTokens = 0;
      var numberTokens = 0;

      const path = [ weeth.address,oneinch.address];
      const to = this.state.accounts; // should be a checksummed recipient address
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time
      console.log(deadline);
      const valueToEth = 0;// // needs to be converted to e.g. hex


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
      await this.state.wethContract.methods.approve(tokenContract, "100000000000000000000")
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

  async longTokens(value){
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

  async getWETH(amount){
    this.state.web3.eth.sendTransaction({
     from: this.state.accounts, 
     to: wethContract, 
     value:this.state.web3.utils.toWei(amount.toString(), "ether")
     });
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

  handleLongToken = async (event) => {
    this.longTokens(this.state.longAmt);
  }

  handleBuyWETH = (event) => {
    this.getWETH(this.state.wETHToBuy);
  }

  render() {
    return (
      <div className="App" > 
      <div style ={styles}>Mint your own u1INCHwETH!!</div>
      <br></br>
      <br></br>
      <div style = {styles2}>
      <CopyToClipboard text={wethContract} onCopy={this.onCopy}>
      <Button variant="contained" color="secondary" >copy wETH address</Button>
        </CopyToClipboard> <CopyToClipboard text={oneinchContract} onCopy={this.onCopy}>
        <Button variant="contained" color="secondary" >copy u1INCHwUSD address</Button>
        </CopyToClipboard>
        <br></br>
      Token balance: {this.state.tokenBalance}
      <br></br>
      Minimum tokens mintable: {this.state.minimumTokens}
      <br></br>
      Minimum collateral: {this.state.numTokens* this.state.GCR}
      <br></br>
      (Make sure you have enough wETH in your account)
      <br></br>
      Dont have wETH? mint some here with ETH: <Input type="number" placeholder= "0" onChange={this.handleWETHChange} />
      <Button variant="contained" color="secondary" onClick={this.handleBuyWETH}>Mint WETH</Button>
      <br></br>
      Token amount to mint: <Input type="number" placeholder="100" onChange={this.handleNumTokenChange} />
      <br></br>
      wETH amount as collateral: <Input type="number" placeholder= {(this.state.numTokens* this.state.GCR)} onChange={this.handleNumCChange} />
      <br></br>
      Approve wETH and mint tokens:  <Button variant="contained" color="secondary" onClick={this.handleApproveAndMintTokens}>Approve wETH and Mint Tokens</Button>
      <br></br>
      Already approved? <Button variant="contained" color="secondary" onClick={this.handleMintTokens}>Mint Tokens</Button>
      <br></br>
      {/*}
       Use ETH to Long u1INCHwETH on Uniswap: <Input type="number" placeholder= "0"   onChange={this.handleLongChange}/>
      <Button variant="contained" color="secondary" onClick={this.handleLongToken} >Long Tokens</Button>
      <br></br> 
      Amount of u1INCHwETH you will get: {this.state.estimate}
      <br></br>
    */}
      <Button variant="contained" color="secondary" target="_blank" href={"https://app.uniswap.org/#/add/0x32B5F743D06B54A645f351DAC79270Ce74aCc7af/ETH"}>SHORT: Add liquidity</Button> 
      &nbsp;<Button variant="contained" color="secondary" target="_blank" href={"https://app.uniswap.org/#/swap"}>LONG: swap tokens for u1INCHwETH</Button>
      <div style = {styles3}>{this.state.error}</div>
      </div>
      </div>
    );
  }
}
export default App;
