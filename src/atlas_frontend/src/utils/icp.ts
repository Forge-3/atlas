export const shortPrincipal = (connectedAccount: string) => {
    return connectedAccount.substring(0, 5) + "..." + connectedAccount.substring(connectedAccount.length - 5)
}

export const IS_LOCAL = process.env.DFX_NETWORK === "local"
const LOCAL_URL = "127.0.0.1:4943"
const MAINNET_URL = "icp0.io"

export const ICP_HOST = IS_LOCAL ? LOCAL_URL : MAINNET_URL