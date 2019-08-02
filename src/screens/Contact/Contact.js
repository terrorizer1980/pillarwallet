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
import {
  RefreshControl,
  Platform,
  View,
  // FlatList,
} from 'react-native';
import { connect } from 'react-redux';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { ImageCacheManager } from 'react-native-cached-image';
import { createStructuredSelector } from 'reselect';
// import get from 'lodash.get';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import {
  syncContactAction,
  disconnectContactAction,
  muteContactAction,
  blockContactAction,
} from 'actions/contactsActions';
import { fetchContactTransactionsAction } from 'actions/historyActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';
import { fetchContactBadgesAction } from 'actions/badgesActions';
import { Container, ScrollWrapper, Wrapper } from 'components/Layout';
import { logScreenViewAction } from 'actions/analyticsActions';
import { BADGE, SEND_TOKEN_FROM_CONTACT_FLOW } from 'constants/navigationConstants';
import { DISCONNECT, MUTE, BLOCK } from 'constants/connectionsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';
import Header from 'components/Header';
import ProfileImage from 'components/ProfileImage';
import CircleButton from 'components/CircleButton';
import ActivityFeed from 'components/ActivityFeed';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import { BaseText, BoldText } from 'components/Typography';
import Button from 'components/Button';
import { getSmartWalletStatus } from 'utils/smartWallet';
import { mapOpenSeaAndBCXTransactionsHistory, mapTransactionsHistory } from 'utils/feedData';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
// import { CollapsibleSection } from 'components/CollapsibleSection';
import Spinner from 'components/Spinner';
import type { ApiUser } from 'models/Contacts';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Badges } from 'models/Badge';
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';
import ConnectionConfirmationModal from './ConnectionConfirmationModal';
import ManageContactModal from './ManageContactModal';

const iconSend = require('assets/icons/icon_send.png');

const CircleButtonsWrapper = styled.View`
  margin-top: ${Platform.select({
    ios: '5px',
    android: '0px',
  })};
  padding-bottom: 30px;
  background-color: ${baseColors.snowWhite};
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
  justify-content: center;
  align-items: center;
`;

const MessageTitle = styled(BoldText)`
  font-size: ${fontSizes.small}px;
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: 10px;
  font-size: ${fontSizes.tiny}px;
  color: ${baseColors.darkGray};
  text-align: center;
`;

const EmptyStateWrapper = styled.View`
  margin-bottom: 30px;
`;

const ContentWrapper = styled.View`
  background-color: ${UIColors.defaultBackgroundColor};
  padding-top: ${Platform.select({
    ios: '25px',
    android: '19px',
  })};
`;

const ProfileImageWrapper = styled.View`
  position: relative;
  justify-content: center;
  align-items: center;
  margin: 0px 20px;
`;

type Props = {
  name: string,
  navigation: NavigationScreenProp<*>,
  contacts: ApiUser[],
  syncContact: Function,
  fetchContactTransactions: (contactAddress: string, asset?: string) => Function,
  chats: Object[],
  session: Object,
  disconnectContact: Function,
  muteContact: Function,
  blockContact: Function,
  smartWalletState: Object,
  accounts: Accounts,
  history: Array<*>,
  deploySmartWallet: Function,
  openSeaTxHistory: Object[],
  contactsBadges: Badges,
  fetchContactBadges: Function,
  isFetchingBadges: boolean,
  logScreenView: (view: string, screen: string) => void,
};

type State = {
  showManageContactModal: boolean,
  showConfirmationModal: boolean,
  manageContactType: string,
  isBadgesSectionOpen: boolean,
  relatedTransactions: Object[],
};

class Contact extends React.Component<Props, State> {
  isComponentMounted: boolean = false;
  localContact: ?ApiUser;
  activityFeedRef: ?Object;
  scroll: Object;

  constructor(props: Props) {
    super(props);
    const { navigation, contacts } = this.props;
    this.activityFeedRef = React.createRef();
    const contactName = navigation.getParam('username', '');
    const contact = navigation.getParam('contact', { username: contactName });
    this.localContact = contacts.find(({ username }) => username === contact.username);
    this.scroll = React.createRef();
    this.state = {
      showManageContactModal: false,
      showConfirmationModal: false,
      manageContactType: '',
      isBadgesSectionOpen: true,
      relatedTransactions: [],
    };
  }

