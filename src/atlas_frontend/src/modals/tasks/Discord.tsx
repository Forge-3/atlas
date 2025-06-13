import React from "react";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  type FieldErrors,
  type Path,
  type UseFormRegister,
  type UseFormSetValue,
  type Control,
  useWatch
} from "react-hook-form";
import type { CreateNewTaskFormInput } from "../CreateNewTaskModal";
import { Principal } from "@dfinity/principal";
import { useDispatch, useSelector } from "react-redux";
import DiscordButton from "../../components/DiscordButton";
import toast from "react-hot-toast";
import { selectUserDiscordData, setDiscordGuilds } from "../../store/slices/userSlice";
import { getGuildsData } from "../../integrations/discord";
import { FiRefreshCcw } from "react-icons/fi";
import { useAuthAtlasSpaceActor } from "../../hooks/identityKit";
import { validateDiscordInviteLinkQuery } from "../../canisters/atlasSpace/api";

import type {
  DiscordInviteApiResponse,
  DiscordGuild as CandidDiscordGuild
} from "../../../../declarations/atlas_space/atlas_space.did";

interface FrontendDiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

function getGuildIconUrl(id: string, icon?: string | null) {
  if (!icon || typeof icon !== 'string') return null;
  const isAnimated = icon.startsWith("a_");
  const ext = isAnimated ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${id}/${icon}.${ext}`;
}

interface DiscordTaskProps {
  register: UseFormRegister<CreateNewTaskFormInput>;
  errors?: FieldErrors<CreateNewTaskFormInput>;
  index: number;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  spacePrincipal: Principal;
  setValue: UseFormSetValue<CreateNewTaskFormInput>;
  control: Control<CreateNewTaskFormInput>;
}


const DiscordTask = ({
  register,
  index,
  errors,
  maxTitleLength,
  maxDescriptionLength,
  setValue,
  control,
  spacePrincipal,
}: DiscordTaskProps) => {
  const dispatch = useDispatch();

  const taskErrors =
  errors?.tasks && Array.isArray(errors.tasks)
    ? errors.tasks[index]
    : undefined;

  const titleError = taskErrors?.title?.message;
  const descriptionError = taskErrors?.description?.message;
  const guildIdError = taskErrors?.guildId?.message;
  const discordInviteLinkError = taskErrors?.discordInviteLink?.message;

  const [guilds, setGuilds] = useState<FrontendDiscordGuild[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState<boolean>(false);
  const [guildsError, setGuildsError] = useState<string | null>(null);

  const userDiscordData = useSelector(selectUserDiscordData);
  const accessToken = userDiscordData?.accessToken;

  const discordInviteLink = useWatch({
    control,
    name: `tasks.${index}.discordInviteLink` as Path<CreateNewTaskFormInput>,
  });

  const selectedGuildId = useWatch<CreateNewTaskFormInput>({
    control,
    name: `tasks.${index}.guildId` as Path<CreateNewTaskFormInput>,
  });

  const [localExpiresAt, setLocalExpiresAt] = useState<string | null>(null);
  const [localGuildName, setLocalGuildName] = useState<string | null>(null);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLinkValidatedSuccessfully, setIsLinkValidatedSuccessfully] = useState(false);


  const lastValidated = useRef<{ link: string | null; guildId: string | null }>({ link: null, guildId: null });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentGuild = guilds.find((guild) => guild.id === selectedGuildId);
  const authAtlasSpaceActor = useAuthAtlasSpaceActor(spacePrincipal);

  const formatTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return "Never expires";
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const diff = expirationDate.getTime() - now.getTime();

    if (diff <= 0) return "Expired!";

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s) remaining`;
    if (hours > 0) return `${hours} hour(s) remaining`;
    if (minutes > 0) return `${minutes} minute(s) remaining`;
    return `${seconds} second(s) remaining`;
  };

  const validateLink = useCallback(async (link: string, guildIdToValidate: string) => {
    if (validationLoading || (lastValidated.current.link === link && lastValidated.current.guildId === guildIdToValidate && !validationError && isLinkValidatedSuccessfully)) {
        return;
    }
    if (!authAtlasSpaceActor) {
      setValidationError("Canister actor not initialized.");
      lastValidated.current = { link: link, guildId: guildIdToValidate };
      setIsLinkValidatedSuccessfully(false);
      return;
    }
    setValidationLoading(true);
    setValidationError(null);
    setLocalExpiresAt(null);
    setLocalGuildName(null);
    setValue(`tasks.${index}.guildIcon`, null);
    setValue(`tasks.${index}.expiresAt`, null);
    setIsLinkValidatedSuccessfully(false);

    console.log("Current guilds in validateLink (before API call):", guilds);
    const expectedGuildName = guilds.find(guild => guild.id === guildIdToValidate)?.name || guildIdToValidate;
    console.log("Expected Guild ID:", guildIdToValidate);
    console.log("Resolved Expected Guild Name (before API call):", expectedGuildName);

    try {
      const response: DiscordInviteApiResponse = await validateDiscordInviteLinkQuery(
        authAtlasSpaceActor,
        link,
        guildIdToValidate
      );

      const candidGuild: CandidDiscordGuild | undefined = response.guild && response.guild.length > 0 ? response.guild[0] : undefined;

      if (candidGuild) {
        if (candidGuild.id !== guildIdToValidate) {
            console.log("Mismatch: Candid Guild Name from API:", candidGuild.name, "Expected Guild Name (from frontend guilds):", expectedGuildName);
            setValidationError(`Invite link leads to a different server (${candidGuild.name}). Expected: ${expectedGuildName}. Please select the correct guild or check the invite link.`);
            lastValidated.current = { link: link, guildId: guildIdToValidate };
            setIsLinkValidatedSuccessfully(false);
            return;
        }

        setLocalGuildName(candidGuild.name);
        const iconString = candidGuild.icon && candidGuild.icon.length > 0 ? candidGuild.icon[0] : null;
        setValue(`tasks.${index}.guildIcon`, iconString);
      } else {
        setValidationError("Could not retrieve guild information for this invite, or link is invalid.");
        lastValidated.current = { link: link, guildId: guildIdToValidate };
        setValue(`tasks.${index}.guildIcon`, null);
        setIsLinkValidatedSuccessfully(false);
      }

      const expiresAtString: string | undefined = response.expires_at && response.expires_at.length > 0 ? response.expires_at[0] : undefined;

      if (expiresAtString) {
        setLocalExpiresAt(expiresAtString);
        setValue(`tasks.${index}.expiresAt`, expiresAtString);
      } else {
        setLocalExpiresAt(null);
        setValue(`tasks.${index}.expiresAt`, null);
      }
      lastValidated.current = { link: link, guildId: guildIdToValidate };
      setValidationError(null);
      setIsLinkValidatedSuccessfully(true);


    } catch (e) {
        let errorMessage = "Failed to validate Discord invite link.";
        if (e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string") {
        errorMessage = (e as { message: string }).message;
    }

        console.error("Original backend error message:", errorMessage, e);

        const regex = /Discord invite link leads to a different server \(ID: (\d+)\)\. Expected: (\d+)\.?/;
        const match = errorMessage.match(regex);

        if (match && match.length >= 3) {
            const actualGuildIdFromBackend = match[1];

            const actualGuildName = guilds.find(g => g.id === actualGuildIdFromBackend)?.name || actualGuildIdFromBackend;

            errorMessage = `Invite link leads to a different server (${actualGuildName}). Expected: ${expectedGuildName}. Please select the correct guild or check the invite link.`;
        }

        setValidationError(errorMessage);
        toast.error(errorMessage);
        setValue(`tasks.${index}.guildIcon`, null);
        setValue(`tasks.${index}.expiresAt`, null);
        lastValidated.current = { link: link, guildId: guildIdToValidate };
        setIsLinkValidatedSuccessfully(false);
    } finally {
      setValidationLoading(false);
    }
  }, [authAtlasSpaceActor, index, setValue, validationLoading, validationError, guilds, isLinkValidatedSuccessfully]);


   useEffect(() => {
    const handler = setTimeout(() => {
      const discordLinkRegex = /^https:\/\/(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]{6,10}$/;

      const currentLink = discordInviteLink;
      const currentGuildId = selectedGuildId;

      const isValidLinkFormat = typeof currentLink === "string" && currentLink.length > 0 && discordLinkRegex.test(currentLink);
      const isGuildSelected = typeof currentGuildId === "string" && currentGuildId.length > 0;

      if (isValidLinkFormat && !isGuildSelected) {
          setValidationError("Please select a Discord server from the list.");
          setLocalExpiresAt(null);
          setLocalGuildName(null);
          setValue(`tasks.${index}.guildIcon`, null);
          setValue(`tasks.${index}.expiresAt`, null);
          setIsLinkValidatedSuccessfully(false);
          return;
      }
       else if (validationError === "Please select a Discord server from the list." && isValidLinkFormat && isGuildSelected) {
           setValidationError(null);
       }

      const shouldValidateApi =
          isValidLinkFormat &&
          isGuildSelected &&
          !validationLoading &&
          (currentLink !== lastValidated.current.link || currentGuildId !== lastValidated.current.guildId);

      if (shouldValidateApi) {
            validateLink(currentLink, currentGuildId);
      } else {
          const shouldReset =
            (
              !isValidLinkFormat ||
              !isGuildSelected ||
              !!discordInviteLinkError
            ) &&
            (localExpiresAt !== null || localGuildName !== null || validationLoading || validationError || isLinkValidatedSuccessfully);

          if (shouldReset && !validationLoading) {
              setLocalExpiresAt(null);
              setLocalGuildName(null);
              setValidationError(null);
              setValue(`tasks.${index}.guildIcon`, null);
              setValue(`tasks.${index}.expiresAt`, null);
              lastValidated.current = { link: null, guildId: null };
              setIsLinkValidatedSuccessfully(false);
          }
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [
    discordInviteLink,
    validateLink,
    index,
    setValue,
    selectedGuildId,
    localExpiresAt,
    localGuildName,
    validationLoading,
    validationError,
    isLinkValidatedSuccessfully,
    discordInviteLinkError
  ]);


 const fetchGuilds = useCallback(async () => {
    setLoadingGuilds(true);
    setGuildsError(null);
    try {
      if (!accessToken) {
        setGuildsError("No access token available. Please connect Discord.");
        return;
      }
      const data = await getGuildsData(accessToken);
      if (data && data.length > 0) {
        setGuilds(data);
        dispatch(setDiscordGuilds({ guilds: data, loading: false, error: null }));
      } else {
        setGuilds([]);
        setGuildsError("No guilds found. Make sure your bot is in the guild and you have 'Manage Guild' permissions.");
      }
    } catch (err) {
      let message = "Failed to fetch guilds.";
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string"
    ) {
      message = (err as { message: string }).message;
    }
    setGuildsError(message);
    toast.error(message);
  } finally {
    setLoadingGuilds(false);
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (accessToken && guilds.length === 0 && !loadingGuilds && (!guildsError || guildsError.includes("No access token"))) {
        fetchGuilds();
    }
  }, [accessToken, guilds.length, loadingGuilds, guildsError, fetchGuilds]);

  const handleGuildSelect = useCallback((guild: FrontendDiscordGuild) => {
    setValue(`tasks.${index}.guildId` as Path<CreateNewTaskFormInput>, guild.id);
    setValue(`tasks.${index}.guildIcon` as Path<CreateNewTaskFormInput>, guild.icon || null);
    setDropdownOpen(false);

    lastValidated.current = { link: null, guildId: null };
    setIsLinkValidatedSuccessfully(false);

    const currentLinkValue = control._fields[`tasks.${index}.discordInviteLink` as Path<CreateNewTaskFormInput>]?._f;
    const discordLinkRegex = /^https:\/\/(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9-]{6,10}$/;

    if (typeof currentLinkValue === "string" && discordLinkRegex.test(currentLinkValue)) {
        validateLink(currentLinkValue, guild.id);
    }
  }, [index, setValue, validateLink, control]);


  return (
    <div className="flex flex-col ml-4 mt-2">
      <p className="text-gray-600">Title:</p>
      <input
        type="text"
        maxLength={maxTitleLength}
        {...register(`tasks.${index}.title`)}
        className={`border-2 p-2 rounded-xl w-full ${titleError ? "border-red-500" : ""}`}
      />
      {titleError && <span className="text-red-500">{titleError}</span>}

      <p className="text-gray-600 mt-4">Description:</p>
      <textarea
        maxLength={maxDescriptionLength}
        {...register(`tasks.${index}.description`)}
        className={`border-2 p-2 rounded-xl w-full ${descriptionError ? "border-red-500" : ""}`}
      ></textarea>
      {descriptionError && <span className="text-red-500">{descriptionError}</span>}

      <p className="text-gray-600 mt-4">Discord Guild (Select a guild, or it will be auto-filled by invite link):</p>
       {!accessToken ? (
        <div className="flex justify-start">
          <DiscordButton />
        </div>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="border-2 p-2 rounded-xl w-full text-left flex items-center justify-between"
          >
            {currentGuild ? (
              <span className="flex items-center">
                {getGuildIconUrl(currentGuild.id, currentGuild.icon) && (
                  <img
                    src={getGuildIconUrl(currentGuild.id, currentGuild.icon) || undefined}
                    alt=""
                    className="w-6 h-6 rounded-full mr-2"
                  />
                )}
                {currentGuild.name}
              </span>
            ) : (
              typeof selectedGuildId === "string" && selectedGuildId.length > 0
                ? `Selected: ${selectedGuildId}`
                : "Select a guild"
            )}
            <svg
              className={`w-4 h-4 transform ${
                dropdownOpen ? "rotate-180" : "rotate-0"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
          {guildIdError && <span className="text-red-500">{guildIdError.toString()}</span>}

          {dropdownOpen && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-lg">
              {loadingGuilds ? (
                <p className="p-2">Loading guilds...</p>
              ) : guildsError ? (
                <p className="p-2 text-red-500">Error: {guildsError}</p>
              ) : guilds && guilds.length > 0 ? (
                guilds.map((guild) => (
                  <div
                    key={guild.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => handleGuildSelect(guild)}
                  >
                    {getGuildIconUrl(guild.id, guild.icon) && (
                      <img
                        src={getGuildIconUrl(guild.id, guild.icon) || undefined}
                        alt=""
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    {guild.name}
                  </div>
                ))
              ) : (
                <p className="p-2">No guilds found. Make sure you are signed in, and then click &quot;Refresh Guilds&quot;.</p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={fetchGuilds}
            className="mt-2 text-blue-500 hover:underline flex items-center gap-2"
            disabled={loadingGuilds}
          >
            <FiRefreshCcw className={loadingGuilds ? "animate-spin" : ""} /> Refresh Guilds
          </button>
        </div>
      )}

      <p className="text-gray-600 mt-4">Discord Invite Link:</p>
      <input
        type="url"
        {...register(`tasks.${index}.discordInviteLink` as Path<CreateNewTaskFormInput>)}
        className={`border-2 p-2 rounded-xl w-full ${discordInviteLinkError || validationError ? "border-red-500" : ""}`}
        placeholder="Enter Discord invite link (e.g. https://discord.gg/invitecode)"
      />
      {discordInviteLinkError && <span className="text-red-500">{discordInviteLinkError.toString()}</span>}
      {validationLoading && (
        <p className="text-blue-500 text-sm mt-1">Validating invite link...</p>
      )}
      {validationError && (
        <p className="text-red-500 text-sm mt-1">{validationError}</p>
      )}

      {localExpiresAt !== null && (
        <p className="text-gray-700 text-sm mt-1">
          Expires:{" "}
          <span className={new Date(localExpiresAt).getTime() <= Date.now() ? "text-red-500" : ""}>
            {formatTimeRemaining(localExpiresAt)}
          </span>
          {localExpiresAt && (
            <span className="text-xs"> ({new Date(localExpiresAt).toLocaleString()})</span>
          )}
        </p>
      )}
      {localExpiresAt === null && discordInviteLink && !validationLoading && !validationError && isLinkValidatedSuccessfully && (
          <p className="text-gray-700 text-sm mt-1">This invite link never expires.</p>
      )}

      <input type="hidden" {...register(`tasks.${index}.guildId` as Path<CreateNewTaskFormInput>)} />
      <input type="hidden" {...register(`tasks.${index}.guildIcon` as Path<CreateNewTaskFormInput>)} />
      <input type="hidden" {...register(`tasks.${index}.expiresAt` as Path<CreateNewTaskFormInput>)} />
    </div>
  );
};

export default DiscordTask;