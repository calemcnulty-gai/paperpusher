import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProductFiltersState {
  selectedSupplier: string | null;
  selectedSeason: string | null;
  page: number;
  pageSize: number;
}

const initialState: ProductFiltersState = {
  selectedSupplier: null,
  selectedSeason: null,
  page: 1,
  pageSize: 10
};

export const productFiltersSlice = createSlice({
  name: "productFilters",
  initialState,
  reducers: {
    setSelectedSupplier: (state, action: PayloadAction<string | null>) => {
      state.selectedSupplier = action.payload;
      state.page = 1; // Reset page when filter changes
    },
    setSelectedSeason: (state, action: PayloadAction<string | null>) => {
      state.selectedSeason = action.payload;
      state.page = 1; // Reset page when filter changes
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1; // Reset page when page size changes
    },
  },
});

export const { 
  setSelectedSupplier, 
  setSelectedSeason, 
  setPage,
  setPageSize 
} = productFiltersSlice.actions;

export default productFiltersSlice.reducer;