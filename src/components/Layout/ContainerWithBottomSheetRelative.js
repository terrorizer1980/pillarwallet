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
  View,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  PanResponder,
  RefreshControl,
} from 'react-native';
import styled from 'styled-components/native';
import ExtraDimensions from 'react-native-extra-dimensions-android';
import { baseColors } from 'utils/variables';
import { getiOSNavbarHeight } from 'utils/common';
import Tabs from 'components/Tabs';
import { ContainerOuter, ContainerInner } from './Layout';

type Props = {
  children?: React.Node,
  center?: boolean,
  color?: string,
  style?: Object,
  inset?: Object,
  onLayout?: Function,
  innerStyle?: Object,
  bottomSheetChildren: React.Node,
  bottomSheetProps?: Object,
  hideSheet?: boolean,
  sheetHeight: number,
  topOffset: number,
  swipeToCloseHeight: number,
  onSheetOpen?: Function,
  onSheetClose?: Function,
  scrollingComponentsRefs?: Array<Object>, // list of refs of scrollable components.
  // Used to scroll all content of those components to the top once sheet is closed
  bottomSheetChildren?: React.Node,
  sheetWrapperStyle?: Object,
  forceOpen: boolean,
  captureTabs?: boolean,
  tabs?: Array<Object>,
  activeTab?: string,
  inverse?: boolean, // set to true if content should be absolute and positioned to the bottom of the sheet
  // (resulting in cropping overflow and revealing upper content on sheet opening)
  onRefresh?: Function,
};

type State = {
  screenHeight: number,
  animatedHeight: Animated.Value,
  isSheetOpen: boolean,
  isDragging: boolean,
  scrollEnabled: boolean,
};

export const Center = styled.View`
  align-items: center;
`;

const screenHeightFromDimensions = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;

const USABLE_SCREEN_HEIGHT = Platform.OS === 'android'
  ? ExtraDimensions.get('REAL_WINDOW_HEIGHT') - ExtraDimensions.getSoftMenuBarHeight()
  : screenHeightFromDimensions - getiOSNavbarHeight();

const ModalWrapper = styled.View`
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  padding-top: 10px;
  flex: 1;
  overflow: hidden;
`;

const Sheet = styled.View`
  width: 100%;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  background-color: ${baseColors.white};
  elevation: 10;
  shadow-color: ${baseColors.black};
  shadow-radius: 10px;
  shadow-opacity: 0.2;
  shadow-offset: 0px 11px;
  z-index: 9999;
`;

const FloatingHeader = styled.View`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  background-color: transparent;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  min-height: 80px;
`;

const Cover = styled.View`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  background-color: white;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  height: 40px;
  justify-content: flex-start;
  align-items: center;
  padding-top: 6px;
`;

const HandlebarsWrapper = styled.View`
  flex-direction: row;
  position: relative;
  height: 10px;
  width: 40px;
`;

const Handlebar = styled.View`
  height: 5px;
  width: 20px;
  background-color: ${baseColors.electricBlue};
  position: absolute;
  top: 2px;
  border-radius: 6px;
  ${props => props.right
    ? 'right: 2.2px;'
    : 'left: 2.2px;'}
`;

const ClickableBackdrop = styled.View`
  flex: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  background-color: ${baseColors.black};
`;

const AnimatedSheet = Animated.createAnimatedComponent(Sheet);
const AnimatedModalWrapper = Animated.createAnimatedComponent(ModalWrapper);
const AnimatedLeftHandlebar = Animated.createAnimatedComponent(Handlebar);
const AnimatedRightHandlebar = Animated.createAnimatedComponent(Handlebar);
const AnimatedClickableBackdrop = Animated.createAnimatedComponent(ClickableBackdrop);

const HORIZONTAL_TAB_BOUNDARIES = [14, screenWidth - 28];
const BACKDROP_OPACITY = 0.7;

const DOWN = 'DOWN';
const UP = 'UP';

