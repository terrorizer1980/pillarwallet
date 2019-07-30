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
import { Platform, TouchableOpacity, TouchableNativeFeedback } from 'react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import { fontSizes, baseColors } from 'utils/variables';
import Tooltip from 'components/Tooltip';

type Props = {
  tooltipText: string,
  fontSize?: number,
  buttonSize?: number,
}

type State = {
  tooltipVisible: boolean,
}

const defaultButtonSize = 16;

const ButtonText = styled(BaseText)`
  font-size: ${props => props.fontSize || fontSizes.extraExtraSmall};
  color: ${props => props.color || baseColors.coolGrey};
  line-height: ${props => props.buttonSize || defaultButtonSize}px;
  text-align: center;
  width: ${props => props.buttonSize || defaultButtonSize}px;
  height: ${props => props.buttonSize || defaultButtonSize}px;
  border-width: 1px;
  border-color: ${props => props.color ? props.color : baseColors.coolGrey};
  border-radius: ${props => (props.buttonSize || defaultButtonSize) / 2}px;
`;

const Wrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const ButtonTextView = <ButtonText>?</ButtonText>;

export default class ButtonTooltip extends React.Component<Props, State> {
  state = {
    tooltipVisible: false,
  };
  target: ?Object;

  dismissTooltip = () => {
    this.setState({ tooltipVisible: false });
  };

  onButtonPress = () => {
    this.setState({ tooltipVisible: true });
  };

  setRef = (ref: ?Object) => {
    this.target = ref;
  };

  render() {
    return (
      <Wrapper>
        {(Platform.OS === 'ios' &&
          <TouchableOpacity
            ref={this.setRef}
            onPress={this.onButtonPress}
          >
            {ButtonTextView}
          </TouchableOpacity>
        ) ||
          <TouchableNativeFeedback
            ref={this.setRef}
            onPress={this.onButtonPress}
            background={TouchableNativeFeedback.SelectableBackgroundBorderless()}
          >
            {ButtonTextView}
          </TouchableNativeFeedback>
        }
        {!!this.target &&
          <Tooltip
            visible={this.state.tooltipVisible}
            target={this.target}
            text={this.props.tooltipText}
            onPress={this.dismissTooltip}
            popoverProps={{
              onRequestClose: this.dismissTooltip,
            }}
          />
        }
      </Wrapper>
    );
  }
}
