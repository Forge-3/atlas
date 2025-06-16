export const formatFormError = (msg: string) => {
  const formattedMessage = msg.replace(/_/g, ' ');
  return formattedMessage.charAt(0).toUpperCase() + formattedMessage.slice(1);
}