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
import Textile from '@textile/react-native-sdk';
import type { NavigationScreenProp } from 'react-navigation';

import { Container, Wrapper } from 'components/Layout';
import { MediumText } from 'components/Typography';
import { initTextileAction } from 'actions/textileActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  initTextile: () => void,
  initialized: boolean,
  textileVersion: string,
};

type State = {
  nodeStarted: boolean,
};

class TextileHome extends React.Component<Props, State> {
  listeners: Object[] = [];
  state = {
    nodeStarted: false,
  };

  componentDidMount() {
    this.props.initTextile();

    this.listeners.push(
      Textile.events.addNodeStartedListener(() => {
        this.setState({ nodeStarted: true });
      }),
    );
  }

  componentWillUnmount() {
    this.listeners.forEach(listenerItem => listenerItem.cancel()); // TODO: cancel() or remove()?
  }

  /* navigateToWalletImportPage = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET_LEGALS);
  }; */

  render() {
    const { initialized, textileVersion } = this.props;
    const { nodeStarted } = this.state;
    return (
      <Container>
        <Wrapper fullScreen>
          <MediumText>Textile initialized: {initialized.toString()}</MediumText>
          <MediumText>Textile version: {textileVersion}</MediumText>
          <MediumText>Textile node started: {nodeStarted.toString()}</MediumText>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  textile: { initialized, textileVersion },
}) => ({
  initialized,
  textileVersion,
});

const mapDispatchToProps = (dispatch: Function) => ({
  initTextile: () => dispatch(initTextileAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(TextileHome);
