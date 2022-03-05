import { useState, useEffect } from 'react';
import { POSClient, use } from "@maticnetwork/maticjs"
import { Web3ClientPlugin } from '@maticnetwork/maticjs-web3'
import Web3 from 'web3'
// import Network from "@maticnetwork/meta/network"
import BigNumber from "bignumber.js"


import './App.css';

use(Web3ClientPlugin)

const TEN = new BigNumber(10)

// define network
const networkName = 'testnet' // 'mainnet'
const networkVersion = 'mumbai' // 'v1'

// get all network details from polygon's static repo
// you can define details locally, but getting details from
// this repo is recommended
// const network = new Network(networkName, networkVersion)

// const MainNetworkDetails = Object.freeze(network.Main) // all info related to Main
// const MaticNetworkDetails = Object.freeze(network.Matic)  // all info related to Matic

const tokenAddress = '0xfe4F5145f6e09952a5ba9e956ED0C25e3Fa4c7F1' // can get from polygon faucet
const toAddress = '0x2254E4D1B41F2Dd3969a79b994E6ee8C3C6F2C71'
const tokenDecimals = 18

function App() {

  const [currentAccount, setCurrentAccount] = useState(null);
  const [currentNetworkId, setCurrentNetworkId] = useState(null);
  const [posClient, setPosClient] = useState(null);
  const [isPosClientInitialized, setIsPosClientInitialized] = useState(false);

  const [tokenBalance, setTokenBalance] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const checkWalletIsConnected = async () => {
    if (typeof window.ethereum !== 'undefined') {
      console.log("Metamask is installed")
    } else {
      console.log("Metamask not installed");
    }

    const { ethereum } = window;

    const accounts = await ethereum.request({ method: 'eth_accounts' });



    if (accounts.length > 0) {
      // set current account
      const account = accounts[0];
      setCurrentAccount(account);

      // get current chainId just for information
      setCurrentNetworkId(ethereum.networkVersion)
    } else {
      console.log("No account found");
    }
  }

  const connectWalletHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Metamask not installed");
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
      console.log("Connected to account: ", accounts[0]);
    } catch (err) {
      console.log(err)
    }
  }

  const amount = 0.1

  const transferTokenHandler = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      alert("Metamask not installed");
    }

    try {
      const unparsedToAmount = new BigNumber(amount).times(
        TEN.pow(new BigNumber(tokenDecimals))
      ).toString()

      const erc20Token = posClient.erc20(tokenAddress);

      const result = await erc20Token.transfer(unparsedToAmount, toAddress);
      console.log(erc20Token);

      const txHash = await result.getTransactionHash();
      setTxHash(txHash)

      const txReceipt = await result.getReceipt();
      console.log('txReceipt:', txReceipt);

    } catch (err) {
      console.log(err)
    }
  }


  const connectWalletButton = () => {
    return (
      <button onClick={connectWalletHandler} className='cta-button connect-wallet-button'>
        Connect Wallet
      </button>
    )
  }

  const transferTokenButton = () => {
    return (
      <button onClick={transferTokenHandler} className='cta-button connect-wallet-button' disabled={!isPosClientInitialized}>
        Transfer Token
      </button>
    )
  }

  const accountDetails = () => {
    return (
      <div className='details'>
        <h2>Account Details</h2>
        <p className='detail'>
          <span>Chain Id: </span>
          <span>{currentNetworkId}</span>
        </p>
        <p className='detail'>
          <span>Connected account: </span>
          <span>{currentAccount}</span>
        </p>
      </div>
    )
  }

  const tokenDetails = () => {
    return (
      <div className='details'>
        <h2>Token Details</h2>
        <p className='detail'>
          <span>TokenAddress: </span>
          <span>{tokenAddress}</span>
        </p>
        <p className='detail'>
          <span>TokenBalance: </span>
          <span>{tokenBalance}</span>
        </p>
      </div>
    )
  }

  const transactionDetails = () => {
    return (
      <div className='details'>
        <h2>Transaction Details</h2>
        <p className='detail'>
          <span>Sending to: </span>
          <span>{toAddress}</span>
        </p>
        <p className='detail'>
          <span>Transaction Hash: </span>
          <span>{txHash}</span>
        </p>
      </div>
    )
  }

  const otherOnboardingDetails = () => {
    return (
      <div className='details'>
        <h2>NOTE</h2>
        <p className='detail'>
          Please switch to <span>Mumbai Testnet network</span> for executing the transaction.
        </p>
        <p className='detail'>
          Currently used token is <span>Dummy ERC20 (DERC20)</span>
        </p>
        <p className='detail'>
          You can get this test token from <a href='https://faucet.polygon.technology/' target='_blank' rel='noreferrer noopener'>Polygon Faucet</a>.
          Select <span className='bold'>TEST ERC20 (POS)</span> on <span className='bold'>Mumbai Network</span>.
        </p>
      </div>
    )
  }

  useEffect(() => {
    checkWalletIsConnected();
  }, [])

  useEffect(() => {
    // initialize maticjs pos client
    if (currentAccount) {
      (async () => {
        const posClient = new POSClient();

        // window.ethereum will have the network
        // provider that is selected in metamask
        // for transfer, switch to polygon network
        var mainProvider = new Web3(window.ethereum);
        var maticProvider = new Web3(window.ethereum);

        await posClient.init({
          network: networkName,  // 'testnet' or 'mainnet'
          version: networkVersion, // 'mumbai' or 'v1'
          parent: {
            provider: mainProvider,
            defaultConfig: {
              from: currentAccount
            }
          },
          child: {
            provider: maticProvider,
            defaultConfig: {
              from: currentAccount
            }
          }
        });

        setPosClient(posClient)
      })()
    }
  }, [currentAccount, setPosClient])

  useEffect(() => {
    if (posClient) {
      try {

        setIsPosClientInitialized(true)
      } catch (e) {
        // todo: understand why try catch is required here
      }

      // get token balance
      (async () => {
        const { ethereum } = window;

        if (!ethereum) {
          alert("Metamask not installed");
        }

        try {
          const erc20Token = posClient.erc20(tokenAddress, false);

          const balance = await erc20Token.getBalance(currentAccount)

          const parsedTokenBalance = new BigNumber(balance).div(
            TEN.pow(new BigNumber(tokenDecimals))
          ).toString()
          setTokenBalance(parsedTokenBalance)

        } catch (err) {
          console.log(err)
        }
      })()
    } else {
      setIsPosClientInitialized(false)
    }
  }, [currentAccount, posClient])

  return (
    <div className='main-app'>
      <h1>DApp example with Polygon</h1>
      <div>
        {currentAccount ? transferTokenButton() : connectWalletButton()}
      </div>

      {accountDetails()}

      {tokenDetails()}

      {transactionDetails()}

      {otherOnboardingDetails()}

    </div>
  )
}

export default App;
