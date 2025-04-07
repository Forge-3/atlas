export const shortPrincipal = (connectedAccount: string) => {
    return connectedAccount.substring(0, 5) + "..." + connectedAccount.substring(connectedAccount.length - 5)
}