import React from 'react';
import { Cloud } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t py-12 border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center space-x-2">
              <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-2">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                KingsShare
              </span>
            </div>
            <p className="mb-4 max-w-md text-gray-600">
              The most secure and collaborative cloud storage platform for
              individuals and teams.
            </p>
          </div>
          {/* Additional footer columns can be added here */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;