const ABSOLUTE_SHEET_STYLE = {
  position: 'absolute',
  bottom: 0,
  left: 0,
};

const RELATIVE_SHEET_STYLE = {
  position: 'relative',
  bottom: 'auto',
  left: 'auto',
};


export default class ContainerWithBottomSheetRelative extends React.Component<Props, State> {
  panResponder: Object;
  isTransitioning: boolean;
  forceAnimateAfterNotCapturedTouch: boolean;
  currentDirection: string;
  scrollView: ?Object;
  sheet: Object;
  childrenWrapper: ?Object;
  contentOffset: number;

  static defaultProps = {
    sheetHeight: 200,
    topOffset: 68,
    swipeToCloseHeight: 150,
    forceOpen: false,
  };

  constructor(props: Props) {
    super(props);
    const {
      forceOpen,
      topOffset,
      sheetHeight,
    } = this.props;
    this.panResponder = React.createRef();
    this.isTransitioning = false;
    this.forceAnimateAfterNotCapturedTouch = false;
    this.currentDirection = '';
    this.scrollView = React.createRef();
    this.childrenWrapper = React.createRef();
    this.contentOffset = 0;

    const initialHeight = forceOpen ? USABLE_SCREEN_HEIGHT - topOffset : sheetHeight;

    this.state = {
      animatedHeight: new Animated.Value(initialHeight),
      isSheetOpen: forceOpen,
      isDragging: false,
      screenHeight: USABLE_SCREEN_HEIGHT,
      scrollEnabled: true,
    };
  }

  componentDidMount() {
    this.buildPanResponder();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const {
      forceOpen,
      topOffset,
      sheetHeight,
    } = this.props;
    const { screenHeight } = this.state;
    const { animatedHeight, isSheetOpen } = this.state;

    if (forceOpen !== prevProps.forceOpen) {
      this.animateSheet();
    }

    if (prevProps.sheetHeight !== sheetHeight && !isSheetOpen) {
      Animated.spring(animatedHeight, {
        toValue: sheetHeight,
        bounciness: 0,
      }).start();
    }

    if (prevState.screenHeight !== screenHeight && isSheetOpen) {
      Animated.spring(animatedHeight, {
        toValue: screenHeight - topOffset,
        bounciness: 0,
      }).start();
    }
  }

  manageSheetTransition = (isOpening?: boolean) => {
    const { sheetHeight = 0 } = this.props;
    if (isOpening) {
      if (this.sheet) this.sheet.setNativeProps(ABSOLUTE_SHEET_STYLE);
      if (this.childrenWrapper) this.childrenWrapper.setNativeProps({ paddingBottom: sheetHeight });
    } else {
      if (this.sheet) this.sheet.setNativeProps(RELATIVE_SHEET_STYLE);
      if (this.childrenWrapper) this.childrenWrapper.setNativeProps({ paddingBottom: 0 });
      if (this.scrollView) this.scrollView.scrollTo({ y: this.contentOffset });
    }
  };

  freezeScrollWrapper = () => {
    this.setState({ scrollEnabled: false });
  };

  unfreezeScrollWrapper = () => {
    this.setState({ scrollEnabled: true });
  };

  getDirection = (gestureState: Object) => {
    return gestureState.vy > 0 ? DOWN : UP;
  };

