// src/components/Card.tsx
import React from 'react';
import './card.css'; // Import the dedicated CSS file

interface CardProps {
  title?: string; // Made optional
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string; // Still allows external custom classes
  onClick?: () => void;
  inputType?: string;
  button?: boolean;
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
      className={`card-base ${onClick ? 'card-clickable' : ''} ${className || ''}`}
      onClick={onClick}
    >
      {title && ( // Conditionally render title
        <h2 className="card-title">
          {title}
        </h2>
      )}
      {subtitle && (
        <h3 className="card-subtitle">
          {subtitle}
        </h3>
      )}
      {description && (
        <p className="card-description">
          {description}
        </p>
      )}
      {inputType && (
        <input type={inputType} placeholder="Enter value" className="card-input" />
      )}
      {button && (
        <button className="card-button">
          Action
        </button>
      )}
      {children}
    </div>
  );
};

export default Card;
