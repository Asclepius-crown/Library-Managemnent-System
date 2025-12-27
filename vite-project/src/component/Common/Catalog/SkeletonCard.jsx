import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-gray-900 rounded shadow flex flex-col justify-between overflow-hidden h-full animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-gray-800"></div>
      
      {/* Content Skeleton */}
      <div className="p-4 flex flex-col flex-grow gap-2">
        {/* Title */}
        <div className="h-6 bg-gray-800 rounded w-3/4"></div>
        {/* Author */}
        <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
        
        {/* Footer */}
        <div className="flex justify-between items-center mt-auto">
          <div className="h-3 bg-gray-800 rounded w-1/4"></div>
          <div className="h-5 bg-gray-800 rounded w-1/5"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
