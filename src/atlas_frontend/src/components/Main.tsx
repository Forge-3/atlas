import React from "react";
import { Toaster } from "react-hot-toast";
import Router from "../router/index.tsx";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider, IdentityKitTheme } from "@nfid/identitykit/react";
import { NFIDW, InternetIdentity, Stoic, OISY, IdentityKitAuthType } from "@nfid/identitykit"
import { Provider } from 'react-redux'
import { store } from "../store/store.ts";

const Main = () => {
  return (
    <Provider store={store}>
      <Toaster />
      <IdentityKitProvider authType={IdentityKitAuthType.ACCOUNTS} theme={IdentityKitTheme.LIGHT} signers={[NFIDW, InternetIdentity, Stoic, OISY]} >
        <Router />
      </IdentityKitProvider>
      </Provider>
  );
};


export default Main;