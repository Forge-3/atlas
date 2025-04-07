import React from "react";
import { Toaster } from "react-hot-toast";
import Router from "../router/index.tsx";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider, IdentityKitTheme } from "@nfid/identitykit/react";

const Main = () => {
  return (
    <>
      <Toaster />
      <IdentityKitProvider authType="ACCOUNTS" theme={IdentityKitTheme.LIGHT}>
        <Router />
      </IdentityKitProvider>
    </>
  );
};


export default Main;