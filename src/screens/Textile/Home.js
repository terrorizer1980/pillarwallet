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
import type { NavigationScreenProp } from 'react-navigation';

import { Container, Wrapper } from 'components/Layout';
import { MediumText } from 'components/Typography';
import { initTextileAction } from 'actions/textileActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  navigateToNewWalletPage: Function,
  initialized: boolean,
}

type State = {
  // shouldAnimate: boolean,
}

class TextileHome extends React.Component<Props, State> {
  listeners: Object[] = [];
  state = {};
  // shouldAnimate: true,
  // };

  componentDidMount() {
    // this.props.initTextile()
    /* const { navigation } = this.props;

    this.listeners = [
      navigation.addListener('willFocus', () => this.setState({ shouldAnimate: true })),
      navigation.addListener('willBlur', () => this.setState({ shouldAnimate: false })),
    ]; */
  }

  componentWillUnmount() {
    this.listeners.forEach(listenerItem => listenerItem.remove());
  }

  loginAction = () => {
    this.props.navigateToNewWalletPage();
  };

  /* navigateToWalletImportPage = () => {
    const { navigation } = this.props;
    navigation.navigate(IMPORT_WALLET_LEGALS);
  }; */

  render() {
    const { initialized } = this.props;
    return (
      <Container>
        <Wrapper fullScreen>
          <MediumText>Textile initialized: {initialized.toString()}</MediumText>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  textile: { initialized },
}) => ({
  initialized,
});

const mapDispatchToProps = (dispatch: Function) => ({
  initTextile: () => dispatch(initTextileAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(TextileHome);
