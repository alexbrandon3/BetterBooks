import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-blue-700 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-6">Sorry, the page you're looking for doesn't exist or has been moved.</p>
      <Link
        to="/"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFound; 