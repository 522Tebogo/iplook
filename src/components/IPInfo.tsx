import React, { useState, useEffect } from 'react';
import { MapPin, Building, Clock } from 'lucide-react';
import type { IPInfo } from '../types';
import { getIPInfo } from '../services/ipService';

const IPInfo: React.FC = () => {
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIPInfo = async () => {
      try {
        setLoading(true);
        const info = await getIPInfo();
        setIpInfo(info);
      } catch (error) {
        console.error('获取IP信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIPInfo();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-700 dark:text-gray-300">正在加载中...</span>
        </div>
      </div>
    );
  }

  if (!ipInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-red-500 dark:text-red-400 text-center">无法获取IP信息</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">IP 信息</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-blue-500 mr-2" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">地理位置</p>
            <p className="font-medium dark:text-white">
              {ipInfo.country}, {ipInfo.city}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Building className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">ISP</p>
            <p className="font-medium dark:text-white">{ipInfo.isp}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-purple-500 mr-2" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">时区</p>
            <p className="font-medium dark:text-white">{ipInfo.timezone}</p>
          </div>
        </div>
        <div className="flex items-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">IP 地址</p>
            <p className="font-medium dark:text-white">{ipInfo.ip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPInfo;