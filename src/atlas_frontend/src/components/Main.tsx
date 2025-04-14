import React from "react";
import { Toaster } from "react-hot-toast";
import Router from "../router/index.tsx";
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

const InternetIdentityWallet =
  process.env.DFX_NETWORK === "local"
    ? {
        ...InternetIdentity,
        providerUrl: "http://c2lt4-zmaaa-aaaaa-qaaiq-cai.localhost:4943/",
      }
    : InternetIdentity;

const Main = () => {
  const queryClient = new QueryClient();

  return (
    <Provider store={store}>
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <IdentityKitProvider
          authType={IdentityKitAuthType.DELEGATION}
          theme={IdentityKitTheme.LIGHT}
          signers={[NFIDW, Stoic, OISY, InternetIdentityWallet]}
        >
          <Router />
        </IdentityKitProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default Main;