  componentDidMount() {
    const {
      fetchContactTransactions,
      syncContact,
      session,
      navigation,
      // fetchContactBadges,
      logScreenView,
    } = this.props;
    this.isComponentMounted = true;
    const contactName = navigation.getParam('username', '');
    const contact = navigation.getParam('contact', { username: contactName });
    const defaultImageCacheManager = ImageCacheManager();
    this.getRelatedTransactions();

    if (contact.profileImage && session.isOnline) {
      defaultImageCacheManager
        .deleteUrl(contact.profileImage, {
          useQueryParamsInCacheKey: true,
        })
        .catch(() => null);
      defaultImageCacheManager
        .deleteUrl(contact.profileLargeImage, {
          useQueryParamsInCacheKey: true,
        })
        .catch(() => null);
    }

    const localContact = this.localContact; // eslint-disable-line
    if (localContact && session.isOnline) {
      syncContact(localContact.id);
      // fetchContactBadges(localContact);
      fetchContactTransactions(localContact.ethAddress);
    }
    logScreenView('View contact', 'Contact');
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.history !== this.props.history || prevProps.openSeaTxHistory !== this.props.openSeaTxHistory) {
      this.getRelatedTransactions();
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  getRelatedTransactions = () => {
    const {
      navigation,
      history,
      contacts,
      openSeaTxHistory,
    } = this.props;
    const contactName = navigation.getParam('username', '');
    const contact = navigation.getParam('contact', { username: contactName });
    const localContact = contacts.find(({ username }) => username === contact.username);
    const displayContact = localContact || contact;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = mapTransactionsHistory(tokenTxHistory, contacts, TRANSACTION_EVENT);
    const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);
    const mappedCTransactions = mapTransactionsHistory(collectiblesTransactions, contacts, COLLECTIBLE_TRANSACTION);

    const relatedTransactions = [...transactionsOnMainnet, ...mappedCTransactions]
      .filter(({ username }) => username === displayContact.username);
    this.setState({ relatedTransactions });
  };

  getUserAvatar = (isAccepted, url, updateTime) => {
    if (isAccepted && updateTime) {
      return `${url}?t=${updateTime}`;
    }
    return url;
  };

  showManageContactModalTrigger = () => {
    this.setState({
      showManageContactModal: true,
    });
  };

  manageContact = (manageContactType: string) => {
    this.setState({
      showManageContactModal: false,
      manageContactType,
    });

    setTimeout(() => {
      this.setState({ showConfirmationModal: true });
    }, 1000);
  };

