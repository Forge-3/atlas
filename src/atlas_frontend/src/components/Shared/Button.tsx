import React from "react";
import { motion } from "framer-motion";
import { IoArrowForwardCircleOutline } from "react-icons/io5";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  arrow?: boolean;
  smallText?: string
  light?: boolean;
  disabled?: boolean;
}

const Button = ({children, arrow, onClick, className, light, disabled,}: ButtonProps) => {
  return (
    <motion.div whileHover={disabled ? undefined : { scale: 1.01 }} whileTap={disabled ? undefined : { scale: 0.99 }}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`cursor-pointer flex justify-center items-center font-medium px-6 py-2 rounded-xl text-white 
          ${light ? "bg-[#9173FF]/20" : "bg-[#9173FF]"}
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        {arrow && (
          <span className="mr-2 text-white">
            <IoArrowForwardCircleOutline />
          </span>
        )}
        {children}
      </button>
    </motion.div>
  );
};


export default Button;