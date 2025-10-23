import React, { useEffect, useState, useRef } from "react";
import Barcode from "react-barcode";

interface Props {
  value: string;
  onChange: (dataUrl: string) => void;
}

export const BarcodeToDataURL: React.FC<Props> = ({ value, onChange }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (wrapper) {
      // Find the <svg> inside the wrapper
      const svg = wrapper.querySelector("svg");
      if (svg) {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const encoded = "data:image/svg+xml;base64," + window.btoa(svgString);
        onChange(encoded);
      }
    }
  }, [value, onChange]);

  return (
    <div ref={wrapperRef}>
      <Barcode value={value} />
    </div>
  );
};