  buildPanResponder = () => {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (e, gestureState) => {
        if (this.isTransitioning) return false;
        const { topOffset, swipeToCloseHeight } = this.props;
        const swipeToCloseZone = topOffset + swipeToCloseHeight;
        if (this.state.isSheetOpen) {
          return gestureState.moveY > 0 && gestureState.moveY < swipeToCloseZone && Math.abs(gestureState.dy) >= 8;
        }
        return Math.abs(gestureState.dx) >= 8 || Math.abs(gestureState.dy) >= 8;
      },
      onPanResponderMove: (e, gestureState) => {
        if (this.isTransitioning) return;
        const { isDragging } = this.state;
        if (!isDragging) this.setState({ isDragging: true });
        this.moveSheet(gestureState);
        this.currentDirection = this.getDirection(gestureState);
      },
      onPanResponderRelease: () => {
        if (this.isTransitioning) return;
        const { isDragging } = this.state;
        if (isDragging) this.setState({ isDragging: false });
        this.animateSheet(this.currentDirection);
        this.currentDirection = '';
      },
      onStartShouldSetPanResponderCapture: (e) => {
        const {
          captureTabs,
          tabs,
          activeTab,
        } = this.props;
        const { isSheetOpen, animatedHeight, screenHeight } = this.state;
        const { pageX, pageY } = e.nativeEvent;
        const topValueSheetPosition = screenHeight - animatedHeight._value;

        if (isSheetOpen) {
          return false;
        } else if (!captureTabs && !!tabs) {
          if (pageY > topValueSheetPosition + 30
            && pageY < topValueSheetPosition + 60
            && pageX.toFixed(2) > HORIZONTAL_TAB_BOUNDARIES[0]
            && pageX.toFixed(2) < HORIZONTAL_TAB_BOUNDARIES[1]) {
            if (!isSheetOpen) {
              setTimeout(() => {
                this.animateSheet();
              }, 100);
              return false;
            }
          } else if (activeTab === 'CHAT') {
            if (pageY > screenHeight - 50
              && pageY < screenHeight) {
              this.animateSheet();
              return false;
            }
          }
        }
        return true;
      },
      onPanResponderTerminationRequest: () => false,
    });
  };

  moveSheet = (gestureState: Object) => {
    if (this.isTransitioning) return;
    const { animatedHeight, screenHeight } = this.state;
    const { sheetHeight } = this.props;

    const position = gestureState.moveY;
    let updatedSheetHeight = screenHeight - position;

    if (updatedSheetHeight < sheetHeight) {
      updatedSheetHeight = sheetHeight;
    }

    if (this.currentDirection === UP) {
      this.manageSheetTransition(true);
    }
    animatedHeight.setValue(updatedSheetHeight);
  };

  animateSheet = (direction?: string) => {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const { animatedHeight, isSheetOpen, screenHeight } = this.state;
    const {
      scrollingComponentsRefs,
      sheetHeight,
      topOffset,
    } = this.props;
    const { onSheetOpen, onSheetClose } = this.props;

    let isGoingToUp = !isSheetOpen;
    if (direction) {
      isGoingToUp = direction === UP;
    }

    if (isGoingToUp) {
      this.freezeScrollWrapper();
      this.manageSheetTransition(true);
    }

    const updatedSheetHeight = isGoingToUp ? screenHeight - topOffset : sheetHeight;

    if (!isGoingToUp && scrollingComponentsRefs && scrollingComponentsRefs.length) {
      scrollingComponentsRefs.forEach((ref) => {
        ref.scrollToOffset({ x: 0, y: 0, animated: false });
      });
    }

    if (isGoingToUp && onSheetOpen) {
      onSheetOpen();
    } else if (onSheetClose) {
      onSheetClose();
    }

    if (this.scrollView && isGoingToUp) this.scrollView.scrollTo({ y: this.contentOffset });

    this.setState({ isSheetOpen: isGoingToUp });

    Animated.spring(animatedHeight, {
      toValue: updatedSheetHeight,
      bounciness: 0,
    }).start(() => {
      this.isTransitioning = false;
      if (this.scrollView) {
        if (isGoingToUp) {
          this.scrollView.scrollToEnd();
        } else {
          this.manageSheetTransition();
          this.unfreezeScrollWrapper();
        }
      }
    });
  };

  render() {
    const {
      inset = {},
      color,
      style,
      center,
      children,
      bottomSheetChildren,
      hideSheet,
      topOffset,
      sheetHeight,
      tabs,
      activeTab,
      inverse,
      sheetWrapperStyle,
      onRefresh,
    } = this.props;

    const {
      screenHeight,
      scrollEnabled,
      animatedHeight,
      isSheetOpen,
      isDragging,
    } = this.state;

    const openedSheetHeight = screenHeight - topOffset;

    const sheetStyle = {
      height: animatedHeight,
    };

    let wrapperStyle = {};

    const handlebarsOutputRanges = [
      sheetHeight,
      sheetHeight + 10,
      sheetHeight + 20,
      openedSheetHeight - 20,
      openedSheetHeight - 10,
      openedSheetHeight,
    ];

    const backdropOutputRanges = [
      sheetHeight,
      openedSheetHeight,
    ];

    const leftHandlebarAnimation = {
      transform: [
        {
          rotate: animatedHeight.interpolate({
            inputRange: handlebarsOutputRanges,
            outputRange: ['-15deg', '-15deg', '0deg', '0deg', '15deg', '15deg'],
          }),
        },
      ],
    };

    const rightHandlebarAnimation = {
      transform: [
        {
          rotate: animatedHeight.interpolate({
            inputRange: handlebarsOutputRanges,
            outputRange: ['15deg', '15deg', '0deg', '0deg', '-15deg', '-15deg'],
          }),
        },
      ],
    };

    const backdropAnimation = {
      opacity: animatedHeight.interpolate({
        inputRange: backdropOutputRanges,
        outputRange: [0, BACKDROP_OPACITY],
      }),
    };

    if (inverse) {
      wrapperStyle = {
        height: openedSheetHeight,
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        overflow: 'hidden',
      };
    }

    return (
      <ContainerOuter color={color} style={style} forceInset={{ top: 'always', ...inset }}>
        <ContainerInner
          center={center}
          onLayout={(event) => {
            this.setState({ screenHeight: event.nativeEvent.layout.height });
          }}
        >
          <ScrollView
            ref={(ref) => { this.scrollView = ref; }}
            style={{ position: 'relative' }}
            contentContainerStyle={{ minHeight: '100%', justifyContent: 'space-between' }}
            bounces={false}
            scrollEnabled={scrollEnabled}
            keyboardShouldPersistTaps="always"
            onContentSizeChange={(width, height) => {
              this.contentOffset = height - screenHeight;
            }}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={onRefresh}
              />
            }
            overScrollMode="never"
            showsVerticalScrollIndicator={scrollEnabled}
          >
            <View ref={(ref) => { this.childrenWrapper = ref; }}>
              {children}
            </View>
            {!!screenHeight && !hideSheet &&
              <AnimatedSheet
                ref={(ref) => { this.sheet = ref; }}
                style={sheetStyle}
                {...this.panResponder.panHandlers}
                useNativeDriver
              >
                <FloatingHeader>
                  <Cover>
                    <HandlebarsWrapper>
                      <AnimatedLeftHandlebar
                        style={leftHandlebarAnimation}
                      />
                      <AnimatedRightHandlebar
                        right
                        style={rightHandlebarAnimation}
                      />
                    </HandlebarsWrapper>
                  </Cover>
                  {!!tabs &&
                  <Tabs
                    initialActiveTab={activeTab}
                    tabs={tabs}
                    wrapperStyle={{
                      position: 'absolute',
                      top: 8,
                      left: 0,
                      zIndex: 2,
                      width: '100%',
                    }}
                  />
                  }
                </FloatingHeader>
                <AnimatedModalWrapper style={{ height: animatedHeight }}>
                  <View style={[{ flex: 1, width: '100%' }, wrapperStyle, sheetWrapperStyle]}>
                    {bottomSheetChildren}
                  </View>
                </AnimatedModalWrapper>
              </AnimatedSheet>
            }
            {(isSheetOpen || isDragging) &&
            <TouchableWithoutFeedback
              onPress={this.animateSheet}
            >
              <AnimatedClickableBackdrop
                style={backdropAnimation}
                activeOpacity={BACKDROP_OPACITY}
              />
            </TouchableWithoutFeedback>
            }
          </ScrollView>
        </ContainerInner>
      </ContainerOuter>
    );
  }
}
