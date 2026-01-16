'use client';

import React from 'react';
import Image from 'next/image';

interface ImageViewerProps {
  label: string;
  imageUrl: string | null;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ label, imageUrl }) => {
  return (
    <div className="flex flex-col col-span-2">
      <span className="font-semibold text-gray-600">{label}</span>
      <div className="mt-1 p-2 border rounded-lg h-48 flex items-center justify-center bg-gray-50">
        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={label}
              layout="fill"
              objectFit="contain"
              className="rounded-md"
            />
          </div>
        ) : (
          <p className="text-gray-500">No image uploaded</p>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;
