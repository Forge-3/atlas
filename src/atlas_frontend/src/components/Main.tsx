import React from "react";
import { Toaster } from "react-hot-toast";
import Router from "../router/index.tsx";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider, IdentityKitTheme } from "@nfid/identitykit/react";
import { Provider } from 'react-redux'
import { store } from "../store/store.ts";


const Main = () => {
  return (
    <Provider store={store}>
      <Toaster />
      <IdentityKitProvider authType="ACCOUNTS" theme={IdentityKitTheme.LIGHT}>
        <Router />
      </IdentityKitProvider>
      </Provider>
  );
};


export default Main;