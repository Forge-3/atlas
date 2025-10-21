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

interface DiscordGuildProps {
  guild: DiscordGuildType;
  onClick: () => void;
}

const DiscordGuild: React.FC<DiscordGuildProps> = ({ guild, onClick }) => {
  const iconUrl = guild.icon?.[0]
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${
        guild.icon?.startsWith('a_') ? 'gif' : 'png'
      }?size=64`
    : null;

  return (
    <div
      className="flex items-center p-2 cursor-pointer hover:bg-gray-100"
      onClick={onClick}
    >
      {iconUrl && (
        <img src={iconUrl} alt={guild.name} className="w-8 h-8 rounded-full mr-2" />
      )}
      <span>{guild.name}</span>
    </div>
  );
};

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
    ? `https://cdn.discordapp.com/icons/${selectedGuild.id}/${
        selectedGuild.icon
      }.${
        selectedGuild.icon?.startsWith('a_') ? 'gif' : 'png'
      }?size=64`
    : null;

  return (
    <div className="relative">
      <div
        className="border-2 p-2 rounded-xl bg-white text-black w-full mb-2 flex items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedGuild && selectedGuildIconUrl && (
          <img
            src={selectedGuildIconUrl}
            alt={selectedGuild.name}
            className="w-8 h-8 rounded-full mr-2"
          />
        )}
        <span>{selectedGuild ? selectedGuild.name : '-- Select a guild --'}</span>
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full bg-white border rounded-xl mt-1">
          {guilds.map((guild) => (
            <DiscordGuild
              key={guild.id}
              guild={guild}
              onClick={() => handleSelect(guild)}
            />
          ))}
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
  spacePrincipal,
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
    spacePrincipal,
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
        <span className="text-red-500">{guildIdError}</span>
        )}
        {!accessToken && (
        <Button onClick={signIn} className="w-half">
          Sign in with Discord
        </Button>
        )}
        <p className="text-gray-600">Invitation Link:</p>
        <input
          {...inviteLinkProps}
          onChange={(e) => {
            setInviteLink(e.target.value);
            onInviteLinkChange(e);
          }}
          disabled={!selectedGuild}
          className={`border-2 p-2 rounded-xl bg-white text-black w-full ${
            !selectedGuild ? "bg-gray-200" : ""
          } ${
            validationState.status === "validating"
              ? "border-yellow-500"
              : validationState.status === "invalid"
              ? "border-red-500"
              : validationState.status === "valid"
              ? "border-green-500"
              : ""
          } ${inviteLinkError && "border-red-500"}`}
        />
        <div className="h-5 mt-1">
          {validationState.status === "validating" && (
            <span className="text-yellow-500">Validating...</span>
          )}
          {validationState.status === "invalid" && (
            <span className="text-red-500">{validationState.error}</span>
          )}
          {validationState.status === "valid" && (
            <span className="text-green-500">
              Invite link is valid!
              {' Expires at: '}
              {validationState.expiresAt
                ? new Date(validationState.expiresAt).toLocaleString()
                : 'Never'}
            </span>
          )}
          {validationState.status === "idle" && inviteLinkError && (
            <span className="text-red-500">{inviteLinkError}</span>
          )}
        </div>
    </div>
  );
};
export default DiscordTask;