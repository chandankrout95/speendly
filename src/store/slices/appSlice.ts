import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AppState {
  /** Bumped whenever the database changes so screens re-query. DB stays the source of truth. */
  dataVersion: number;
  onboardingComplete: boolean;
}

const initialState: AppState = { dataVersion: 0, onboardingComplete: false };

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    dataChanged(state) {
      state.dataVersion += 1;
    },
    setOnboardingComplete(state, action: PayloadAction<boolean>) {
      state.onboardingComplete = action.payload;
    },
  },
});

export const { dataChanged, setOnboardingComplete } = appSlice.actions;
export const appReducer = appSlice.reducer;
