import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface MenuState {
  selectedGuests: number;
  selectedCuisine: string;
}

const initialState: MenuState = {
  selectedGuests: 1,
  selectedCuisine: "",
};

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    setSelectedGuests: (state, action: PayloadAction<number>) => {
      state.selectedGuests = action.payload;
    },
    setSelectedCuisine: (state, action: PayloadAction<string>) => {
      state.selectedCuisine = action.payload;
    },
  },
});

export const { setSelectedGuests, setSelectedCuisine } = menuSlice.actions;
export default menuSlice.reducer;
