import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getUnAuthAtlasSpaceActor,
  useUnAuthAgent,
  useUnAuthAtlasMainActor,
} from "../../../hooks/identityKit";
import { getAllSpaces } from "../../../canisters/atlasMain/api";
import { deserialize, type RootState } from "../../../store/store";
import { Principal } from "@dfinity/principal";
import { getAtlasSpace } from "../../../canisters/atlasSpace/api";
import SpaceItem from "./SpaceItem";
import { useNavigate } from "react-router-dom";
import type { Spaces, Space } from "../../../store/slices/spacesSlice";
import LocalBlurOverlay from "../../Shared/LocalBlurOverlay";
import Button from "../../Shared/Button";
import { RiSearchEyeLine } from 'react-icons/ri';
import { useSpaceNavigation } from "../../../hooks/useSpaceNavigation";

const SpacesList = () => {
  const dispatch = useDispatch();
  const unAuthAtlasMain = useUnAuthAtlasMainActor();
  const spaces = deserialize<Spaces>(useSelector((state: RootState) => state.spaces.spaces));
  const [fetchedSpacesData, setFetchedSpacesData] = useState(false);
  const [fetchingInProgress, setFetchingInProgress] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filteredSpaces, setFilteredSpaces] = useState<[string, Space][]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const agent = useUnAuthAgent();
  const navigate = useNavigate();

  const { navigateToSpaceBuilder, userCanCreateSpace } = useSpaceNavigation();

  useEffect(() => {
    const fetchSpaces = async () => {
      if (unAuthAtlasMain && !spaces) {
        await getAllSpaces({
          dispatch,
          unAuthAtlasMain,
        });
        setFetchingInProgress(false);
      }
    };
    fetchSpaces();
  }, [dispatch, unAuthAtlasMain]);

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      setFilteredSpaces([]);
      setIsSearching(false);
      return;
    }

    const filtered = Object.entries(spaces || {}).filter(([, value]: [string, Space]) => {
      if (!value?.state) return false;
      const spaceName = value.state.space_name.toLowerCase();
      const keyword = searchKeyword.toLowerCase();
      return spaceName.includes(keyword);
    });

    setFilteredSpaces(filtered);
    setIsSearching(true);
  };

  useEffect(() => {
    if (!spaces || fetchedSpacesData || !agent) return;
    Object.keys(spaces).map(async (spaceId) => {
      const spacePrincipal = Principal.from(spaceId);
      getUnAuthAtlasSpaceActor(agent, spacePrincipal);
      const unAuthAtlasSpace = getUnAuthAtlasSpaceActor(agent, spacePrincipal);
      if (!unAuthAtlasSpace) return;
      await getAtlasSpace({
        spaceId,
        unAuthAtlasSpace,
        dispatch,
      });
    });
    setFetchedSpacesData(true);
  }, [dispatch, spaces, fetchedSpacesData]);

  if (!spaces) {
    if (!fetchingInProgress) navigate("/");
    return (
      <LocalBlurOverlay isLoading={true} />
    )
  }

  const spacesEntries = Object.entries(spaces);
  return (
    <div className="flex flex-col mt-6 md:mt-16">
      <div className="flex mx-6 md:mx-12">
        <h4 className="text-white font-montserrat font-semibold text-h3 md:text-h4 mt-8 mb-4">
          Atlas is your gateway to ICP. <br />
          Join the fun, grow the community, <br />
          and rise through the ranks with <br />
          every step you take.
        </h4>
      </div>
      <div className="w-full h-[1px] bg-light2/20 my-8 md:my-20" />
      <div className="flex flex-1 mx-6 md:mx-12 bg-primary/100 rounded-xl p-4 md:p-6 mb-8">
        <div className="flex flex-col w-full">
          <h4 className="text-white font-montserrat font-medium text-h3 lg:text-h4 mb-4">
          Search hubs and projects
          </h4>
          <div className="flex flex-row flex-wrap gap-2">
          <input
            type="text"
            placeholder="Enter a Keyword"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
            className="w-[140px] lg:w-[260px] px-4 py-1 rounded-md bg-background/20 text-white text-[12px] lg:text-base not-last:font-montserrat font-medium placeholder:text-white focus:outline-2 focus:outline-background"
            />
          <Button
          variant="dark"
          className="px-4 text-[12px] lg:text-base font-medium bg-dark gap-1"
          onClick={handleSearch}
          >
            <RiSearchEyeLine className="h-4 w-4 lg:h-6 lg:w-6"/> Search
          </Button>
          </div>
          <div className="flex flex-row justify-end items-end  gap-3">
            <h3 className="text-light2 font-montserrat font-medium lg:text-h3 mt-8 mb-1">
              Join our space and become a champion!
            </h3>
            {userCanCreateSpace && (
            <Button
              variant="vivid"
              className="px-3 text-[12px] lg:text-base font-medium"
              onClick={navigateToSpaceBuilder}
            >
            Create the new Space
            </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col mb-16 md:mx-6">
        <h3 className="text-white font-montserrat font-semibold text-h3 ml-6 md:ml-12 mb-4">
        {isSearching ? filteredSpaces.length : spacesEntries.length} Existing hubs
        </h3>
        {(isSearching ? filteredSpaces.length : spacesEntries.length) > 0 ? (
          <div className="flex flex-col gap-2">
            {(isSearching ? filteredSpaces : spacesEntries).map(
              ([key, value]) =>
                value?.state && (
                  <React.Fragment key={key}>
                  <div className="mx-6 md:mx-12">
                    <SpaceItem
                      spacePrincipal={Principal.from(key)}
                      name={value.state.space_name}
                      description={value.state.space_description}
                      backgroundImg={value.state.space_background}
                      avatarImg={value.state.space_logo}
                    />
                  </div>
                  <div className="w-full h-[1px] bg-light2/20 my-2 mx-8" />
                  </React.Fragment>
              )
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <h1 className="text-white font-montserrat font-semibold text-2xl mt-24">
              No spaces found
            </h1>
          </div>
        )}
      </div>
    </div>
  );
};


export default SpacesList;
