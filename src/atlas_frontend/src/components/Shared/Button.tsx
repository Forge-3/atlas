import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  arrow?: boolean;
  smallText?: string
  light?: boolean
  disabled?: boolean;
}

const Button = ({children, onClick, className, light, disabled}: ButtonProps) => {
  return (
    <motion.div whileHover={!disabled ? { scale: 1.01 } : {}} whileTap={!disabled ? { scale: 0.99 } : {}}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`cursor-pointer flex justify-center items-center font-medium bg-[#9173FF] px-6 py-2 rounded-xl text-white ${light ? "bg-[#9173FF]/20" : "bg-[#9173FF]"} ${className ?? ""} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {children}
      </button>
    </motion.div>
  );
};

export default Button;