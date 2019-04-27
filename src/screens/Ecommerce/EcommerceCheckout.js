// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Sentry } from 'react-native-sentry';
import { Contract, utils, providers } from 'ethers';
import type { NavigationScreenProp } from 'react-navigation';
import { AppState, Animated, Easing, View, Platform, Image, DeviceEventEmitter, StyleSheet, Text, TextInput, ScrollView, AsyncStorage, Picker, FlatList, TouchableOpacity, TouchableHighlight, TouchableNativeFeedback } from 'react-native';
import { HOME, ECOMMERCE_OFFERS, ECOMMERCE_ITEM_DETAIL, SEND_TOKEN_TRANSACTION, ECOMMERCE_PAYMENT_CONFIRM } from '../../constants/navigationConstants';
import { Container, Wrapper, Footer } from '../../components/Layout';
import Header from '../../components/Header';
import CheckPin from '../../components/CheckPin';
import { Paragraph, TextLink, BaseText } from '../../components/Typography';
import Button from '../../components/Button';
import type { Assets, Balances, Asset } from '../../models/Asset';
import type { TransactionPayload, Transaction } from '../../models/Transaction';
import type { GasInfo } from '../../models/GasInfo';


import {
  sendAssetAction,
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
} from '../../actions/assetsActions';

import { spacing, fontSizes } from '../../utils/variables';
import styled from 'styled-components/native';
import { ETH, PLR, defaultFiatCurrency } from '../../constants/assetsConstants';
import { getBalance, getRate } from '../../utils/assets';
import { fetchERC20Balance, transferERC20 } from '../../services/assets';
//import { listDataFixtures } from './DataFixtures';

const GAS_LIMIT = 500000;
const MIN_TX_AMOUNT = 0.000000000000000001;
const NORMALIZED_AMOUNT = 1000000000000;

const SLOW = 'min';
const NORMAL = 'avg';
const FAST = 'max';

const SPEED_TYPES = {
  [SLOW]: 'Slow',
  [NORMAL]: 'Normal',
  [FAST]: 'Fast',
};


type Props = {
  navigation: NavigationScreenProp<*>,
  sendAsset: (transactionPayload: TransactionPayload, wallet: Object, navigate: Function) => Function,
  fetchInitialAssets: (walletAddress: string) => Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  fetchERC20Balance: (walletAddress: string, contractAddress: string, decimals: int) => Function,
  assets: Assets,
  balances: Balances,
  amount: string,
  wallet: Object,
  rates: Object,
  address: string,
  fetchGasInfo: Function,
  gasInfo: GasInfo,
};

type State = {
  transactionPayload: TransactionPayload,
  transactionSpeed: string,
  isChecking: boolean,
};

const contractTest = '0x9366605f6758727AD0FbcE0D1A2a6c1CD197F2A3';
const contractlive = '0xe3818504c1b32bf1557b16c238b2e01fd3149c17';

const WalletAddress = styled(BaseText)`
  font-size: ${fontSizes.medium};
`;

