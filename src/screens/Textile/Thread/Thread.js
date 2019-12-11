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
import type { NavigationScreenProp } from 'react-navigation';

import { Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { MediumText } from 'components/Typography';
import Button from 'components/Button';
import { loadThreadAction, publishThreadItemsAction } from 'actions/textileActions';
import type { UIThreadItem } from 'models/Textile';
import { spacing } from 'utils/variables';


const FooterWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  loadThread: (threadKey: string) => void,
  publishThreadItems: (threadKey: string) => void,
  threadItems: UIThreadItem[],
};

class TextileThread extends React.Component<Props> {
  threadKey: string;

  componentDidMount() {
    const { navigation, loadThread } = this.props;
    this.threadKey = navigation.getParam('threadKey');
    loadThread(this.threadKey);
  }

  handleFormSubmit = () => {
    this.props.publishThreadItems(this.threadKey);
  };

  render() {
    const { threadItems } = this.props;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: `Thread ${this.threadKey} elements` }] }}
        keyboardAvoidFooter={(
          <FooterWrapper>
            <Button
              onPress={this.handleFormSubmit}
              title="Publish modified settings"
            />
          </FooterWrapper>
        )}
      >
        <Wrapper fullScreen>
          <MediumText>Items:</MediumText>
          {threadItems.map(({ stored }) => (
            <MediumText key={stored.key}>{stored.key}: {stored.value[stored.key]}</MediumText>
          ))}
        </Wrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  textile: {
    threadItems,
  },
}) => ({
  threadItems,
});

const mapDispatchToProps = (dispatch: Function) => ({
  loadThread: (threadKey: string) => dispatch(loadThreadAction(threadKey)),
  publishThreadItems: (threadKey: string) => dispatch(publishThreadItemsAction(threadKey)),
});

export default connect(mapStateToProps, mapDispatchToProps)(TextileThread);
