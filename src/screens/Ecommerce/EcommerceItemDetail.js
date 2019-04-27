// @flow
import * as React from 'react';

import { AppState, Animated, ToastAndroid, Easing, View, Platform, Image, DeviceEventEmitter, StyleSheet, Text, ScrollView, FlatList, ActivityIndicator, Dimensions, TouchableHighlight, TouchableOpacity, AsyncStorage, Picker } from 'react-native';

import type { NavigationScreenProp } from 'react-navigation';
import { HOME, ECOMMERCE_OFFERS, ECOMMERCE_CHECKOUT } from '../../constants/navigationConstants';
import { Container, Wrapper, Footer } from '../../components/Layout';
import Header from '../../components/Header';
import { Paragraph } from '../../components/Typography';
import Button from '../../components/Button';

type Props = {
  navigation: NavigationScreenProp<*>,
};

class EcommerceItemDetailScreen extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
        isLoading: true,
        dataSource: [],
        id: '',
        name: '',
        qty: '',
        color: '',
        price: '',
        shop: '',
        subtotal: '',
        placed_on: '',
    };
    this.updateQty = this.updateQty.bind(this);
    this.updateColor = this.updateColor.bind(this);
    this.saveProductObject = this.saveProductObject.bind(this);
    this.removeItemValue = this.removeItemValue.bind(this);
    this.getValue = this.getValue.bind(this);
    this.cart = [];
  }

  updateQty = (qty) => {
      this.setState({ qty: qty })
  }

  updateColor = (color) => {
      this.setState({ color: color })
  }

  async saveProductObject() {
    let prodObj = {
        id: 978,
        name: 'Tshirt',
        qty: this.state.qty,
        color: this.state.color,
        shop: this.props.navigation.state.params.shop,
        price: this.props.navigation.state.params.product_price,
        subtotal: this.props.navigation.state.params.product_price * this.state.qty,
        placed_on: new Date().toLocaleString(),
    };
    if(!isNaN(this.state.qty) && this.state.qty >=1) {
      try {
          const existing = await AsyncStorage.getItem('products');
          const offers = JSON.stringify(prodObj);
          this.cart.push(prodObj);
          await AsyncStorage.setItem('products',JSON.stringify(this.cart));
          //this.removeItemValue('products');
          this.props.navigation.navigate(ECOMMERCE_CHECKOUT);
      } catch (error) {
          console.log('Save product error: ' + error);
      }
    } else {
      ToastAndroid.show('Please select the quantity first', ToastAndroid.SHORT);
    }

  };

  async removeItemValue(key) {
      try {
          await AsyncStorage.removeItem(key);
          return true;
      }
      catch(exception) {
        return false;
      }
  }

  async getValue() {
    try {
      const value = await AsyncStorage.getItem('products');

      if (value !== null) {
          console.log('%c Get Level: '+value+'', 'background: #222; color: #bada55');
          console.log(typeof value);

          const _castValue = JSON.parse(value);
          console.error(_castValue);
      }
    } catch (error) {
        console.log('%c Get Level Error: '+ error + '', 'background: #222; color: #bada55');
    }
  }

  componentDidMount() {
      this.makeRemoteRequest();
  }

  makeRemoteRequest = () => {
    return fetch('https://devagg.xyz/api/get_product_details?pid='+this.props.navigation.state.params.item)
    .then((response) => response.json())
    .then((responseJson) => {
      this.setState({
        isLoading: false,
        dataSource: responseJson.results,
      }, function(){});
    })
    .catch((error) =>{
      console.error(error);
    });
  };

  render() {
    return (
      <Container>
      <ScrollView>
        <Header title="ecommerce details" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <View style={styles.EcommerceItemDetailsProductWrapper}>
            <View>
              <Image
                source={{uri: this.props.navigation.state.params.product_picture }}
                style={styles.EcommerceItemDetailsProductImage}
              />
              <Text style={styles.EcommerceItemDetailsProductName}> {this.props.navigation.state.params.product_name}</Text>
              <Text style={styles.EcommerceItemDetailsProductDescription}>
            { /*this.props.navigation.state.params.EcommerceItemDetailsProduct_description */}
              </Text>
            </View>
            <Text style={styles.EcommerceItemDetailsProductPrice}>£ {this.props.navigation.state.params.product_price}</Text>
          </View>
          <View style={styles.EcommerceItemDetailsProductPickerWrapper}>
            <Picker style={styles.EcommerceItemDetailsProductPicker} selectedValue = {this.state.qty} onValueChange = {this.updateQty}>
               <Picker.Item label = "Quantity" value = "" />
               <Picker.Item label = "One" value = "1" />
               <Picker.Item label = "Two" value = "2" />
               <Picker.Item label = "Three" value = "3" />
               <Picker.Item label = "Four" value = "4" />
               <Picker.Item label = "Five" value = "5" />
               <Picker.Item label = "Six" value = "6" />
            </Picker>
          </View>
          <View style={styles.EcommerceItemDetailsProductPickerWrapper}>
            <Picker style={styles.EcommerceItemDetailsProductPicker} selectedValue = {this.state.color} onValueChange = {this.updateColor}>
               <Picker.Item label = "Black" value = "black" />
               <Picker.Item label = "White" value = "white" />
               <Picker.Item label = "Gray" value = "gray" />
               <Picker.Item label = "Red" value = "red" />
               <Picker.Item label = "Blue" value = "blue" />
            </Picker>
          </View>
          <Text style = {styles.text}>{/*this.state.qty*/} {/*this.state.color*/}</Text>
          <Button block marginBottom="20px" marginTop="20px" onPress={this.saveProductObject} title="Add to Cart" />
        </Wrapper>
        <Footer></Footer>
      </ScrollView>
      </Container>
    );
  }
}

const win = Dimensions.get('window');
const ratio = win.width/660; //660 is actual image width

const styles = StyleSheet.create({
    EcommerceItemDetailsProductWrapper: {
        borderTopWidth: 0,
        borderBottomWidth: 0,
        flex: 0,
        padding: 0,
    },
    EcommerceItemDetailsProductImage: {
        top: 1,
        left: 0,
        right: 0,
        height: 270,
        width: Dimensions.get('window').width,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    EcommerceItemDetailsProductPrice: {
        position: 'absolute',
        backgroundColor: '#FFDB3C',
        fontSize: 19,
        paddingLeft: 7,
        borderBottomRightRadius: 10,
        top: 0,
        left: 0,
        width: 100,
        height: 40,
        lineHeight: 40,
    },
    EcommerceItemDetailsProductName: {
        top: 21,
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'center',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    EcommerceItemDetailsProductDescription: {
        width: Dimensions.get('window').width / 1.2,
        marginTop: 40,
        margin: 20,
    },
    EcommerceItemDetailsProductButton: {
        marginTop: 50,
        marginLeft: 18,
        fontSize: 16,
        lineHeight: 35,
        backgroundColor: '#007AFF',
        textAlign: 'center',
        justifyContent: 'flex-start',
        alignItems: 'center',
        color: 'white',
        borderRadius: 50,
        width: 155,
        height: 35,
    },
    EcommerceItemDetailsProductPickerWrapper: {
      borderColor: 'gray',
      backgroundColor: 'white',
      borderWidth: 1,
      marginTop: 20,
      borderRadius: 50,
    },
    EcommerceItemDetailsProductPicker: {
      color: 'gray',
      borderWidth: 1,
      height: 55,
      borderColor: 'gray',
      borderRadius: 50,
      paddingLeft: 10,
    }
});

export default EcommerceItemDetailScreen;
