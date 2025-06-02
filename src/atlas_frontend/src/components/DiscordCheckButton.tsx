import React from "react";
import Button from "./Shared/Button.tsx";

interface DiscordCheckButtonProps {
  onCheck: () => void;
}

const DiscordCheckButton = ({ onCheck }: DiscordCheckButtonProps) => (
  <Button onClick={onCheck}>Discord Check</Button>
);

export default DiscordCheckButton;
