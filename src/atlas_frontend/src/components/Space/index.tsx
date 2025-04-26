import React from "react";
import Space from "./Space.tsx";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAtlasSpace } from "../../canisters/atlasSpace/api.ts";
import { Principal } from "@dfinity/principal";
import { toast } from "react-hot-toast";
import { useUnAuthAtlasSpaceActor } from "../../hooks/identityKit.ts";

const SpacePage = () => {
  const params = useParams();
  const navigate = useNavigate();
  const spacePrincipal = params["spacePrincipal"];

  if (!spacePrincipal) return <></>;
  let principal: Principal | null = null;

  try {
    principal = Principal.fromText(spacePrincipal);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err) {
    toast.error("Failed to decode space ID");
    navigate("/");
    return;
  }
  const actor = useUnAuthAtlasSpaceActor(principal);
  const { data } = useQuery({
    queryKey: ["spaceState", actor],
    queryFn: async () => {
      if (!actor) return null;
      return await getAtlasSpace({ unAuthAtlasSpaceActor: actor });
    },
  });

  if (!data) return <></>;
  return (
    <Space
      name={data.space_name}
      description={data.space_description}
      symbol={data.space_symbol}
      backgroundImg={data.space_background}
      avatarImg={data.space_logo}
    />
  );
};

export default SpacePage;
