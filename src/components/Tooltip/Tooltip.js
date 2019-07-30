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
import styled from 'styled-components';
import Popover from 'react-native-popover-view';

import { spacing } from 'utils/variables';
import { BaseText } from 'components/Typography';

const PopoverWrapper = styled.TouchableOpacity`
  padding: ${spacing.small}px;
`;
const PopoverText = styled(BaseText)`

`;

type Props = {
  target: Object, // tooltip target element ref
  children?: React.Node,
  text?: string,
  popoverProps?: Popover.props,
  visible?: boolean;
  onPress?: Function;
};

const Tooltip = (props: Props) => {
  const {
    target,
    children,
    text,
    visible,
    onPress,
    popoverProps = {},
  } = props;
  return (
    <Popover
      isVisible={!!visible}
      fromView={target}
      animationConfig={{ duration: 0 }}
      {...popoverProps}
    >
      <PopoverWrapper onPress={() => !!onPress && onPress()}>
        {children || <PopoverText>{text}</PopoverText>}
      </PopoverWrapper>
    </Popover>
  );
};

export default Tooltip;
