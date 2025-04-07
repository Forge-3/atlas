import React from "react";
import { motion } from "framer-motion";
import { IoArrowForwardCircleOutline } from "react-icons/io5";

const Button = (props: {
  content: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  arrow?: boolean;
  smallText?: string
}) => {
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <button
        onClick={(event) => props.onClick!(event)}
        className={`cursor-pointer flex justify-center items-center font-medium  bg-[#9173FF] px-7 py-2 rounded-xl text-white md:text-xl dlg:text-2xl  ${props.className}`}
      >
        {props.arrow && (
          <span className="mr-2 text-white md:text-2xl dlg:text-3xl">
            <IoArrowForwardCircleOutline />
          </span>
        )}
        <span>{props.content}</span>
      </button>
    </motion.div>
  );
};

export default Button;