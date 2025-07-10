import React from "react";
import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  arrow?: boolean;
  smallText?: string
  light?: boolean
}

const Button = ({children, onClick, className, light}: ButtonProps) => {
  return (
    <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={onClick}
        className={`cursor-pointer flex justify-center rounded-xl px-2 py-2 items-center md:text-base font-medium bg-[#9173FF]  md:px-6 md:py-2 md:rounded-2xl text-white ${light ? "bg-[#9173FF]/20" : "bg-[#9173FF]"} ${className ?? ""}`}>
      
        
        {children}
      
    </motion.button>
  );
};

export default Button;