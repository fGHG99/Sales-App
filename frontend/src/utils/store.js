import { configureStore } from "@reduxjs/toolkit";
import profileReducer from "./profileSlice";
import promotionalReducer from "./promotionalSlice";

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    promotional: promotionalReducer,
  },
});

export default store;
