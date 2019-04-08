// @flow
import '@babel/polyfill';
import * as React from 'react';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';
import { providers, Wallet, utils } from 'ethers';
import Box from '3box/src/3box';
// import Box from '3box';
import type { NavigationScreenProp } from 'react-navigation';
import { NETWORK_PROVIDER } from 'react-native-dotenv';

// components
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { Paragraph } from 'components/Typography';

// utils
import { getEthereumProvider, getInfuraEthereumProvider, hashEthereumMessage } from 'utils/common';


type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: Object,
  user: Object,
}

class DidScreen extends React.Component<Props, *> {
  state = {
    boxInstance: null,
  };

  async componentDidMount() {
    const { wallet } = this.props;
    const provider = getInfuraEthereumProvider('homestead');
    const myWallet = new Wallet('0x0f088b9b5e49631542172452fd1c5438e0550eb5fbbb2ab9feb3ca67ba09cda5');
    myWallet.provider = provider;
    provider.sendAsync = (function (signer) {
      return function (data = {}, cb) {
        if (data.method === 'personal_sign') {
          let encodedText = data.params[0];
          if (encodedText.slice(0, 2) === '0x') {
            encodedText = encodedText.slice(2);
          }
          const text = Buffer.from(encodedText, 'hex').toString('utf8');
          const sig = signer.signMessage(text);
          cb(null, { result: sig });
          return sig;
        }
        return this.send(data, cb);
      };
    }(myWallet));

    // const text = 'This app wants to view and update your 3Box profile.';
    // const sig = myWallet.signMessage(text);
    // console.log('sig', sig);

    // provider.send(method, params).then((result) => {
    //   console.log('result', result);
    // }).catch(console.log);

    // providers.JsonRpcProvider.prototype.sendAsync = providers.JsonRpcProvider.prototype.send;
    // const provider2 = new providers.JsonRpcProvider();

    // const provider = getWeb3EthereumProvider('homestead');
    // console.log('getWeb3EthereumProvider', provider);
    // console.log('getWeb3EthereumProvider sendAsync', provider.sendAsync);
    // console.log('JsonRpcProvider', provider2);
    Box.openBox(wallet.address, provider)
      .then(boxInstance => {
        console.log('boxInstance', boxInstance);
        this.setState({ boxInstance });
      })
      .catch(console.log);

    // const profile = await Box.getProfile('0x23bed6a56615208a740aec7f6fa30d97d90b9686');
    // console.log(wallet.address, profile);
  }

  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    return !isEqual(this.props, nextProps);
  }

  render() {
    const { wallet } = this.props;
    const { boxInstance } = this.state;
    return (
      <Container inset={{ bottom: 0 }}>
        <Header title="3Box" />
        <Paragraph>Address: {wallet.address}</Paragraph>
        <Paragraph>Box opened: {boxInstance ? 'true' : 'false'}</Paragraph>
      </Container >
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  user: { data: user },
}) => ({
  wallet,
  user,
});

const mapDispatchToProps = (dispatch) => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(DidScreen);
