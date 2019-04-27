// @flow
import * as React from 'react';

import { View, Image, StyleSheet, Text } from 'react-native';

import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';
import { HOME, ECOMMERCE_OFFERS } from '../../constants/navigationConstants';
import { Container, Wrapper, Footer } from '../../components/Layout';
import GreetOffer from '../../components/EmptyState/EmptyChat';
import Header from '../../components/Header';
import { Paragraph, TextLink, BaseText } from '../../components/Typography';
import Button from '../../components/Button';
import Checkbox from '../../components/Checkbox';
import { fontSizes, fontTrackings } from '../../utils/variables';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  userCheck: boolean,
  visibleModal: any,
  scrollOffset?: any,
};

const HomeHeaderLeft = styled.View`
  flex: 0 0 40px;
  align-items: flex-start;
`;

const CheckboxText = styled(BaseText)`
  font-size: ${fontSizes.small}px;
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
  line-height: 20px;
`;

const ModalInnerWrapper = styled.ScrollView`
  padding: 10px 16px 60px;
`;

const width = '80%';
var ecommWelcome = require('../../assets/images/ecommerceWelcome.png');
var ecommWelcomeUri = require('../../assets/images/ecommerceWelcome.png');

class EcommerceScreen extends React.Component<Props> {
  state = {
    userCheck: false,
    visibleModal: null,
    scrollOffset: null,
  };

  toggleCheckbox = (field: string) => {
    const {
      userCheck,
    } = this.state;

    if (field === 'userCheck') {
      this.setState({
        userCheck: !userCheck,
      });
    }
  };

  goToEcommerce = () => {
    this.props.navigation.navigate(ECOMMERCE_OFFERS);
  };

  goHome = () => {
    this.props.navigation.navigate(HOME);
  };

  render() {
    const offersTitle = 'Check The Offers';
    const offersBodyText = 'Pillar is a product aggregator where PLR tokens can be traded for goods';
    let userAgreed;

    if (this.state.userCheck) {
      userAgreed = <Button block marginBottom="20px" marginTop="20px" onPress={this.goToEcommerce} title="Check Out Offers" />;
    }
    else {
      userAgreed = <Text></Text>;
    }

    return (
      <Container>
        <Header title="ecommerce" onBack={() => this.props.navigation.goBack(null)} />
          <GreetOffer
            title={offersTitle}
            bodyText={offersBodyText}
          />
        <Footer>
          <View style={styles.EcommerceContainerImage}>
          <Image
            style={styles.EcommerceImage}
            resizeMode= "contain"
            source={require('../../assets/images/ecommerceWelcome.png')} />
          </View>
          <Checkbox
            onPress={() => this.toggleCheckbox('userCheck')}
          >
            <CheckboxText>
              {'I’m aware that the next section would be subject to spend '}
              <TextLink onPress={() => { this.setState({ visibleModal: PRIVATE_KEY_MODAL }); }}>
                my PLR or other cryptocurrencies I might have
              </TextLink>
              {' and any order I will place will not be refundable once deducted'}
            </CheckboxText>
          </Checkbox>
          <View>
            {userAgreed}
          </View>
          <Button block onPress={this.goHome} secondary title="Home" />
        </Footer>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
    EcommerceContainerImage: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F5FCFF',
    },
    EcommerceImage: {
      paddingTop: -50,
      width: 250,
      height: 250,
    }
});

export default EcommerceScreen;
