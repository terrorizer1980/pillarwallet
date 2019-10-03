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
import { Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { Svg, Path } from 'react-native-svg';
import Modal from 'react-native-modal';
import { connect } from 'react-redux';

import Header from 'components/Header';
import Spinner from 'components/Spinner';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

import Player from 'react-native-video-player';

import { responsiveSize } from 'utils/ui';
import { baseColors } from 'utils/variables';

type Props = {
  buttonColor?: string,
  buttonArrowColor?: string,
  buttonStyle?: Object,
  isOnline: boolean,
  videoUri: string,
}

type State = {
  isVideoVisible: boolean,
  isLoaded: boolean,
}

const { width: screenWidth } = Dimensions.get('window');

const PlayerButton = styled.TouchableOpacity`
  justify-content: center;
  align-items: center;
  width: ${responsiveSize(132)};
  height: ${responsiveSize(78)};
  border-radius: ${responsiveSize(7)};
  background-color: ${props => props.buttonColor};
  elevation: 14;
  box-shadow: 0px 14px 24px rgba(0,0,0,0.1);
`;

const ButtonArrow = styled.View`
  width: ${props => props.diameter}px;
  height: ${props => props.diameter}px;
  border-radius: ${props => props.diameter / 2}px;
  background-color: ${props => props.arrowColor};
  align-items: center;
  justify-content: center;
`;

const ModalContentWrapper = styled.View`
  background-color: ${baseColors.black};
  flex: 1;
`;

const ContentWrapper = styled.View`
  flex: 1;
  justify-content: center;
`;

const MessageWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const PlayerWrapper = styled.View`
  height: ${props => props.videoHeight}px;
  width: 100%;
  margin-top: ${props => `-${props.videoHeight / 2}`}px;
  position: absolute;
  left: 0;
  top: 50%;
  opacity: ${props => props.isVideoReady ? 1 : 0};
`;

const StyledHeader = styled(Header)`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

const buttonIconSideWidth = responsiveSize(38);

class VideoPlayer extends React.Component<Props, State> {
  static defaultProps = {
    buttonColor: baseColors.electricBlue,
    buttonArrowColor: baseColors.white,
  };

  state = {
    isVideoVisible: false,
    isLoaded: false,
  };

  hideVideo = () => {
    this.setState({ isVideoVisible: false, isLoaded: false });
  };

  render() {
    const { isVideoVisible, isLoaded } = this.state;
    const {
      buttonColor,
      buttonArrowColor,
      buttonStyle,
      isOnline,
      videoUri,
    } = this.props;

    const videoHeight = (screenWidth / 16) * 9;
    return (
      <React.Fragment>
        <PlayerButton
          buttonColor={buttonColor}
          style={buttonStyle}
          onPress={() => this.setState({ isVideoVisible: true })}
        >
          <ButtonArrow diameter={buttonIconSideWidth} arrowColor={buttonArrowColor}>
            <Svg
              height={responsiveSize(18)}
              width={responsiveSize(16)}
              style={{ backgroundColor: 'transparent', marginLeft: 4 }}
            >
              <Path
                d={`M 0,0
                l 0,${responsiveSize(18)}
                l ${responsiveSize(16)},-${responsiveSize(9)} Z`}
                fill={buttonColor}
              />
            </Svg>
          </ButtonArrow>
        </PlayerButton>
        <Modal
          isVisible={isVideoVisible}
          animationIn="fadeIn"
          animationOut="fadeOut"
          hideModalContentWhileAnimating
          onBackButtonPress={this.hideVideo}
          onModalHide={this.hideVideo}
          style={{ margin: 0, flex: 1 }}
        >
          <ModalContentWrapper>
            <StyledHeader light flexStart onClose={this.hideVideo} />
            <ContentWrapper>
              {!isOnline && !isLoaded
                ?
                  <MessageWrapper>
                    <EmptyStateParagraph
                      title="Can't show video"
                      titleStyle={{ color: baseColors.white }}
                      bodyText="No active internet connection found"
                    />
                  </MessageWrapper>
                :
                  <React.Fragment>
                    {!isLoaded && <Spinner style={{ alignSelf: 'center' }} />}
                    <PlayerWrapper isVideoReady={isLoaded} videoHeight={videoHeight}>
                      <Player
                        video={{ uri: videoUri }}
                        videoWidth={screenWidth}
                        videoHeight={videoHeight}
                        autoplay
                        hideControlsOnStart
                        onReadyForDisplay={() => { this.setState({ isLoaded: true }); }}
                        customStyles={{
                          seekBarProgress: { backgroundColor: baseColors.electricBlue },
                          seekBarKnob: { backgroundColor: baseColors.electricBlue },
                        }}
                      />
                    </PlayerWrapper>
                  </React.Fragment>}
            </ContentWrapper>
          </ModalContentWrapper>
        </Modal>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  session: { data: { isOnline } },
}) => ({
  isOnline,
});


export default connect(mapStateToProps)(VideoPlayer);
