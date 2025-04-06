import { Toaster } from "react-hot-toast";
import Router from "../router/index.tsx";
import "@nfid/identitykit/react/styles.css";
import { IdentityKitProvider } from "@nfid/identitykit/react";

export default () => {
  return (
    <>
      <Toaster />
      <IdentityKitProvider>
        <Router />
      </IdentityKitProvider>
    </>
  );
};
