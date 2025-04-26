import React from "react";
import { motion } from "framer-motion";
import { IoArrowForwardCircleOutline } from "react-icons/io5";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  arrow?: boolean;
  smallText?: string
  light?: boolean
}

const Button = ({children, arrow, onClick, className, light}: ButtonProps) => {
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <button
        onClick={onClick}
        className={`cursor-pointer flex justify-center items-center font-medium bg-[#9173FF] px-6 py-2 rounded-xl text-white ${light ? "bg-[#9173FF]/20" : "bg-[#9173FF]"} ${className}`}
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