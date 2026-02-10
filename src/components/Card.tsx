import React from "react";

interface CardProps {
  title: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  inputType?: string; // New prop
  button?: boolean;   // New prop
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  description,
  children,
  className,
  onClick,
  inputType, 
  button,  
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 m-2 max-w-sm ${className} ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <h3 className="text-md text-gray-600 dark:text-gray-300 mb-2">
          {subtitle}
        </h3>
      )}
      {description && (
        <p className="text-gray-700 dark:text-gray-400 text-sm mb-2">
          {description}
        </p>
      )}
      {/* Example of how you might use inputType or button props */}
      {inputType && (
        <input type={inputType} placeholder="Enter value" className="mt-2 p-2 border rounded w-full" />
      )}
      {button && (
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Action
        </button>
      )}
      {children}
    </div>
  );
};

export default Card;