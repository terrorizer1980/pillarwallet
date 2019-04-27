// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import { DECRYPTING, INVALID_PASSWORD } from '../../constants/walletConstants';
import { checkPinAction } from '../../actions/authActions';
import { Container, Wrapper } from '../Layout';
import { BaseText } from '../Typography';
import Spinner from '../Spinner';
import ErrorMessage from '../ErrorMessage';
import PinCode from '../PinCode';

type Props = {
  checkPin: (pin: string, onValidPin: Function, options: Object) => Function,
  wallet: Object,
  revealMnemonic: boolean,
  onPinValid: Function,
  isChecking: boolean,
  title?: string,
}

const CheckPinWrapper = styled(Wrapper)`
  margin-top: auto;
  height: 100%;
  flex: 1;
`;

class CheckPin extends React.Component<Props, *> {
  static defaultProps = {
    revealMnemonic: false,
  };

  handlePinSubmit = (pin: string) => {
    const {
      checkPin,
      onPinValid,
      revealMnemonic,
    } = this.props;
    const options = {
      mnemonic: revealMnemonic,
    };
    checkPin(pin, onPinValid, options);
  };

  getPinError = (walletState: string) => {
    switch (walletState) {
      case INVALID_PASSWORD:
        return 'Invalid pincode';
      default:
        return null;
    }
  };

  render() {
    const { wallet: { walletState }, isChecking } = this.props;
    const pinError = this.getPinError(walletState);
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    if (walletState === DECRYPTING || isChecking) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>Checking</BaseText>
          <Spinner />
        </Container>
      );
    }

    return (
      <CheckPinWrapper>
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          showForgotButton={false}
          pinError={!!pinError}
        />
      </CheckPinWrapper>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  checkPin: (pin: string, onValidPin: Function, options: Object) => {
    dispatch(checkPinAction(pin, onValidPin, options));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CheckPin);
