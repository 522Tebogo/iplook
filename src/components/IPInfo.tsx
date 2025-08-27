import React, { useEffect, useState } from 'react';
import { IPService, IPInfo as IPInfoType } from '../services/ipService';
import { MapPin, Building, Clock, AlertTriangle } from 'lucide-react';
import { getCountryFlag } from '../utils/countryFlags';

interface IPInfoProps {
  ip: string;
}

export const IPInfo: React.FC<IPInfoProps> = ({ ip }) => {
  const [ipInfo, setIpInfo] = useState<IPInfoType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIPInfo = async () => {
      if (!ip) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const info = await IPService.getIPInfo(ip);
        setIpInfo(info);
      } catch (err) {
        setError('获取IP信息失败');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIPInfo();
  }, [ip]);

  if (loading) {
    return (
      <div className="card mb-8">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-700 dark:text-gray-300">正在获取IP信息...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mb-8">
        <div className="flex items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          <div className="text-yellow-700 dark:text-yellow-300">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-8">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">IP 信息</h2>
      {ipInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">地理位置</p>
              <p className="font-medium dark:text-white">
                {ipInfo.country}, {ipInfo.region}, {ipInfo.city}
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
      )}
    </div>
  );
};