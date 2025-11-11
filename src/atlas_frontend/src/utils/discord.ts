import type { DiscordInviteApiResponse } from "../components/Integrations/discord/types";

export interface DiscordValidationResult {
  status: "valid" | "invalid";
  expiresAt?: string | null;
  error?: string | null;
}

export const createTimeoutPromise = (timeoutMs: number = 5000): Promise<never> => {
  return new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Validation timed out.")),
      timeoutMs
    )
  );
};

export const validateDiscordInviteLink = async (
  inviteLink: string,
  guildId: string,
  validateDiscordInviteFn: (inviteCode: string, guildId: string) => Promise<DiscordInviteApiResponse>
): Promise<DiscordValidationResult> => {
  try {
    const inviteCodeMatch = inviteLink.match(
      /(?:https?:\/\/)?(?:discord\.(?:gg|com\/invite)\/)?([a-zA-Z0-9-]+)/
    );
    const inviteCode = inviteCodeMatch ? inviteCodeMatch[1] : null;

    if (!inviteCode) {
      throw new Error("Invalid invite link.");
    }

    const validationPromise = validateDiscordInviteFn(inviteCode, guildId);
    const timeoutPromise = createTimeoutPromise();

    const result = await Promise.race([validationPromise, timeoutPromise]);

    if (result && result.expires_at && result.expires_at.length > 0) {
      return {
        status: "valid",
        expiresAt: result.expires_at,
      };
    } else {
      return { status: "valid" };
    }
  } catch (err) {
    console.error("Validation error:", err);
    let message = "An unknown error occurred during validation.";
    if (err instanceof Error) {
      message = err.message || "Invalid invite link or guild ID.";
    } else if (typeof err === "string") {
      message = err;
    }
    return {
      status: "invalid",
      error: message,
    };
  }
};