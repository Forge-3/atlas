import React from "react";

interface ListItemProps {
  children: React.ReactNode;
}

const ListItem = ({ children }: ListItemProps) => {
  return (
    <div className="flex gap-2">
      <img
        src="/icons/small-a.png"
        alt="atals icon"
        className="w-[12px] h-[10px] sm:w-[18px] sm:h-[10px] mt-1.5 sm:mt-2.5"
        draggable="false"
      />

      <h3 className="text-white text-[14px] sm:text-lg font-medium">
        {children}
      </h3>
    </div>
  );
};
export default ListItem;
