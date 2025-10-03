import React from 'react';

const ProtectedRoute = ({ children }) => {
  // For now, just check if token exists in localStorage
  // Later you can implement proper JWT verification
  const token = localStorage.getItem('token');
  const refreshToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('refreshToken='))
    ?.split('=')[1];

  // For demo purposes, we'll render children if token exists
  // In production, you'd want proper authentication flow
  if (!token && !refreshToken) {
    // Redirect to login - for now we'll just show a message
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Please login to access the admin dashboard.</p>
          <button 
            onClick={() => {
              localStorage.setItem('token', 'demo-token');
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Demo Login
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;