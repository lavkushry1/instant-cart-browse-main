import React from 'react';

interface AuthCTAProps {
  isLoggedIn: boolean;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
  onLogoutClick?: () => void;
  userName?: string;
}

const AuthCTA: React.FC<AuthCTAProps> = ({
  isLoggedIn,
  onLoginClick,
  onRegisterClick,
  onLogoutClick,
  userName,
}) => {
  if (isLoggedIn) {
    return (
      <div className="flex items-center space-x-2">
        {userName && <span className="text-gray-700">Hi, {userName}</span>}
        <button
          onClick={onLogoutClick}
          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 transition duration-150 ease-in-out"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onLoginClick}
        className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 ease-in-out"
      >
        Login
      </button>
      <button
        onClick={onRegisterClick}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-150 ease-in-out"
      >
        Register
      </button>
    </div>
  );
};

export default AuthCTA;
