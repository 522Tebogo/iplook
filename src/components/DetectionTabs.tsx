import React, { useState, useEffect } from 'react';
import { PingDetection } from './detections/PingDetection';
import { WhoerDetection } from './detections/WhoerDetection';
import { DnsLeakDetection } from './detections/DnsLeakDetection';
import { PurityDetection } from './detections/PurityDetection';
import { TcpingDetection } from './detections/TcpingDetection';
import { AnsDetection } from './detections/AnsDetection';
import { IPService } from '../services/ipService';

interface DetectionTabsProps {
  onError?: (errorMsg: string) => void;
}

export const DetectionTabs: React.FC<DetectionTabsProps> = ({ onError }) => {
  const [activeTab, setActiveTab] = useState('ping');
  const [currentIP, setCurrentIP] = useState<string>('127.0.0.1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIP = async () => {
      try {
        setLoading(true);
        const { ip } = await IPService.getCurrentIP();
        setCurrentIP(ip);
      } catch (error) {
        console.error('获取IP地址失败:', error);
        // 如果获取失败，使用默认IP
        setCurrentIP('127.0.0.1');
        if (onError) {
          onError('无法获取真实IP地址，将使用默认IP进行检测');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchIP();
  }, [onError]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-700 dark:text-gray-300">正在获取IP地址...</span>
        </div>
      </div>
    );
  }

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
        {activeTab === 'ping' && <PingDetection ip={currentIP} />}
        {activeTab === 'whoer' && <WhoerDetection ip={currentIP} />}
        {activeTab === 'dns' && <DnsLeakDetection ip={currentIP} />}
        {activeTab === 'purity' && <PurityDetection ip={currentIP} />}
        {activeTab === 'tcping' && <TcpingDetection ip={currentIP} />}
        {activeTab === 'ans' && <AnsDetection ip={currentIP} />}
      </div>
    </div>
  );
};