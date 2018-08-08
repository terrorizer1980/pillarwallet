// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Item as NBItem, Input, Label } from 'native-base';
import { fontSizes, fontWeights, baseColors } from 'utils/variables';
import ButtonIcon from 'components/ButtonIcon';
import { BaseText, BoldText } from 'components/Typography';
import { View, TouchableOpacity, Platform } from 'react-native';

type inputPropsType = {
  placeholder?: string,
  onChange: Function,
  onBlur?: Function,
  value: ?string,
  multiline?: boolean,
}

type Props = {
  icon?: string,
  inlineLabel?: boolean,
  alignRight?: boolean,
  postfix?: string,
  label?: string,
  id?: string,
  iconColor?: string,
  errorMessage?: string,
  onIconPress?: Function,
  inputProps: inputPropsType,
  inputType: string,
  trim: boolean,
  footerAddonText?: string,
  footerAddonAction?: Function,
  autoCorrect?: boolean,
}

type State = {
  isFocused: boolean,
}

type EventLike = {
  nativeEvent: Object,
}

const inputTypes = {
  default: {
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.bold,
    textAlign: 'left',
  },
  amount: {
    fontSize: fontSizes.extraExtraLarge,
    fontWeight: fontWeights.bold,
    textAlign: 'right',
  },
};

const FloatingButton = styled(ButtonIcon)`
  position:absolute;
  right: 0;
  top: 20px;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin: 0;
  padding: 0;
`;

const ErrorMessage = styled(BaseText)`
  color: ${baseColors.fireEngineRed};
  flex: 1;
`;

const PostFix = styled(BoldText)`
  font-weight: 900;
  line-height: 22px;
  margin-top: 8px;
`;

const InputField = styled(Input)`
  font-weight: ${props => props.inputType.fontWeight};
  text-align: ${props => props.inputType.textAlign};
  padding: 0;
`;

const Item = styled(NBItem)`
  border-bottom-color: ${props => props.isFocused ? baseColors.electricBlue : baseColors.mediumGray};
`;

const InputFooter = styled(View)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 6px;
  margin-top: 6px;
`;

const AddonText = styled(BaseText)`
  color: ${baseColors.electricBlue};
  width: 100%;
  text-align: right;
`;

const CustomLabel = styled(Label)`
  color: ${baseColors.darkGray};
  font-size: ${fontSizes.extraSmall};
  letter-spacing: 0.5;
  font-weight: 600;
  line-height: 24px;
`;

class TextInput extends React.Component<Props, State> {
  state = {
    isFocused: false,
  };

  static defaultProps = {
    inputType: 'default',
    autoCorrect: false,
    trim: true,
  };

  handleBlur = (e: EventLike) => {
    if (Platform.OS === 'android' && e.nativeEvent.text === undefined) {
      return;
    }

    const { inputProps: { onBlur }, trim } = this.props;
    const value = trim ? e.nativeEvent.text.trim() : e.nativeEvent.text;
    if (onBlur) {
      onBlur(value);
    }
  };

  handleChange = (e: EventLike) => {
    const { inputProps: { onChange } } = this.props;
    const value = e.nativeEvent.text;
    onChange(value);
  };

  handleFocus = () => {
    this.setState({
      isFocused: true,
    });
  };

  render() {
    const {
      icon,
      postfix,
      label,
      onIconPress,
      iconColor = '#2077FD',
      inputProps,
      inlineLabel,
      errorMessage,
      footerAddonText,
      footerAddonAction,
      autoCorrect,
    } = this.props;
    const { value = '' } = inputProps;
    const { isFocused } = this.state;
    const inputType = inputTypes[this.props.inputType] || inputTypes.default;
    return (
      <View style={{ paddingBottom: 10 }}>
        <Item
          inlineLabel={inlineLabel}
          stackedLabel={!inlineLabel}
          error={!!errorMessage}
          style={inputProps.multiline && { height: 112 }}
          isFocused={isFocused}
        >
          {!!label && <CustomLabel>{label.toUpperCase()}</CustomLabel>}
          <InputField
            {...inputProps}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onEndEditing={() => this.handleBlur}
            onFocus={this.handleFocus}
            value={value}
            inputType={inputType}
            autoCorrect={autoCorrect}
            style={{ fontSize: inputType.fontSize }}
          />
          {!!icon && <FloatingButton onPress={onIconPress} icon={icon} color={iconColor} fontSize={30} />}
          {!!postfix && <PostFix>{postfix}</PostFix>}
        </Item>
        <InputFooter>
          {errorMessage ? <ErrorMessage>{errorMessage}</ErrorMessage> : <View />}
          {!!footerAddonText &&
            <TouchableOpacity onPress={footerAddonAction}>
              <AddonText>{footerAddonText}</AddonText>
            </TouchableOpacity>}
        </InputFooter>
      </View>
    );
  }
}

export default TextInput;
