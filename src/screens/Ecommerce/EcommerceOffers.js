// @flow
import * as React from 'react';

import { AppState, Animated, Easing, View, Platform, Image, DeviceEventEmitter, StyleSheet, Text, ScrollView, FlatList, ActivityIndicator, Dimensions, TouchableHighlight, TouchableOpacity } from 'react-native';
import { List, ListItem, SearchBar } from 'react-native-elements';

import type { NavigationScreenProp } from 'react-navigation';
import { HOME, ECOMMERCE_ITEM_DETAIL } from '../../constants/navigationConstants';
import { Container, Wrapper, Footer } from '../../components/Layout';
import Header from '../../components/Header';
import { Paragraph } from '../../components/Typography';
import Button from '../../components/Button';

type Props = {
  navigation: NavigationScreenProp<*>,
};

class EcommerceOffersScreen extends React.Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
        isLoading: true,
    };
  }

  componentDidMount() {
      this.makeRemoteRequest();
  }

  makeRemoteRequest = () => {
    return fetch('https://devagg.xyz/api/get_products')
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

  openItemDetail = (pid) => {
      this.props.navigation.navigate(ECOMMERCE_ITEM_DETAIL, { item: pid });
  }

  render() {
    return (
      <Container>
      <ScrollView>
        <Header title="ecommerce offers" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <View style={styles.EcommerceOffersContainerWrapper}>
            <FlatList
              data={this.state.dataSource}
              renderItem={ ({item}) =>
                  <ListItem
                      onPress={()=>this.props.navigation.navigate(ECOMMERCE_ITEM_DETAIL, {
                        item : item.id,
                        shop: item.shop,
                        product_name: item.product_name,
                        product_description: item.product_description,
                        product_picture: item.picture.large,
                        product_price: item.product_price,
                      })}
                      subtitle={
                          <View style={styles.EcommerceOffersContainerProduct}>
                              <View style={styles.EcommerceOffersContainerProductImage}>
                                  <Image
                                      source={{uri: item.picture.large}}
                                      style={styles.EcommerceOffersProductImage}
                                  />
                                  <TouchableOpacity onPress={() => this.openItemDetail.bind(this)}>
                                    <Text style={styles.EcommerceOffersProductName}>{item.product_name}</Text>
                                  </TouchableOpacity>
                                  <View style={styles.EcommerceOffersProductMore}>
                                      <Text style={styles.EcommerceOffersProductButton}>More</Text>
                                  </View>
                              </View>
                              <View>
                                  <Text style={styles.EcommerceOffersProductPrice}>£ {item.product_price}</Text>
                              </View>
                          </View>
                      }
                      containerStyle={ styles.EcommerceOffersListContainer }
                      rightIcon={{ style: { marginLeft: 20, fontSize:0 } }}
                      containerStyle={{ flexBasis: '50%' }}
                  />
              }
              keyExtractor={({id}, index) => id}
              numColumns={2}
              horizontal={false}
            />
          </View>
        </Wrapper>
        <Footer></Footer>
        </ScrollView>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
    EcommerceOffersContainerWrapper: {
      flex: 0,
      paddingTop:20,
    },
    EcommerceOffersContainerProduct: {
        borderTopWidth: 0,
        borderBottomWidth: 0,
        flex: 1,
        flexDirection: 'row',
        padding: 0,
    },
    EcommerceOffersContainerProductImage: {
        padding: 0,
        width: Dimensions.get('window').width / 2.28,
        height: 300,
        margin: 0,
        borderRadius: 10,
        shadowColor: '#aaaaaa',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
    },
    EcommerceOffersSubtitleView: {
        flexDirection: 'row',
        paddingLeft: 0,
        paddingBottom: 10,
        width: '100%',
    },
    EcommerceOffersProductName: {
        fontSize: 13,
        fontWeight: 'bold',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
    },
    EcommerceOffersProductMore: {
        width: Dimensions.get('window').width / 2.9,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    EcommerceOffersProductButton: {
      marginTop: 30,
      marginLeft: 18,
      fontSize: 16,
      lineHeight: 45,
      backgroundColor: '#007AFF',
      textAlign: 'center',
      justifyContent: 'flex-start',
      alignItems: 'center',
      color: 'white',
      borderRadius: 50,
      width: Dimensions.get('window').width / 3.2,
      height: 45,
    },
    EcommerceOffersProductImage: {
        top: -11,
        left: -10,
        right: 0,
        height: 170,
        width: Dimensions.get('window').width / 2.301,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    EcommerceOffersProductPrice: {
        position: 'absolute',
        backgroundColor: '#FFDB3C',
        fontSize: 16,
        padding: 3,
        borderTopLeftRadius: 10,
        borderBottomRightRadius: 10,
        top: -11,
        left: -10,
        width: 70,
        height: 30,
    },
});

export default EcommerceOffersScreen;
