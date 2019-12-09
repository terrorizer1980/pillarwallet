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
import Textile, { IThread } from '@textile/react-native-sdk';
import type { NavigationScreenProp } from 'react-navigation';

import { Container, Wrapper } from 'components/Layout';
import { MediumText } from 'components/Typography';
import { initTextileAction, onNodeStartedAction } from 'actions/textileActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  initTextile: () => void,
  onNodeStarted: () => void,
  initialized: boolean,
  textileVersion: string,
  nodeStarted: boolean,
  threads: IThread[],
};

type State = {};

class TextileHome extends React.Component<Props, State> {
  listeners: Object[] = [];
  state = {};

  componentDidMount() {
    this.props.initTextile();

    this.listeners.push(
      Textile.events.addNodeStartedListener(() => this.props.onNodeStarted()),
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
    const {
      initialized,
      textileVersion,
      nodeStarted,
      threads,
    } = this.props;
    return (
      <Container>
        <Wrapper fullScreen>
          <MediumText>Textile initialized: {initialized.toString()}</MediumText>
          <MediumText>Textile version: {textileVersion || '-'}</MediumText>
          <MediumText>Textile node started: {nodeStarted.toString()}</MediumText>
          <MediumText>Threads:</MediumText>
          {threads.map(({ key }) => <MediumText key={key}>{key}</MediumText>)}
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  textile: {
    initialized,
    textileVersion,
    nodeStarted,
    threads,
  },
}) => ({
  initialized,
  textileVersion,
  nodeStarted,
  threads,
});

const mapDispatchToProps = (dispatch: Function) => ({
  initTextile: () => dispatch(initTextileAction()),
  onNodeStarted: () => dispatch(onNodeStartedAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(TextileHome);
