import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import Token from "./build/token.json";
import weth from "./build/weth.json";
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import "./App.css";

const styles ={
  fontSize: '40px',
}
const styles2 ={
  lineHeight: '1.5em',
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
     tokenBalance: 0
   }

  }



  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const instance = new web3.eth.Contract(
        Token.abi,
        '0x53C5fd1c6F08D841E5E97240f7C6b6AcF6974e99',
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
    await this.state.wethContract.methods.approve("0x53C5fd1c6F08D841E5E97240f7C6b6AcF6974e99", "100000000000000000000")
    .send({ from: this.state.accounts})
    .on("receipt", async (receipt)=> {
        console.log("Approved to send wETH to EMP!");
        this.setState({error: "Approved to send wETH to EMP!"});
        await this.state.tokenContract.methods.create([this.state.web3.utils.toWei(collateral)],[this.state.web3.utils.toWei(tokenAmt)])
        .send({ from: this.state.accounts})
        .on("receipt", async (receipt)=> {
          console.log("Congratulations you created " + tokenAmt + " tokens");
          this.setState({error: "Congratulations you created " + tokenAmt + " tokens"});
          await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
            console.log("account " + this.state.accounts +" number of tokens is " + this.state.web3.utils.fromWei(cc.tokensOutstanding[0], "ether"));
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
      console.log("Congratulations you created " + tokenAmt + " tokens");
      await this.state.tokenContract.methods.positions(this.state.accounts).call().then(async cc=>{
        console.log("account " + this.state.accounts +" number of tokens is " + this.state.web3.utils.fromWei(cc.tokensOutstanding[0], "ether"));
      })
    })
    .on("error",  function(error) {
      console.log("error: "+ error)
    })
  }
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

  render() {
    return (
      <div className="App" > 
      <div style ={styles}>Mint your own uUSDwETH!!</div>
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
      </div>
      Token amount to mint: <Input type="number" placeholder="100" onChange={this.handleNumTokenChange} />
      <br></br>
      wETH amount as collateral: <Input type="number" placeholder= {(this.state.numTokens* this.state.GCR)} onChange={this.handleNumCChange} />
      <br></br>
      Approve wETH and mint tokens:  <Button variant="contained" color="secondary" onClick={this.handleApproveAndMintTokens}>Approve wETH and Mint Tokens</Button>
      <br></br>
      Already approved? <Button variant="contained" color="secondary" onClick={this.handleMintTokens}>Mint Tokens</Button>
      <br></br>
      {this.state.error}
      </div>
    );
  }
}
export default App;
