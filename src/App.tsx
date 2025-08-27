import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IPInfo } from './components/IPInfo';
import { DetectionTabs } from './components/DetectionTabs';
import { IPService } from './services/ipService';

export const App: React.FC = () => {
  const [currentIP, setCurrentIP] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIP = async () => {
      try {
        setLoading(true);
        setError(null);
        const ipInfo = await IPService.getCurrentIP();
        setCurrentIP(ipInfo.ip);
      } catch (error) {
        console.error('Failed to fetch IP:', error);
        setError('获取IP地址失败，将使用默认IP地址');
        // 使用默认IP地址
        setCurrentIP('8.8.8.8');
      } finally {
        setLoading(false);
      }
    };

    fetchIP();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">正在加载中...</span>
          </div>
        ) : error ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
            <p className="text-yellow-700 dark:text-yellow-300">{error}</p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-2">应用将继续运行，但某些功能可能受限。</p>
          </div>
        ) : null}
        
        {!loading && (
          <>
            <IPInfo ip={currentIP} />
            <DetectionTabs currentIP={currentIP} />
          </>
        )}
      </main>
    </div>
  );
};