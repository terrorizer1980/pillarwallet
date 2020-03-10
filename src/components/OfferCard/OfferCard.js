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
import { View } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { CachedImage } from 'react-native-cached-image';
import type { ExternalProps as ButtonProps } from 'components/Button';
import type { Props as TextButtonProps } from 'components/ButtonText';

// components
import ShadowedCard from 'components/ShadowedCard';
import { BaseText } from 'components/Typography';
import Button from 'components/Button';
import ButtonText from 'components/ButtonText';

// utils
import { fontStyles } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { hexToRgba } from 'utils/ui';

// types
import type { Theme } from 'models/Theme';


type ImageObject = {
  uri: string,
};

type Props = {
  isDisabled?: boolean,
  onPress: () => void,
  labelTop: string,
  valueTop: string | number,
  cardImageSource?: string | ImageObject,
  cardTopButton?: TextButtonProps,
  labelBottom: string,
  valueBottom: string | number,
  cardMainButton?: ButtonProps,
  cardNote?: string,
  theme: Theme,
};


const CardWrapper = styled.TouchableOpacity`
  width: 100%;
`;

const CardRow = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-between;
  align-items: ${props => props.alignTop ? 'flex-start' : 'flex-end'};
  padding: 10px 0;
  ${({ withBorder, theme }) => withBorder
    ? `border-bottom-width: 1px;
       border-bottom-color: ${theme.colors.border};`
    : ''
}
`;

const CardInnerRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-left: 10px;
  flex-wrap: wrap;
`;

const CardColumn = styled.View`
  flex-direction: column;
  align-items: ${props => props.alignRight ? 'flex-end' : 'flex-start'};
  justify-content: flex-start;
`;

const CardText = styled(BaseText)`
  ${fontStyles.regular};
  letter-spacing: 0.18px;
  color: ${({ label, theme }) => label ? theme.colors.text : theme.colors.secondaryText};
  flex-wrap: wrap;
  width: 100%;
`;

const ProviderIcon = styled(CachedImage)`
  width: 24px;
  height: 24px;
`;

const CardNote = styled(BaseText)`
  flex-direction: row;
  align-items: center;
  padding: 4px 0;
  margin-left: 10px;
  color: ${themedColors.primary};
  ${fontStyles.regular};
`;

const OfferCard = (props: Props) => {
  const {
    isDisabled,
    onPress,
    labelTop,
    valueTop,
    cardImageSource,
    cardTopButton = {},
    labelBottom,
    valueBottom,
    cardMainButton = {},
    cardNote,
    theme,
  } = props;

  const colors = getThemeColors(theme);

  return (
    <ShadowedCard
      contentWrapperStyle={{ paddingHorizontal: 16, paddingVertical: 6 }}
      isAnimated
      spacingAfterAnimation={10}
      upperContentWrapperStyle={isDisabled ? { backgroundColor: hexToRgba(colors.card, 0.6) } : {}}
    >
      <CardWrapper
        disabled={isDisabled}
        onPress={onPress}
      >
        <CardRow withBorder alignTop>
          <CardColumn>
            <CardText label>{labelTop}</CardText>
            <CardText>{valueTop}</CardText>
          </CardColumn>
          <CardInnerRow style={{ flexShrink: 1 }}>
            {!!cardImageSource && <ProviderIcon source={cardImageSource} resizeMode="contain" />}
            {!!Object.keys(cardTopButton).length &&
            <ButtonText
              wrapperStyle={{ paddingVertical: 4, marginLeft: 10 }}
              {...cardTopButton}
            />
            }
            {!!cardNote && <CardNote>{cardNote}</CardNote>}
          </CardInnerRow>
        </CardRow>

        <CardRow>
          <CardColumn style={{ flex: 1 }}>
            <CardText label>{labelBottom}</CardText>
            <View style={{ flexDirection: 'row' }}>
              <CardText>{valueBottom}</CardText>
            </View>
          </CardColumn>
          <CardColumn>
            <Button
              small
              horizontalPadding={8}
              {...cardMainButton}
            />
          </CardColumn>
        </CardRow>
      </CardWrapper>
    </ShadowedCard>
  );
};

export default withTheme(OfferCard);
