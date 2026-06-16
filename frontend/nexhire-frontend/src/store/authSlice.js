import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  error: null,
  isLoading: false,
};

const authSlice=createSlice({
    name:"auth",
    initialState,
    reducers:{
        loginStart:(state)=>{
            state.isLoading=true;
            state.error=null;
            
        },
         loginSuccess:(state,action)=>{
            state.isLoading=false;
            state.error=null;
            state.user=action.payload.user;
            state.token=action.payload.token;
        },
        loginFailure:(state,action)=>{
            state.isLoading=false;
            state.error=action.payload;
            state.user=null;
            state.token=null;
        },
        logout:(state)=>{
            state.isLoading=false;
            state.error=null;
            state.user=null;
            state.token=null;
        }
    }
});

export const {loginStart,loginSuccess,loginFailure,logout}=authSlice.actions;

export default authSlice.reducer;