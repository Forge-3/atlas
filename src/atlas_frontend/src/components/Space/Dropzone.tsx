import React from "react";
import { useDropzone, type DropzoneOptions } from "react-dropzone";

interface DropzoneProps {
  children: React.ReactNode;
  options?: DropzoneOptions;
}

const Dropzone = ({ children, options }: DropzoneProps) => {
  const { getRootProps, getInputProps } = useDropzone(options);

  return (
    <div {...getRootProps({ className: "xxxx " })}>
      <input {...getInputProps()} />
      {children}
    </div>
  );
};

export default Dropzone;
