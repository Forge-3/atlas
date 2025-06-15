import React from "react";
import { Toaster } from "react-hot-toast";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider, IdentityKitTheme } from "@nfid/identitykit/react";
import {
  NFIDW,
  InternetIdentity,
  Stoic,
  OISY,
  IdentityKitAuthType,
} from "@nfid/identitykit";
import { Provider } from "react-redux";
import { store } from "../store/store.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import Main from "./Main.tsx";
import { SPACES_PATH } from "../router/index.tsx";

const InternetIdentityWallet =
  process.env.DFX_NETWORK === "local"
    ? {
        ...InternetIdentity,
        providerUrl: `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`,
      }
    : InternetIdentity;

const App = () => {
  const queryClient = new QueryClient();

  return (
    <Provider store={store}>
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <IdentityKitProvider
            authType={IdentityKitAuthType.DELEGATION}
            theme={IdentityKitTheme.LIGHT}
            signers={[NFIDW, Stoic, OISY, InternetIdentityWallet]}
            onConnectSuccess={() => {
              window.location.href = SPACES_PATH;
            }}
          >
            <Main />
          </IdentityKitProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
