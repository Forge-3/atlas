import React from "react";
import { Toaster } from "react-hot-toast";
import Router from "../router/index.tsx";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider } from "@nfid/identitykit/react";

const App = () => {
  return (
    <>
      <Toaster />
      <IdentityKitProvider authType="ACCOUNTS">
        <Router />
      </IdentityKitProvider>
    </>
  );
};


export default App;