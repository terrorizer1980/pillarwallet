// @flow
import '@babel/polyfill';
import * as React from 'react';
import isEqual from 'lodash.isequal';
import { connect } from 'react-redux';
import { providers, Wallet, utils } from 'ethers';
// import localStorage from 'react-native-sync-localstorage';
import Box from '3box/src/3box';
// import Box from '3box';
import type { NavigationScreenProp } from 'react-navigation';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import { Input } from 'native-base';

// components
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import { ButtonMini } from 'components/Button';

// utils
import { getEthereumProvider, getInfuraEthereumProvider } from 'utils/common';

type Props = {
  navigation: NavigationScreenProp<*>,
  wallet: Object,
  user: Object,
}

class DidScreen extends React.Component<Props, *> {
  box;
  state = {
    boxOpened: false,
    newNameValue: '',
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

    // await localStorage.getAllFromLocalStorage();
    Box.openBox(wallet.address, provider, {})
      .then(async box => {
        console.log('boxInstance', box);
        this.setState({ boxOpened: true });
        this.box = box;
        box.onSyncDone(res => console.log('onSyncDone', res));

        const profile = await Box.getProfile(wallet.address);
        console.log('profile', wallet.address, profile);

        return box;
      })
      .catch(console.log);
  }

  shouldComponentUpdate(nextProps: Props, nextState) { // TODO: type the state
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleGetName = () => {
    this.box.private.get('name')
      .then(console.log)
      .catch(console.log);
  };

  handleSetName = () => {
    const { newNameValue } = this.state;
    this.box.private.set('name', newNameValue)
      .then(console.log)
      .catch(console.log);
  };

  handleSetNameChange = (e) => {
    const value = e.nativeEvent.text;
    this.setState({ newNameValue: value });
  };

  render() {
    const { wallet } = this.props;
    const { boxOpened, newNameValue } = this.state;
    console.log('from render', this.state);
    return (
      <Container inset={{ bottom: 0 }}>
        <Header title="3Box" />
        <Paragraph>Address: {wallet.address}</Paragraph>
        <Paragraph>Box opened: {boxOpened ? 'true' : 'false'}</Paragraph>
        {boxOpened && <ButtonMini onPress={this.handleGetName} title="Get name" />}
        {boxOpened && (
          <React.Fragment>
            <Input onChange={this.handleSetNameChange} value={newNameValue} style={{ height: 30 }} />
            <ButtonMini onPress={this.handleSetName} title="Set name" />
          </React.Fragment>
        )}
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

export default connect(mapStateToProps)(DidScreen);
