import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { deserialize, type RootState } from "../store/store";
import { BlockchainUser, selectUserBlockchainData, type StorableUser } from "../store/slices/userSlice";
import type { StorableConfig } from "../store/slices/appSlice";
import { SPACE_BUILDER_PATH } from "../router/paths";

export const useSpaceNavigation = () => {
  const navigate = useNavigate();
  
  const userBlockchainData = deserialize<StorableUser>(
      useSelector(selectUserBlockchainData)
    );
    const userInfo = userBlockchainData
      ? new BlockchainUser(userBlockchainData)
      : null;
  const appConfig = deserialize<StorableConfig>(
    useSelector((state: RootState) => state.app.blockchainConfig)
  );

  const ownedSpacesCount = userInfo?.owned_spaces.length;
  const userCanCreateSpace =
    (userInfo?.isAdmin() ||
      (userInfo?.isSpaceLead() &&
        ownedSpacesCount !== undefined &&
        appConfig?.spaces_per_space_lead !== undefined &&
        ownedSpacesCount < appConfig?.spaces_per_space_lead)) ??
    false;

  const navigateToSpaceBuilder = () => {
    if (userCanCreateSpace) {
      navigate(SPACE_BUILDER_PATH);
    }
  };

  return {
    navigateToSpaceBuilder,
    userCanCreateSpace,
    userInfo,
    appConfig,
  };
};
