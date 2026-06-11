import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  /** Active SACCO (org) for multi-tenant scoping; null until session loads. */
  activeOrgId: string | null;
}

const initialState: AppState = {
  activeOrgId: null,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveOrg(state, action: PayloadAction<string | null>) {
      state.activeOrgId = action.payload;
    },
  },
});

export const { setActiveOrg } = appSlice.actions;
