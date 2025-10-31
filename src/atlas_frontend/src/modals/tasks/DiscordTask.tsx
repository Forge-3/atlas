import React, { useEffect, useState } from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import Button from "../../components/Shared/Button";
import type { DiscordGuild as DiscordGuildType } from "../../components/Integrations/discord/types";
import { Principal } from "@dfinity/principal";
import { useDiscordAdmin } from "../../hooks/useDiscordAdmin";
import { useDiscordAuth } from "../../hooks/useDiscordAuth";

interface DiscordGuildDropdownProps {
  guilds: DiscordGuildType[];
  selectedGuild: DiscordGuildType | null;
  onSelect: (guild: DiscordGuildType) => void;
}

const DiscordGuildDropdown: React.FC<DiscordGuildDropdownProps> = ({
  guilds,
  selectedGuild,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (guild: DiscordGuildType) => {
    onSelect(guild);
    setIsOpen(false);
  };

  const selectedGuildIconUrl = selectedGuild?.icon?.[0]
    ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.${
        selectedGuild.icon?.startsWith("a_") ? "gif" : "png"
      }?size=64`
    : null;

  return (
    <div className="relative w-full font-montserrat">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 rounded-lg bg-primary text-white flex items-center justify-between cursor-pointer transition-all duration-200 hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <div className="flex items-center">
          {selectedGuild && selectedGuildIconUrl && (
            <img
              src={selectedGuildIconUrl}
              alt={selectedGuild.name}
              className="w-6 h-6 rounded-full mr-2"
            />
          )}
          <span className="text-sm sm:text-base font-medium">
            {selectedGuild ? selectedGuild.name : "-- Select a guild --"}
          </span>
        </div>
        <svg
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg bg-primary/90 backdrop-blur-sm border border-white/20 shadow-lg max-h-56 overflow-y-auto animate-fadeIn">
          {guilds.length > 0 ? (
            guilds.map((guild) => {
              const iconUrl = guild.icon?.[0]
                ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${
                    guild.icon?.startsWith("a_") ? "gif" : "png"
                  }?size=64`
                : null;

              return (
                <div
                  key={guild.id}
                  onClick={() => handleSelect(guild)}
                  className="flex items-center p-2 hover:bg-white/10 cursor-pointer transition-colors"
                >
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt={guild.name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  )}
                  <span className="text-white text-sm">{guild.name}</span>
                </div>
              );
            })
          ) : (
            <div className="p-2 text-gray-300 text-sm text-center">
              No guilds found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface DiscordTaskProps<TFormValues extends FieldValues> {
  register: UseFormRegister<TFormValues>;
  errors?: FieldErrors<TFormValues>;
  index: number;
  maxTitleLength?: number;
  maxDescriptionLength?: number;
  guildId?: string;
  inviteLink?: string;
  spacePrincipal: Principal;
  setInviteValid: (isValid: boolean) => void;
}

const DiscordTask = <TFormValues extends FieldValues>({
  register,
  index,
  errors,
  maxTitleLength,
  maxDescriptionLength,
  guildId,
  setInviteValid,
}: DiscordTaskProps<TFormValues>) => {
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuildType | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleError = (errors?.tasks as any[])?.[index]?.title?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const descriptionError = (errors?.tasks as any[])?.[index]?.description
    ?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guildIdError = (errors?.tasks as any[])?.[index]?.guildId?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inviteLinkError = (errors?.tasks as any[])?.[index]?.inviteLink?.message;

  const { signIn, accessToken } = useDiscordAuth();
  const { adminGuilds, validationState, fetchAdminGuilds } = useDiscordAdmin(
    inviteLink,
    selectedGuild?.id,
    !inviteLinkError
  );

  useEffect(() => {
    setInviteValid(validationState.status === "valid");
  }, [validationState, setInviteValid]);

  useEffect(() => {
    if (guildId && adminGuilds.length > 0) {
      const initialGuild = adminGuilds.find((g) => g.id === guildId);
      if (initialGuild) {
        setSelectedGuild(initialGuild);
      }
    }
  }, [guildId, adminGuilds]);

  useEffect(() => {
    if (accessToken) {
      fetchAdminGuilds();
    }
  }, [accessToken, fetchAdminGuilds]);

  const { onChange } = register(`tasks.${index}.guildId` as Path<TFormValues>);
  const { onChange: onInviteLinkChange, ...inviteLinkProps } = register(
    `tasks.${index}.inviteLink` as Path<TFormValues>
  );

return (
    <>
      <div className="mb-4">
        <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
          Task Title
        </label>
        <input
          type="text"
          maxLength={maxTitleLength}
          {...register(`tasks.${index}.title` as Path<TFormValues>)}
          className={`w-full p-3 rounded-lg bg-primary/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
            titleError ? "ring-2 ring-red-500" : ""
          }`}
          placeholder="Enter task title"
        />
        {titleError && (
          <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
            {titleError.toString()}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
          Description
        </label>
        <textarea
          maxLength={maxDescriptionLength}
          {...register(`tasks.${index}.description` as Path<TFormValues>)}
          className={`w-full p-3 rounded-lg bg-primary/20 text-white h-24 resize-none md:overflow-hidden placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
            descriptionError ? "ring-2 ring-red-500" : ""
          }`}
          placeholder="Describe your Discord mission"
          rows={3}
        />
        {descriptionError && (
          <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
            {descriptionError.toString()}
          </p>
        )}
      </div>

      <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
        Discord Guild
      </label>
      <DiscordGuildDropdown
        guilds={adminGuilds}
        selectedGuild={selectedGuild}
        onSelect={(guild) => {
          setSelectedGuild(guild);
          onChange({
            target: { name: `tasks.${index}.guildId`, value: guild.id },
          });
        }}
      />
      {guildIdError && (
        <p className="text-sm text-red-300 font-montserrat font-medium mt-1">
          {guildIdError.toString()}
        </p>
      )}

      {!accessToken && (
        <Button
          onClick={signIn}
          className="text-white font-semibold mt-2 mb-4 px-4 py-2 rounded bg-primary/30"
        >
          Sign in with Discord
        </Button>
      )}

      <label className="block text-white font-montserrat text-base sm:text-lg font-semibold mb-1">
        Invitation Link
      </label>
      <input
        {...inviteLinkProps}
        onChange={(e) => {
          setInviteLink(e.target.value);
          onInviteLinkChange(e);
        }}
        disabled={!selectedGuild}
        className={`w-full p-3 rounded-lg bg-primary/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 ${
          !selectedGuild ? "opacity-50 cursor-not-allowed" : ""
        } ${
          validationState.status === "validating"
            ? "ring-yellow-400"
            : validationState.status === "invalid"
            ? "ring-red-500"
            : validationState.status === "valid"
            ? "ring-green-500"
            : ""
        } ${inviteLinkError ? "ring-2 ring-red-500" : ""}`}
        placeholder="Paste your Discord invite link"
      />

      <div className="h-5 mt-1">
        {validationState.status === "validating" && (
          <span className="text-yellow-400 font-montserrat">Validating...</span>
        )}
        {validationState.status === "invalid" && (
          <span className="text-red-400 font-montserrat">{validationState.error}</span>
        )}
        {validationState.status === "valid" && (
          <span className="text-green-400 font-montserrat">
            Invite link is valid!{" "}
            {validationState.expiresAt
              ? `(Expires: ${new Date(validationState.expiresAt).toLocaleString()})`
              : "(Never expires)"}
          </span>
        )}
      </div>
    </>
  );
};

export default DiscordTask;