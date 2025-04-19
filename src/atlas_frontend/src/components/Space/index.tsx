import React from "react";
import { useAuth } from "@nfid/identitykit/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LinkDiscordModal from "../../modals/LinkDiscordModal.tsx";
import { useDispatch, useSelector } from "react-redux";
import { setScreenBlur } from "../../store/slices/appSlice.ts";
import { selectUserDiscordData } from "../../store/slices/userSlice.ts";
import SpaceMain from "./HubSpaceMain.tsx";

const Space = () => {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { user } = useAuth();

  const userDiscordData = useSelector(selectUserDiscordData);
  const isDiscord = userDiscordData.accessToken && userDiscordData.userData;

  useEffect(() => {
    if (!user) {
      nav("/");
    }
  }, [nav, user]);

  useEffect(() => {
    dispatch(dispatch(setScreenBlur(!isDiscord)));
  }, [dispatch, userDiscordData]);

  return (
    <>
      <SpaceMain
        country="India"
        description="Join the ICP Hub – where technology meets action! Complete tasks, explore the ICP blockchain, and earn rewards for your engagement."
        backgroundImg="/hubs/background-india.png"
        avatarImg="/hubs/logo-india-square.png"
      />
      {!isDiscord && <LinkDiscordModal />}
    </>
  );
};

export default Space;
