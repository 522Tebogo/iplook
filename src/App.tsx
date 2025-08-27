import React, { useState } from 'react';
import { Header } from './components/Header';
import IPInfoComponent from './components/IPInfo';
import { DetectionTabs } from './components/DetectionTabs';

export const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  // 模拟错误处理
  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
            <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-2">应用将继续运行，但某些功能可能受限。</p>
          </div>
        )}
        <IPInfoComponent />
        <DetectionTabs onError={handleError} />
      </main>
    </div>
  );
};