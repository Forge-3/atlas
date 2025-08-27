import { useCallback, useEffect, useRef, useState } from "react";
import type { Principal } from "@dfinity/principal";
import toast from "react-hot-toast";
import { getDiscordGuilds, validateDiscordInvite } from "../canisters/atlasSpace/api";
import type { DiscordGuild as DiscordGuildType } from "../components/Integrations/discord/types";
import { useDiscordAuth } from "./useDiscordAuth";
import { validateDiscordInviteLink } from "../utils/discord";

export type ValidationStatus = "idle" | "validating" | "valid" | "invalid";

export interface ValidationState {
  status: ValidationStatus;
  error?: string | null;
  expiresAt?: string | null;
}

export const useDiscordAdmin = (
  spacePrincipal?: Principal,
  inviteLink?: string,
  guildId?: string | null,
  isLinkFormatValid?: boolean
) => {
  const { accessToken } = useDiscordAuth();
  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuildType[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    status: "idle",
  });
  const hasFetchedGuilds = useRef(false);
  const previousValidationInput = useRef<{ inviteLink?: string; guildId?: string } | null>(null);

  const fetchAdminGuilds = useCallback(async () => {
    if (!accessToken || hasFetchedGuilds.current) return;
    hasFetchedGuilds.current = true;
    setLoading(true);
    try {
      const toastId = toast.loading("Loading Discord guilds...");
      const guilds = await getDiscordGuilds(accessToken);
      setDiscordGuilds(guilds);
      toast.success("Discord guilds loaded!", { id: toastId });
    } catch (err) {
      console.error('Failed to fetch Discord guilds: ', err);
      toast.error('Failed to load Discord guilds.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchAdminGuilds();
    }
  }, [accessToken, fetchAdminGuilds]);

  useEffect(() => {
    if (!isLinkFormatValid || !inviteLink || !guildId) {
      setValidationState({ status: "idle" });
      return;
    }

    if (
      validationState.status === "valid" &&
      previousValidationInput.current?.inviteLink === inviteLink &&
      previousValidationInput.current?.guildId === guildId
    ) {
      return;
    }

    previousValidationInput.current = { inviteLink, guildId };

    const validate = async () => {
      setValidationState({ status: "validating" });

      const result = await validateDiscordInviteLink(
        inviteLink,
        guildId,
        validateDiscordInvite
      );

      setValidationState({
        status: result.status,
        expiresAt: result.expiresAt,
        error: result.error,
      });
    };

    const timeoutId = setTimeout(validate, 500);
    return () => clearTimeout(timeoutId);
  }, [inviteLink, guildId, isLinkFormatValid]);

  return {
    adminGuilds: discordGuilds,
    validationState,
    loading,
    fetchAdminGuilds,
  };
};