import React, { useCallback, useEffect, useRef, useState } from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import Button from "../../components/Shared/Button";
import { getOAuth2URL, getUserData, type UserData } from "../../integrations/discord";
import { useAuth } from "@nfid/identitykit/react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { setDiscordUserAccessToken } from "../../store/slices/userSlice";
import type { RootState } from "../../store/store";
import { useAuthAtlasSpaceActor } from "../../hooks/identityKit";
import { getDiscordGuilds } from "../../canisters/atlasSpace/api";
import type { DiscordGuild } from "../../../../declarations/atlas_space/atlas_space.did";
import { Principal } from "@dfinity/principal";


interface DiscordTaskProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  index: number;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  guildId: number;
  spacePrincipal: Principal;
}

const DiscordTask = <TFormValues extends FieldValues>({
  register,
  index,
  errors,
  maxTitleLength,
  maxDescriptionLength,
  guildId,
  spacePrincipal,
}: DiscordTaskProps<TFormValues>) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const accessToken = useSelector((state: RootState) => state.user.accessToken)

  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuild[]>([]);
  const [, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const authAtlasSpace = spacePrincipal ? useAuthAtlasSpaceActor(spacePrincipal) : null;

  const openOAuthTab = () => {
      window.open(getOAuth2URL(user?.principal.toString()), "_blank", "width=500,height=600");
    };

  const fetchDiscordData = useCallback(
    async (token: string) => {
      if(!authAtlasSpace || hasFetched.current) return;

      setLoading(true);
      try {
        const userData: UserData = await getUserData(token);
        dispatch(setDiscordUserAccessToken({ accessToken: token }));
        toast.success(`Welcome, ${userData.username}!`);

        const toastId = toast.loading("Loading Discord guilds...");

        const guilds = await getDiscordGuilds(authAtlasSpace, token);
        setDiscordGuilds(guilds);

        toast.success("Discord guilds loaded!", {id: toastId});
        console.log("Fetched guilds: ", guilds);
        hasFetched.current = true;
        } catch (err) {
            console.error('Failed to fetch Discord data: ', err);
            toast.error('Failed to load Discord data.');
            setDiscordGuilds([]);
        } finally {
        setLoading(false);
      }
    },
    [dispatch, authAtlasSpace]
  );

const handleMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    const { accessToken } = event.data as { accessToken: string };
    if (accessToken) fetchDiscordData(accessToken);
  },
  [fetchDiscordData]
);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

   useEffect(() => {
    if (accessToken && authAtlasSpace && !hasFetched.current) {
      hasFetched.current = true;
      fetchDiscordData(accessToken);
    }
  }, [accessToken, authAtlasSpace, fetchDiscordData]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleError = (errors?.tasks as any[])?.[index]?.title?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const descriptionError = (errors?.tasks as any[])?.[index]?.description
    ?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guildIdError = (errors?.tasks as any[])?.[index]?.guildId?.message;

  return (
    <div className="flex flex-col ml-4 mt-2">
      <p className="text-gray-600">Title:</p>
      <input
        type="text"
        maxLength={maxTitleLength}
        {...register(`tasks.${index}.title` as Path<TFormValues>)}
        className={`border-2 p-2 rounded-xl ${
          titleError && "border-red-500"
        }`}
      />
      {titleError && <span className="text-red-500">{titleError}</span>}

      <p className="text-gray-600">Description:</p>
      <textarea
        maxLength={maxDescriptionLength}
        {...register(`tasks.${index}.description` as Path<TFormValues>)}
        className={`border-2 p-2 rounded-xl ${
          descriptionError && "border-red-500"
        }`}
      ></textarea>
      {descriptionError && (
        <span className="text-red-500">{descriptionError}</span>
      )}
      <p className="text-gray-600">Guild ID:</p>
        <select
        {...register(`tasks.${index}.guildId` as Path<TFormValues>)}
        className={`border-2 p-2 rounded-xl bg-white text-black w-full mb-2 ${
          guildIdError && "border-red-500"
        }`}
        defaultValue={guildId}
        >
        <option value="">-- Select a guild --</option>
        {discordGuilds.map((guild) => {
          
          const iconValue = guild.icon?.[0];
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const iconUrl = iconValue
            ? `https://cdn.discordapp.com/icons/${guild.id}/${iconValue}.${
                iconValue?.startsWith("a_") ? "gif" : "png"
              }?size=64`
            : null;
          return (
            <option key={guild.id} value={guild.id}>
              {guild.name}
            </option>
          );
        })}
        </select>
        {!accessToken && (
        <Button onClick={openOAuthTab} className="w-half">
          Sign in with Discord
        </Button>
        )}
    </div>
  );
};
export default DiscordTask;