class EcommerceCheckoutScreen extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    const transactionPayload = this.props.navigation.getParam('transactionPayload', {});
    this.state = {
      isChecking: false,
      transactionSpeed: NORMAL,
      isLoading: false,
      cartFeed: [],
      merchantsWallets: [],
      usdVal: 0.00,
      ethVal: 0.00,
      plrVal: 0.00,
      availablePLR: 0,
      leftAfteSpend: 0,
      isBalanceGoodToGo: false,
      fullname: 'Receiver Full Name',
      shippingAddr1: 'Address Details 1',
      shippingAddr2: 'Address Details 2',
      trx_id: '',
      ecommOrderGen: 'GENERATOR',
    };
    this.feedCart = this.feedCart.bind(this);
  }

  getTxFeeInWei = (txSpeed?: string) => {
    txSpeed = txSpeed || this.state.transactionSpeed;
    const { gasInfo } = this.props;
    const gasPrice = 8; //gasInfo.gasPrice[txSpeed] || 0; // 20
    const gasPriceWei = utils.parseUnits(gasPrice.toString(), 'gwei');
    return gasPriceWei.mul(GAS_LIMIT);
  };

  makeAJudgement = () => {
    const {
      wallet,
    } = this.props;
    return fetchERC20Balance(wallet.address, '0x9366605f6758727AD0FbcE0D1A2a6c1CD197F2A3', 18)
    .then((value) => {
      this.setState({
        availablePLR: value,
      }, function(){});
    })
    .then(() => {
      let leftAfteSpend = parseFloat(this.state.availablePLR) - parseFloat(this.state.plrVal);
      if(leftAfteSpend >= 1 && !isNaN(leftAfteSpend)) {
        this.setState({
          isBalanceGoodToGo: true,
          leftAfteSpend: leftAfteSpend,
        }, function(){});
      }
      else {
        this.setState({
          isBalanceGoodToGo: false,
        }, function(){});
      }
    })
    .catch((error) =>{
      console.error(error);
    });
  }

  makeRemoteRequestForPriceOffering = (argv) => {
    return fetch('https://devagg.xyz/api/get_price_converted_offer?usdprice='+argv)
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isLoading: false,
        ethVal: responseJson.results.value_in_ETH,
        plrVal: responseJson.results.value_in_PLR,
      }, function(){
        this.makeAJudgement();
      });
    })
    .catch((error) =>{
      console.error(error);
    });
  };

  // in use componentDidMount()
  makeRemoteRequestForFetchingMerchantsWallet = () => {
    const {
      cartFeed,
    } = this.props;
    //let pids = [];
    let cartFeedSerialized = btoa(JSON.stringify(this.state.cartFeed));
    return fetch('https://devagg.xyz/api/get_merchants_addresses?pids='+cartFeedSerialized)
    .then((response) => response.json())
    .then((responseJson) => {
      //console.error(responseJson);
      this.setState({
        isLoading: false,
        merchantsWallets: responseJson.wallets,
      }, function(){

      });
    })
    .catch((error) =>{
      console.error(error);
    });
  };

  // debug, moved to confirmation screen
  makeRemoteRequestForPushingTxHashAndOrderObject = () => {
    const {
      cartFeed,
      usdVal,
      ethVal,
      plrVal,
      wallet,
      trx_id,
      fullname,
      shippingAddr1,
      shippingAddr2,
    } = this.props;
    let cartFeedSerialized = btoa(JSON.stringify(this.state.cartFeed));
    return fetch('https://devagg.xyz/api/set_order?cart_object='+cartFeedSerialized+'&usd_price='+this.state.usdVal+'&eth_price='+this.state.ethVal+'&plr_price='+this.state.plrVal+'&customer_ship_addr_1='+this.state.shippingAddr1+'&customer_ship_addr_2='+this.state.shippingAddr2+'&customer_wallet_addr='+wallet.address+'&trx_id='+this.state.trx_id)
    .then((response) => response.json())
    .then((responseJson) => {
      console.error(responseJson);
      this.setState({
        isLoading: false,
        merchantsWallets: responseJson.wallets,
      }, function(){

      });
    })
    .catch((error) =>{
      console.error(error);
    });
  };

  makeBalanceRequest = () => {
    const {
      wallet,
    } = this.props;
    try {
      return fetchERC20Balance(wallet.address, '0x9366605f6758727AD0FbcE0D1A2a6c1CD197F2A3', 18)
      .then((value) => {
        //console.error('the result in promise: '+value);
        this.setState({
          availablePLR: value,
        }, function(){});
      })
      .then(() => {
        let leftAfteSpend = parseFloat(this.state.availablePLR) - parseFloat(this.state.plrVal);
        //console.log('the result from  makeBalanceRequest() - availablePLR: '+this.state.availablePLR +', plrVal: '+parseFloat(this.state.plrVal));
        this.setState({
          leftAfteSpend: leftAfteSpend,
        }, function(){});
      })
      .catch((error) =>{
        console.error(error);
      });
    } catch (error) {
        console.log('%c Get Level Error: '+ error + '', 'background: #222; color: #bada55');
    }
  };

  async feedCart() {
    try {
      let tconvUsd = 0;
      const value = await AsyncStorage.getItem('products');
      if (value !== null) {
        const castValue = JSON.parse(value);
        for(index in castValue) {
            tconvUsd += castValue[index].subtotal;
        }
        this.makeRemoteRequestForPriceOffering(tconvUsd);
        this.setState({
          cartFeed: castValue,
          usdVal: tconvUsd,
        }, function(){});
      }
    }
    catch (error) {
      console.log('%c Feed Cart '+ error + '', 'background: #222; color: #bada55');
    }
  }

  isLeftBalanceHealthy = () => {
    if((this.state.leftAfteSpend) >= 1) {
      return true;
    }
    return false;
  }

  verifyPriceOnAggregatorAndAvailableFunds = () => {
    try {
      const {
        plrVal,
        availablePLR,
      } = this.props;
      if(!isNaN(this.state.availablePLR) && !isNaN(this.state.plrVal)) {
        if(this.isLeftBalanceHealthy()) {
          this.makeRemoteRequestForFetchingMerchantsWallet();
        }
      }
    }
    catch (error) {
      console.log('%c Verifying the PLR cart and PLR balance failed to be checked '+ error + '', 'background: #222; color: #bada55');
    }
  }

  handleTransaction = (pin: string, wallet: Object) => {
    const { sendAsset } = this.props;
    const { plrVal } = this.state;
    const txFeeInWei = this.getTxFeeInWei();
    const value = this.state.plrVal;
    const { navigation } = this.props;
    const gasPrice = txFeeInWei.div(GAS_LIMIT).toNumber();
    if (!value) return;
    const transactionPayload: TransactionPayload = {
      to: this.state.merchantsWallets[0],
      amount: value * NORMALIZED_AMOUNT,
      gasLimit: GAS_LIMIT,
      gasPrice,
      txFeeInWei,
      symbol: 'PLR',
      contractAddress: contractTest,
      decimals: 6,
    };
    this.setState({
      isChecking: true,
    }, () => sendAsset(transactionPayload, wallet, this.handleNavigationToTransactionState));
  };

  handleNavigationToTransactionState = (params: ?Object) => {
    const { navigation, wallet } = this.props;
    const { cartFeed, ecommOrderGen, usdVal, ethVal, plrVal, shippingAddr1, shippingAddr2 } = this.state;
    navigation.navigate(ECOMMERCE_PAYMENT_CONFIRM, { ...params, ecommOrderBundle: cartFeed, ecommOrderGen: ecommOrderGen, usdVal: usdVal, ethVal: ethVal, plrVal: plrVal, shippingAddr1: shippingAddr1, shippingAddr2: shippingAddr2, customerWallet: wallet.address, customerName: ''});
  };

  componentDidMount() {

    const {
      fetchInitialAssets,
      assets,
      wallet,
      plrVal,
      availablePLR,
    } = this.props;
    this.feedCart();
    this.makeBalanceRequest();
    //console.log('%c Verifying the componentDidMount() '+ parseFloat(this.state.availablePLR) + ' - ' + parseFloat(this.state.plrVal), 'background: #800000; color: #00ff00');
    this.verifyPriceOnAggregatorAndAvailableFunds();
    this.makeRemoteRequestForFetchingMerchantsWallet();
  }

  componentDidUpdate() {
    const {
      navigation,
    } = this.props;
  }

  renderRow({item}) {
    //const { navigation } = this.props;
    const name = `${item.name}`;
    const qty = `${item.qty}`;
    const price = `${item.price}`;
    const subtotal = `${item.subtotal}`;
    let actualRowComponent =
      <View style={[styles.EcommerceOffersCheckoutParent]}>
         <View style={[styles.EcommerceOffersCheckoutChild1, {} ]}>
           <Text style={[styles.EcommerceOffersCheckoutProductHeading]}>PRODUCT </Text>
           <Text style={[styles.EcommerceOffersCheckoutProductHeading, styles.EcommerceOffersCheckoutShared]}>{name} </Text>
         </View>
         <View style={[styles.EcommerceOffersCheckoutChild2, {} ]}>
           <Text style={[styles.EcommerceOffersCheckoutProductHeading]}>QTY </Text>
           <Text style={[styles.EcommerceOffersCheckoutProductHeading, styles.EcommerceOffersCheckoutShared]}>{qty} </Text>
         </View>
         <View style={[styles.EcommerceOffersCheckoutChild3, {} ]}>
            <Text style={[styles.EcommerceOffersCheckoutProductHeading]}>SUBTOTAL </Text>
            <Text style={[styles.EcommerceOffersCheckoutProductHeading, styles.EcommerceOffersCheckoutShared], {color: '#007AFF', fontWeight: 'bold', fontSize: 17}}>£ {subtotal} </Text>
         </View>
          <View style={[styles.EcommerceOffersCheckoutChild4, {backgroundColor: '#CCCCCC', display: 'none'} ]}>
            <Text style={[styles.EcommerceOffersCheckoutChild4text]}>x</Text>
         </View>
       </View>

    let touchableWrapperIos =
      <TouchableHighlight
        activeOpacity={0.5}
        onPress={
          () => {
            //navigation.navigate(ECOMMERCE_ITEM_DETAIL, {...item});
          }
        }
      >
        {actualRowComponent}
      </TouchableHighlight>;

    let touchableWrapperAndroid =
      <TouchableNativeFeedback
        useForeground={true}
        background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
        onPress={
          () => {
            //navigation.navigate(ECOMMERCE_ITEM_DETAIL, {...item});
          }
        }
      >
        {actualRowComponent}
      </TouchableNativeFeedback>;

    if (require('react-native').Platform.OS === 'ios') {
      return touchableWrapperIos;
    }

    else return touchableWrapperAndroid;
  };

  render() {
    const {
      assets,
      wallet,
      balances,
      amount,
      address,
      fetchInitialAssets,
      availablePLR,
      gasInfo,
    } = this.props;
    const {
      isChecking,
      transactionSpeed,
    } = this.state;
    const plrWallet = wallet.address;
    const txFeeInWei = this.getTxFeeInWei();
    const yMessage = <Paragraph style={{marginBottom: 20, fontSize: 14}}>By continuing you agree with deducting
                      <Text style={{color: '#007AFF', fontWeight: 'bold'}}> {this.state.plrVal} PLR </Text>
                      from {wallet.address} resulting a
                      <Text style={{color: '#007AFF', fontWeight: 'bold'}}> { (this.state.availablePLR - this.state.plrVal).toFixed(3) } PLR </Text>
                      left in your balance
                      </Paragraph>;
    const nMessage = <Paragraph style={{marginBottom: 20, fontSize: 14}}>Can't place this order. Something went wrong. Sufficient funds?</Paragraph>;
    return (
      <Container>
      <ScrollView>
        <Header title="ecommerce checkout" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph></Paragraph>
          <FlatList
            style={styles.EcommerceCheckoutContainerRow}
            data={this.state.cartFeed}
            renderItem={this.renderRow}
            keyExtractor={(item, index) => index.toString()}
          />
          <View style={[styles.EcommerceOffersCheckoutParent], {display: 'none'}}>
             <View style={styles.EcommerceCheckoutDivider} />
             <View style={[styles.EcommerceOffersCheckoutChild1, {} ]}>
               <Text style={[styles.EcommerceOffersCheckoutProductHeading]}>Tracking Hash</Text>
               <Text style={[styles.EcommerceOffersCheckoutProductHeading, styles.EcommerceOffersCheckoutShared]}>2019-09-02-HHYU2-QWYAKS8-PPLMQ11</Text>
             </View>
          </View>
          <View style={{ }}>
             <View style={styles.EcommerceCheckoutDivider} />
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
               <Text style={styles.EcommerceCheckoutPriceContainer} >
                   <Text style={styles.EcommerceCheckoutPriceTag}>£ </Text>
                   <Text style={styles.EcommerceCheckoutPriceUSDValue}> {this.state.usdVal}</Text>
               </Text>
             </View>
             <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
               <Text style={styles.EcommerceCheckoutPriceContainer} >
                   <Text style={styles.EcommerceCheckoutPriceTag}>PLR </Text>
                   <Text style={styles.EcommerceCheckoutPriceUSDValue}> {this.state.plrVal}</Text>
               </Text>
             </View>
             <View style={styles.EcommerceCheckoutDivider} />
              {this.state.isBalanceGoodToGo ? yMessage : nMessage}
              {this.state.isBalanceGoodToGo &&
              <TextInput
                 style={{height: 55, borderColor: 'gray', borderWidth: 1, borderRadius: 50, paddingLeft: 10, marginBottom: 20}}
                 placeholder={this.state.fullname}
               />
              }
              {this.state.isBalanceGoodToGo &&
              <TextInput
                 style={{height: 55, borderColor: 'gray', borderWidth: 1, borderRadius: 50, paddingLeft: 10, marginBottom: 20}}
                 placeholder={this.state.shippingAddr1}
               />
               }
               {this.state.isBalanceGoodToGo &&
               <TextInput
                  style={{height: 55, borderColor: 'gray', borderWidth: 1, borderRadius: 50, paddingLeft: 10, marginBottom: 20}}
                  placeholder={this.state.shippingAddr2}
                />
               }
             <View style={styles.EcommerceCheckoutDivider} />
           </View>
           { this.state.isBalanceGoodToGo &&
           <CheckPin onPinValid={this.handleTransaction} isChecking={isChecking} />
           }
        </Wrapper>
        <Footer></Footer>
        </ScrollView>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  EcommerceCheckoutContainerRow: {
    marginTop: 14,
    alignSelf: "stretch",
  },
  EcommerceCheckoutPriceContainer: {
    marginRight: 25,
  },
  EcommerceCheckoutPriceTag: {
    alignSelf: 'flex-end',
    color: '#000000',
    fontSize: 19,
    fontWeight: 'bold',
  },
  EcommerceCheckoutPriceUSDValue: {
    alignSelf: 'flex-end',
    color: '#007AFF',
    fontSize: 33,
    fontWeight: 'bold',
  },
  EcommerceCheckoutDivider: {
    borderBottomColor: '#DCDCDC',
    borderBottomWidth: 0.5,
    marginTop: 20,
    marginBottom: 20,
  },
  EcommerceOffersCheckoutParent: {
       margin: '1%',
       width: '98%',
       height: 90,
       flexDirection: 'row',
       flexWrap: 'wrap',
       borderColor: '#FFFFFF',
       borderWidth: 0.5,
       borderRadius: 4,
       backgroundColor: '#FFFFFF',
       marginBottom: 1,
   },
   EcommerceOffersCheckoutChild1: {
       width: '45%',
       height: "90%",
       paddingTop: 25,
       paddingLeft: 10,
   },
   EcommerceOffersCheckoutChild2: {
       width: '10%',
       height: "90%",
       paddingTop: 25,
   },
   EcommerceOffersCheckoutChild3: {
       width: '30%',
       height: "90%",
       paddingTop: 25,
   },
   EcommerceOffersCheckoutChild4: {
       flexDirection: 'row',
       width: '9%',
       height: '90%',
       aspectRatio: 1,
       justifyContent: 'center',
       alignItems: 'center',
       borderRadius: 100,
       marginTop: 10,
   },
   EcommerceOffersCheckoutChild4text: {
       fontSize: 21,
       marginTop: -5,
       color: 'white',
       fontWeight: 'bold',
   },
   EcommerceOffersCheckoutProductHeading: {
       fontSize: 13,
       color: '#BBBBBB',
   },
   EcommerceOffersCheckoutShared: {
       fontSize: 17,
       color: '#000000',
       fontWeight: 'bold',
   },
});

const mapStateToProps = ({
  assets: { data: assets },
  wallet: { data: wallet },
}) => ({
  assets: Object.values(assets),
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  sendAsset: (transaction: TransactionPayload, wallet: Object, navigate) => {
    dispatch(sendAssetAction(transaction, wallet, navigate));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(EcommerceCheckoutScreen);
