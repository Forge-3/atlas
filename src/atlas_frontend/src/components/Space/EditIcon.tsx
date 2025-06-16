import React from "react";
import { FiEdit2 } from "react-icons/fi";

const EditIcon = () => {
  return (
    <button className="text-white border-2 p-2 rounded-full absolute top-4 right-4">
      <FiEdit2 size={24} />
    </button>
  );
};

export default EditIcon;
