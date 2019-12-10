// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import { Linking } from 'react-native';

import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { TX_DETAILS_URL } from 'react-native-dotenv';

import { BaseText, MediumText } from 'components/Typography';
import { Wrapper } from 'components/Layout';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';

import { fontSizes, fontStyles, spacing } from 'utils/variables';
import { getSmartWalletStatus } from 'utils/smartWallet';

import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';

type DeploymentMessage = {
  title: string,
  message: string,
}

type Props = {
  buttonLabel?: string,
  message: DeploymentMessage,
  buttonAction?: ?() => void,
  smartWalletState: SmartWalletReducerState,
  accounts: Accounts,
  forceRetry?: boolean,
}

const MessageTitle = styled(MediumText)`
  ${fontStyles.large};
  text-align: center;
  margin: 0 10px 10px;
`;

const Message = styled(BaseText)`
  padding-top: ${spacing.small}px;
  ${fontStyles.medium}
`;

const ButtonsWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: ${spacing.medium}px 0;
`;

class DeploymentView extends React.PureComponent<Props> {
  openOnEtherscan = (hash) => {
    const url = TX_DETAILS_URL + hash;
    Linking.openURL(url);
  };

  render() {
    const {
      message = {},
      buttonLabel,
      buttonAction,
      smartWalletState,
      accounts,
      forceRetry,
    } = this.props;
    const { title, message: bodyText } = message;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    const { upgrade: { deploymentStarted, deploymentData: { hash } } } = smartWalletState;
    const isDeploying = deploymentStarted
      || [
        SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
        SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS,
      ].includes(smartWalletStatus.status);

    return (
      <Wrapper
        flex={1}
        style={{ marginTop: 8, padding: spacing.large }}
      >
        <MessageTitle>{title}</MessageTitle>
        <Message>{bodyText}</Message>
        <Wrapper flex={1} style={{ margin: spacing.small, width: '100%', alignItems: 'center' }}>
          {(!isDeploying || forceRetry) && buttonAction && buttonLabel &&
            <Button
              marginTop={spacing.mediumLarge.toString()}
              height={52}
              title={buttonLabel}
              onPress={buttonAction}
            />
          }
          {isDeploying &&
          <ButtonsWrapper>
            <Button
              title="Smart Wallet FAQ"
              onPress={() => {}}
            />
            {!!hash &&
            <ButtonText
              buttonText="See on Etherscan"
              onPress={() => this.openOnEtherscan(hash)}
              fontSize={fontSizes.medium}
              wrapperStyle={{ marginTop: 15 }}
            />}
          </ButtonsWrapper>
          }
        </Wrapper>
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  accounts: { data: accounts },
  smartWallet: smartWalletState,
}) => ({
  smartWalletState,
  accounts,
});

export default connect(mapStateToProps)(DeploymentView);
