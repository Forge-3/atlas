
type PopupOptions = {
  clientId: string;
  redirectUri: string;
  scope: string;
};

type AuthResult = {
  code: string;
  state: string;
  codeVerifier: string;
};

const AUTHORIZE_URL = "https://x.com/i/oauth2/authorize";


function randomState(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => ("0" + b.toString(16)).slice(-2)).join("");
}


async function buildAuthorizeUrl(opts: PopupOptions, state: string) {
const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(64)), b => ("0"+b.toString(16)).slice(-2)).join("");
const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", opts.clientId);
  url.searchParams.set("redirect_uri", opts.redirectUri);
  url.searchParams.set("scope", opts.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return { url: url.toString(), codeVerifier };
}

function openCenteredPopup(url: string, title: string, width = 520, height = 720): Window | null {
  const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
  const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
  const w = window.innerWidth ?? document.documentElement.clientWidth ?? screen.width;
  const h = window.innerHeight ?? document.documentElement.clientHeight ?? screen.height;
  const left = Math.max(0, w / 2 - width / 2) + dualScreenLeft;
  const top = Math.max(0, h / 2 - height / 2) + dualScreenTop;
  const features = [
    "scrollbars=yes",
    "resizable=yes",
    `width=${width}`,
    `height=${height}`,
    `top=${top}`,
    `left=${left}`,
  ].join(",");
  return window.open(url, title, features);
}

export async function openTwitterLoginPopup(opts: PopupOptions): Promise<AuthResult> {
  if (!opts.clientId || !opts.redirectUri || !opts.scope) {
    throw new Error("Required parameters are missing: clientId, redirectUri, scope.");
  }

  const state = randomState();

  const {url: authUrl, codeVerifier } = await buildAuthorizeUrl(opts, state);
  const popup = openCenteredPopup(await authUrl, "Sign in with X");
  if (!popup) throw new Error("Failed to open login window.");

  const expectedOrigin = new URL(opts.redirectUri).origin;

  return new Promise<AuthResult>((resolve, reject) => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== expectedOrigin) return;
      const data = ev.data as { type?: string; code?: string; state?: string; error?: string; error_description?: string };
      if (data?.type !== "x-oauth2-callback") return;

      cleanup();

      if (data.error) {
        reject(new Error(data.error_description || data.error));
        return;
      }
      if (!data.code || !data.state) {
        reject(new Error("Missing code/state in callback answer."));
        return;
      }
      resolve({ code: data.code, state: data.state, codeVerifier });
    };

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("The login window has been closed."));
      }
    }, 400);

    function cleanup() {
      clearInterval(checkClosed);
      window.removeEventListener("message", onMessage);
      try { if (popup) popup.close(); } catch {}
    }

    window.addEventListener("message", onMessage);
  });
}