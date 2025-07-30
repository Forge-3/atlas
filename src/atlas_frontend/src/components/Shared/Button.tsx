import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  arrow?: boolean;
  smallText?: string
  variant?: 'primary' | 'light' | 'publish' | 'saveDraft';
}

const Button = ({children, onClick, className, variant = 'primary'}: ButtonProps) => {
  const baseClasses = "cursor-pointer flex justify-center rounded-xl px-2 py-1 items-center md:text-base font-medium md:px-6 md:py-2 md:rounded-2xl";
  const variantClasses = {
    primary: "bg-[#9173FF] text-white",
    light: "bg-[#9173FF]/20 text-white",
    publish: "text-[#290C69] bg-white",
    saveDraft: "bg-[#290C69] text-white",
  };

  return (
    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`}
    >      
        {children}
      
    </motion.button>
  );
};

export default Button;