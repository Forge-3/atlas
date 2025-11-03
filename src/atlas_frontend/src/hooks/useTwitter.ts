import { useState } from "react";

export const useTwitter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const openPost = (xPostLink: string) => {
    window.open(xPostLink, "_blank");
    setIsOpen(true);
  };

  return {
    isOpen,
    setIsOpen,
    openPost,
  };
};