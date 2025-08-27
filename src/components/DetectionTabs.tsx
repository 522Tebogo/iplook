import React, { useState } from 'react';
import { PingDetection } from './detections/PingDetection';
import { WhoerDetection } from './detections/WhoerDetection';
import { DnsLeakDetection } from './detections/DnsLeakDetection';
import { PurityDetection } from './detections/PurityDetection';
import { TcpingDetection } from './detections/TcpingDetection';
import { AnsDetection } from './detections/AnsDetection';

interface DetectionTabsProps {
  onError?: (errorMsg: string) => void;
}

export const DetectionTabs: React.FC<DetectionTabsProps> = ({ onError }) => {
  const [activeTab, setActiveTab] = useState('ping');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'ping'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('ping')}
          >
            Ping检测
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'whoer'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('whoer')}
          >
            Whoer检测
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'dns'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('dns')}
          >
            DNS泄露检测
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'purity'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('purity')}
          >
            纯净度检测
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'tcping'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('tcping')}
          >
            TCPing检测
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'ans'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => handleTabChange('ans')}
          >
            ANS检测
          </button>
        </nav>
      </div>
      <div className="p-4">
        {activeTab === 'ping' && <PingDetection onError={onError} />}
        {activeTab === 'whoer' && <WhoerDetection onError={onError} />}
        {activeTab === 'dns' && <DnsLeakDetection onError={onError} />}
        {activeTab === 'purity' && <PurityDetection onError={onError} />}
        {activeTab === 'tcping' && <TcpingDetection onError={onError} />}
        {activeTab === 'ans' && <AnsDetection onError={onError} />}
      </div>
    </div>
  );
};