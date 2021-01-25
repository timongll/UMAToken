import React, { Component } from "react";
import getWeb3 from "./getWeb3.js";
import Token from "./build/token.json";
import weth from "./build/weth.json";
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import "./App.css";

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
     GCR: 0,
     minimumTokens: 0,
     numTokens: 0,
     minimumCollateral: 0,
     numC: 0,
     error: "",
     tokenBalance: 0,
     wETHToBuy: 0,
   }

  }



  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const instance = new web3.eth.Contract(
        Token.abi,
        '0xf3371032B682bC37200056a0e2F4E13717Ad5D95',
      );

      const instance2 = new web3.eth.Contract(
        weth.abi,
        '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
      );
      var userAccount;
      const accounts = await web3.eth.getAccounts();
      if (accounts[0] !== userAccount) {
          userAccount = accounts[0];
      }

      this.setState({ web3: web3, accounts: userAccount, tokenContract: instance, wethContract: instance2 });

      //console.log(this.state.web3.eth.getBalance('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'));
      
    var a = 0;
    var b = 0;
    var c = 0;
    var d = 0;
    var e = 0;

    //cumulativeFeeMultiplier = 1
    //rawTotalPositionCollateral = 1.64
    //totalTokensOutstanding = 500
    //GCR = (cumulativeFeeMultiplier*rawTotalPositionCollateral)/totalTokensOutstanding = 0.00328
    //mintokens = 100
    //want to mint 100 tokens : 0.00328 * 100 = 0.328
    //approveAndcreate("0.4", "100")
    await instance.methods.cumulativeFeeMultiplier().call().then(async cfm=>{
      a = web3.utils.fromWei(cfm, "ether");
    })

  

      await instance.methods.rawTotalPositionCollateral().call().then(async rtpc=>{
        b = web3.utils.fromWei(rtpc, "ether");
      })

      await instance.methods.totalTokensOutstanding().call().then(async tto=>{
        c = web3.utils.fromWei(tto, "ether");
      })
    
      await instance.methods.minSponsorTokens().call().then(async mst=>{
        d = web3.utils.fromWei(mst, "ether");
      })

      await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
        e = web3.utils.fromWei(cc.tokensOutstanding[0], "ether");
      })
    this.setState({GCR: a*b/c});
    this.setState({minimumTokens: d});
    this.setState({tokenBalance: e});
    setInterval(async () => {
      await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
        e = web3.utils.fromWei(cc.tokensOutstanding[0], "ether");
      })
      this.setState({tokenBalance: e});
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
    await this.state.wethContract.methods.approve("0xf3371032B682bC37200056a0e2F4E13717Ad5D95", "100000000000000000000")
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
    } else if(collateral < (this.state.numTokens* this.state.GCR) ){
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
   async getWETH(amount){
     this.state.web3.eth.sendTransaction({
      from: this.state.accounts, 
      to: '0xd0a1e359811322d97991e03f863a0c30c2cf029c', 
      value:this.state.web3.utils.toWei(amount.toString(), "ether")});
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
      Token balance: {this.state.tokenBalance}
      <br></br>
      Minimum tokens mintable: {this.state.minimumTokens}
      <br></br>
      Minimum collateral: {this.state.numTokens* this.state.GCR}
      <br></br>
      (Make sure you have enough wETH in your account)
      <br></br>
      Dont have wETH? buy some here with ETH: <Input type="number" placeholder= "0" onChange={this.handleWETHChange} />
      <Button variant="contained" color="secondary" onClick={this.handleBuyWETH}>Buy WETH</Button>
      <br></br>

      Token amount to mint: <Input type="number" placeholder="100" onChange={this.handleNumTokenChange} />
      <br></br>
      wETH amount as collateral: <Input type="number" placeholder= {(this.state.numTokens* this.state.GCR)} onChange={this.handleNumCChange} />
      <br></br>
      Approve wETH and mint tokens:  <Button variant="contained" color="secondary" onClick={this.handleApproveAndMintTokens}>Approve wETH and Mint Tokens</Button>
      <br></br>
      Already approved? <Button variant="contained" color="secondary" onClick={this.handleMintTokens}>Mint Tokens</Button>
      <br></br>
      <div style = {styles3}>{this.state.error}</div>
      </div>
      </div>
    );
  }
}
export default App;
