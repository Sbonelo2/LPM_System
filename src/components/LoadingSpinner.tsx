import React from 'react';


interface LoadingSpinnerProps {
    message?: string;
    size?: 'small' | 'medium' | 'large';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = 'Loading...',size = 'medium'
 }) => {
    return (
        <div className={`loading-spinner loading-spinner--${size}`}>
            <div className="loading-spinner__icon"></div>
            <p className="loading-spinner__message">{message}</p>
        </div>
    );
};

export default LoadingSpinner
