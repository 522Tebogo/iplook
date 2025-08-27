import React, { useState } from 'react';
import { DnsLeakDetection } from './detections/DnsLeakDetection';
import { AnsDetection } from './detections/AnsDetection';
import { PurityDetection } from './detections/PurityDetection';
import { WhoerDetection } from './detections/WhoerDetection';
import { PingDetection } from './detections/PingDetection';
import { TcpingDetection } from './detections/TcpingDetection';

interface DetectionTabsProps {
  currentIP: string;
}

export const DetectionTabs: React.FC<DetectionTabsProps> = ({ currentIP }) => {
  const [activeTab, setActiveTab] = useState<string>('dns');

  const tabs = [
    { id: 'dns', label: 'DNS泄露检测' },
    { id: 'ans', label: 'ANS查询' },
    { id: 'purity', label: 'IP纯净度' },
    { id: 'whoer', label: 'Whoer查询' },
    { id: 'ping', label: 'Ping检测' },
    { id: 'tcping', label: 'TCPing检测' },
  ];

  return (
    <div className="card">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="py-6">
        {activeTab === 'dns' && <DnsLeakDetection ip={currentIP} />}
        {activeTab === 'ans' && <AnsDetection ip={currentIP} />}
        {activeTab === 'purity' && <PurityDetection ip={currentIP} />}
        {activeTab === 'whoer' && <WhoerDetection ip={currentIP} />}
        {activeTab === 'ping' && <PingDetection ip={currentIP} />}
        {activeTab === 'tcping' && <TcpingDetection ip={currentIP} />}
      </div>
    </div>
  );
};