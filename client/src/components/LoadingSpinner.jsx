import { memo } from 'react';

const LoadingSpinner = memo(function LoadingSpinner({ size = 'default', text = 'Loading...' }) {
  const sizeClass = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8" role="status" aria-label={text}>
      <div 
        className={`${sizeClass} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
        aria-hidden="true"
      />
      <span className="mt-2 text-sm text-gray-600">{text}</span>
    </div>
  );
});

export default LoadingSpinner;
