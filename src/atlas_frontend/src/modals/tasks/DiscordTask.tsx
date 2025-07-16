import React, { useEffect, useState } from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import Button from "../../components/Shared/Button";
import type { DiscordGuild as DiscordGuildType } from "../../../../declarations/atlas_space/atlas_space.did";
import { Principal } from "@dfinity/principal";
import { useDiscordTask } from "../../hooks/useDiscordTask";

interface DiscordGuildProps {
  guild: DiscordGuildType;
  onClick: () => void;
}

const DiscordGuild: React.FC<DiscordGuildProps> = ({ guild, onClick }) => {
  const iconUrl = guild.icon?.[0]
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon[0]}.${
        guild.icon[0]?.startsWith('a_') ? 'gif' : 'png'
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
        selectedGuild.icon[0]
      }.${
        selectedGuild.icon[0]?.startsWith('a_') ? 'gif' : 'png'
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
  const { signInForUser, fetchGuildsForAdmin, accessToken, discordGuilds } = useDiscordTask(spacePrincipal);
  const [selectedGuild, setSelectedGuild] = useState<DiscordGuildType | null>(null);

  useEffect(() => {
    if (guildId && discordGuilds.length > 0) {
      const initialGuild = discordGuilds.find((g) => g.id === guildId);
      if (initialGuild) {
        setSelectedGuild(initialGuild);
      }
    }
  }, [guildId, discordGuilds]);

  useEffect(() => {
    if (accessToken) {
      fetchGuildsForAdmin();
    }
  }, [accessToken, fetchGuildsForAdmin]);

  const { onChange } = register(`tasks.${index}.guildId` as Path<TFormValues>);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const titleError = (errors?.tasks as any[])?.[index]?.title?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const descriptionError = (errors?.tasks as any[])?.[index]?.description
    ?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guildIdError = (errors?.tasks as any[])?.[index]?.guildId?.message;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inviteLinkError = (errors?.tasks as any[])?.[index]?.inviteLink?.message;

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
          guilds={discordGuilds}
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
        <Button onClick={signInForUser} className="w-half">
          Sign in with Discord
        </Button>
        )}
        <p className="text-gray-600">Invitation Link:</p>
        <input
        {...register(`tasks.${index}.inviteLink` as Path<TFormValues>)}
        className={`border-2 p-2 rounded-xl bg-white text-black w-full mb-2 ${
          inviteLinkError && "border-red-500"
        }`}
        ></input>
        {inviteLinkError && (
        <span className="text-red-500">{inviteLinkError}</span>
        )}
    </div>
  );
};
export default DiscordTask;