  confirmManageAction = (status: ?string = '') => {
    // here will be called the action to manageContactType (block, disconnect, mute)
    const { navigation, contacts } = this.props;
    const {
      manageContactType,
    } = this.state;

    const contact = navigation.getParam('contact', {});
    const theContact = contacts.find(({ username }) => username === contact.username);
    if (!theContact) {
      return;
    }
    if (manageContactType === DISCONNECT) {
      this.props.disconnectContact(theContact.id);
    } else if (manageContactType === MUTE) {
      const mute = !(status === 'muted');
      this.props.muteContact(theContact.id, mute);
    } else if (manageContactType === BLOCK) {
      const block = !(status === 'blocked');
      this.props.blockContact(theContact.id, block);
    }

    setTimeout(() => {
      this.setState({
        showConfirmationModal: false,
      });
    }, 1000);
  };

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { badge: item, hideDescription: true })}
      />
    );
  };

  onSendPress(contact: Object): void {
    const { navigation } = this.props;

    navigation.navigate(SEND_TOKEN_FROM_CONTACT_FLOW, { contact });
  }

  toggleBadgesSection = () => {
    this.setState({ isBadgesSectionOpen: !this.state.isBadgesSectionOpen });
  };

  renderEmptyBadgesState = () => {
    const { isFetchingBadges } = this.props;
    if (isFetchingBadges) {
      return (
        <Spinner />
      );
    }

    return (
      <EmptyStateWrapper>
        <EmptyStateParagraph
          title="No badges"
          bodyText="This user does not have badges yet"
        />
      </EmptyStateWrapper>
    );
  };

  render() {
    const {
      navigation,
      contacts,
      fetchContactTransactions,
      // chats,
      smartWalletState,
      accounts,
      deploySmartWallet,
      // contactsBadges,
    } = this.props;
    const {
      showManageContactModal,
      showConfirmationModal,
      manageContactType,
      // isBadgesSectionOpen,
      relatedTransactions = [],
    } = this.state;

    const contactName = navigation.getParam('username', '');
    const contact = navigation.getParam('contact', { username: contactName });
    // NOTE: we need a fresh copy of the contact here as the avatar might be changed
    const localContact = contacts.find(({ username }) => username === contact.username);
    const isAccepted = !!localContact;
    const displayContact = localContact || contact;

    // due to the fact that profileLargeImage is not being passed in connections notifications payload for now
    // profileImage is set here as a fallback so requester's avatar (if exists) would be visible
    const existingProfileImage = displayContact.profileLargeImage || displayContact.profileImage;
    const userAvatar = existingProfileImage
      ? this.getUserAvatar(isAccepted, existingProfileImage, displayContact.lastUpdateTime)
      : undefined;

    // const chatInfo = chats.find(chat => chat.username === displayContact.username) || { unread: 0 };
    // const unreadCount = chatInfo.unread;

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const disableSend = !!Object.keys(sendingBlockedMessage).length;

    // const contactBadges = get(contactsBadges, contact.username, []);

    let activityFeedData = relatedTransactions;
    if (isAccepted) {
      activityFeedData = [...activityFeedData, { ...localContact, type: TYPE_ACCEPTED }];
    }

    return (
      <Container color={isAccepted ? baseColors.white : UIColors.defaultBackgroundColor} inset={{ bottom: 0 }}>
        <Header
          white
          title={displayContact.username}
          onBack={() => navigation.goBack(null)}
          showRight
          onNextPress={this.showManageContactModalTrigger}
          nextIcon={displayContact.status ? 'more' : null}
        />
        <ScrollWrapper
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                fetchContactTransactions(displayContact.ethAddress);
              }}
            />
          }
          innerRef={ref => { this.scroll = ref; }}
        >
          <ContentWrapper>
            <ProfileImageWrapper>
              <ProfileImage
                uri={userAvatar}
                userName={displayContact.username}
                borderWidth={4}
                initialsSize={fontSizes.extraGiant}
                diameter={164}
                style={{ backgroundColor: baseColors.geyser }}
                imageUpdateTimeStamp={displayContact.lastUpdateTime}
              />
            </ProfileImageWrapper>
            {isAccepted &&
              <View>
                <CircleButtonsWrapper>
                  <CircleButton
                    disabled={disableSend}
                    label="Send"
                    icon={iconSend}
                    onPress={() => this.onSendPress(displayContact)}
                  />
                  {disableSend &&
                  <Wrapper regularPadding style={{ marginTop: 30, alignItems: 'center' }}>
                    <MessageTitle>{ sendingBlockedMessage.title }</MessageTitle>
                    <Message>{ sendingBlockedMessage.message }</Message>
                    {smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED &&
                    <Button
                      marginTop="20px"
                      height={52}
                      title="Deploy Smart Wallet"
                      disabled={smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYING}
                      onPress={() => deploySmartWallet()}
                    />
                    }
                  </Wrapper>
                  }
                </CircleButtonsWrapper>
                <ActivityFeed
                  feedTitle="activity."
                  noBorder
                  ref={(ref) => { this.activityFeedRef = ref; }}
                  navigation={navigation}
                  feedData={activityFeedData}
                  showArrowsOnly
                  contentContainerStyle={{ paddingBottom: 10 }}
                  esComponent={(
                    <View style={{
                        width: '100%',
                        alignItems: 'center',
                        paddingTop: 10,
                        paddingBottom: 35,
                      }}
                    >
                      <EmptyStateParagraph
                        title="Make your first step"
                        bodyText="Your activity will appear here."
                      />
                    </View>
                  )}
                />
                { /* <CollapsibleSection
                  label="game of badges."
                  collapseContent={
                    <FlatList
                      data={contactBadges}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={this.renderBadge}
                      style={{ width: '100%' }}
                      contentContainerStyle={[
                        { paddingHorizontal: 10 },
                        !contactBadges.length ? { width: '100%', justifyContent: 'center' } : {},
                        ]}
                      horizontal
                      initialNumToRender={5}
                      removeClippedSubviews
                      ListEmptyComponent={this.renderEmptyBadgesState}
                    />
                  }
                  onPress={this.toggleBadgesSection}
                  open={isBadgesSectionOpen}
                  onAnimationEnd={
                    isBadgesSectionOpen
                    ? () => { this.scroll.scrollToEnd(); }
                    : () => {}
                  }
                /> */}
              </View>
            }
          </ContentWrapper>
        </ScrollWrapper>
        <ManageContactModal
          showManageContactModal={showManageContactModal}
          onManageContact={this.manageContact}
          onModalHide={() => {
            this.setState({ showManageContactModal: false });
          }}
          contactStatus={displayContact.status}
        />
        <ConnectionConfirmationModal
          showConfirmationModal={showConfirmationModal}
          manageContactType={manageContactType}
          contact={displayContact}
          onConfirm={() => { this.confirmManageAction(displayContact.status); }}
          onModalHide={() => {
            this.setState({ showConfirmationModal: false });
          }}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  chat: { data: { chats } },
  session: { data: session },
  smartWallet: smartWalletState,
  accounts: { data: accounts },
  badges: { contactsBadges, isFetchingBadges },
}) => ({
  contacts,
  chats,
  session,
  smartWalletState,
  accounts,
  contactsBadges,
  isFetchingBadges,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});


const mapDispatchToProps = (dispatch: Function) => ({
  syncContact: userId => dispatch(syncContactAction(userId)),
  fetchContactTransactions: (contactAddress) => dispatch(fetchContactTransactionsAction(contactAddress)),
  disconnectContact: (contactId: string) => dispatch(disconnectContactAction(contactId)),
  muteContact: (contactId: string, mute: boolean) => dispatch(muteContactAction(contactId, mute)),
  blockContact: (contactId: string, block: boolean) => dispatch(blockContactAction(contactId, block)),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
  fetchContactBadges: (contact) => dispatch(fetchContactBadgesAction(contact)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(Contact);
