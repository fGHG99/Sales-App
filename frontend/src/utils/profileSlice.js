import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {
    id: '1',
    username: 'johndoe',
    email: 'john.doe@example.com',
    emailVerified: false,
    phoneNumber: '+1234567890',
    sex: 'male',
    dateOfBirth: '1990-05-15',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  },
  loading: true, // Start with loading true
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.user[field] = value;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resendEmailVerification: (state) => {
      // Mock action - will be replaced with actual API call later
      console.log('Resending email verification...');
    },
  },
});

export const { 
  updateProfile, 
  updateField, 
  setLoading, 
  setError, 
  resendEmailVerification 
} = profileSlice.actions;

export default profileSlice.reducer;