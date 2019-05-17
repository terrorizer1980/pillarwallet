// @flow
export type TankReducerState = {
  data: Object,
};

export type TankReducerAction = {
  type: string,
  payload: any,
};

const initialState = {
  data: {
    totalStake: 13500,
    availableStake: 7350,
  },
};

export default function badgesReducer(
  state: TankReducerState = initialState,
  action: TankReducerAction,
) {
  switch (action.type) {
    case 'FUND_TANK':
      return {
        ...state,
        data: action.payload,
      };
    default:
      return state;
  }
}
