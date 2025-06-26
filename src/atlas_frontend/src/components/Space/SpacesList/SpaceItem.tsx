import { motion } from "framer-motion";
import React from "react";

interface SpaceItemProps {
  name: string;
  description: string;
  avatarImg: string | null;
  backgroundImg: string | null;
}

const SpaceItem = ({
  name,
  description,
  backgroundImg,
  avatarImg,
}: SpaceItemProps) => {
  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <div className="rounded-xl bg-[#1E0F33] p-4 text-white">
        <div
          className={`${backgroundImg ? "h-52 rounded-3xl bg-center bg-no-repeat bg-cover relative" : "bg-[#4A0295]"} w-full flex items-center justify-center`}
          style={
            backgroundImg ? { backgroundImage: `url('${backgroundImg}')` } : {}
          }
        ></div>
        <div className={`relative -top-16 mb-8 sm:mb-16 ${!backgroundImg ? "pt-16" : ""}`}>
          <div className="absolute flex">
            {avatarImg ? (
              <img
                src={avatarImg}
                draggable="false"
                className="rounded-3xl m-[5px] w-20 h-20 sm:w-28 sm:h-28"
              />
            ) : (
              <div className="bg-[#4A0295] rounded-3xl m-[5px] w-20 h-20 sm:w-28 sm:h-28"></div>
            )}
          </div>
        </div>
        <div className="mt-2">
          <h3 className="text-2xl font-semibold flex">{name}</h3>
          <p className="truncate">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default SpaceItem;
