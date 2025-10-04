import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  arrow?: boolean;
  smallText?: string
  disabled?: boolean;
  variant?: 'primary' | 'publish' | 'saveDraft' | 'vivid' | 'dark' | 'red';
  type?: "button" | "submit" | "reset";
}

const Button = ({children, onClick, className, variant = 'primary', disabled = false,}: ButtonProps) => {
  const baseClasses = "cursor-pointer flex justify-center rounded items-center py-1 md:py-2 font-montserrat";
  const variantClasses = {
    primary: "bg-primary text-white",
    publish: "bg-light text-dark",
    saveDraft: "bg-dark text-white",
    vivid: "bg-background text-white",
    dark: "bg-dark text-white",
    red: "bg-red-500 text-white"
  };

  return (
    <motion.button type={type} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`}
      disabled={disabled}
    >
        {children}
    </motion.button>
  );
};

export default Button;