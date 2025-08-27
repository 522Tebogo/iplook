import React from 'react';
import { Globe, Shield, Search } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              IPLook
            </h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <Search className="h-4 w-4 mr-1" />
              检测
            </a>
            <a href="#" className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
              <Shield className="h-4 w-4 mr-1" />
              安全
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};