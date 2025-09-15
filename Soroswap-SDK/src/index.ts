import "dotenv/config"
import {SupportedNetworks, type SoroswapSDKConfig, SoroswapSDK, type QuoteRequest, TradeType, SupportedProtocols, type BuildQuoteRequest} from '@soroswap/sdk'
import { Keypair, Networks, Transaction } from '@stellar/stellar-sdk'

const NETWORK = SupportedNetworks.TESTNET;
const api_key = process.env.SOROSWAP_API_KEY
const API_BASE_URL = process.env.SOROSWAP_API_URL || 'https://api.soroswap.finance';
const userSecret = process.env.USER_SECRET!
const userKeypair = Keypair.fromSecret(userSecret)

if(!api_key) throw new Error('no api key found on .env file')
const sdkConfig: SoroswapSDKConfig = {
  apiKey: api_key,
  defaultNetwork: NETWORK,
  baseUrl: API_BASE_URL,
  timeout: 30000
}

const EXAMPLE_ADDRESSES = {
  USER: userKeypair.publicKey(),
  XLM_ASSET: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  USDC_ASSET: 'CDWEFYYHMGEZEFC5TBUDXM3IJJ7K7W5BDGE765UIYQEV4JFWDOLSTOEK',
};

async function rateLimitDelay(): Promise<void> {
  console.log('⏳ Waiting 1 second to respect API rate limits...');
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function runExample(): Promise<void> {
  const sdk = new SoroswapSDK(sdkConfig)

  const quoteRequest: QuoteRequest = {
    assetIn: EXAMPLE_ADDRESSES.XLM_ASSET,
    assetOut: EXAMPLE_ADDRESSES.USDC_ASSET,
    amount: BigInt(10000000), // 1 XLM (7 decimals)
    tradeType: TradeType.EXACT_IN,
    protocols: [SupportedProtocols.SOROSWAP],
    slippageBps: 80
  };

  try {
    const quote = await sdk.quote(quoteRequest)
    await rateLimitDelay()

    const buildedQuoteParams: BuildQuoteRequest = {
      quote: quote,
      from: EXAMPLE_ADDRESSES.USER,
      to: EXAMPLE_ADDRESSES.USER
    }
    await rateLimitDelay()

    const buildedQuoteResponse = await sdk.build(buildedQuoteParams, SupportedNetworks.TESTNET)
    const transaction: Transaction = new Transaction(buildedQuoteResponse.xdr, Networks.TESTNET)
    transaction.sign(userKeypair)

    const signedTx = transaction.toXDR()
    await rateLimitDelay()


    const result = await sdk.send(signedTx)
    console.log(result)

    
  } catch (error) {
    console.log(error)
  }
}
runExample()