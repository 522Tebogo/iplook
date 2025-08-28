import React, { useState, useEffect } from 'react';
import { MapPin, Building, Clock, AlertTriangle } from 'lucide-react';
import type { IPInfo } from '../types';
import { IPService } from '../services/ipService';

const IPInfo: React.FC = () => {
  const [ipInfo, setIpInfo] = useState<IPInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIPInfo = async () => {
      try {
        setLoading(true);
        let ip = '';
        let source = '';
        
        // 直接通过 ipapi.co 获取 IP 和信息（绕过可能的代理问题）
        try {
          const response = await fetch('https://ipapi.co/json/', {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            // 为国家名称添加emoji
            const countryEmojis: { [key: string]: string } = {
              'CN': '🇨🇳',
              'US': '🇺🇸',
              'JP': '🇯🇵',
              'KR': '🇰🇷',
              'GB': '🇬🇧',
              'DE': '🇩🇪',
              'FR': '🇫🇷',
              'RU': '🇷🇺',
              'IN': '🇮🇳',
              'CA': '🇨🇦',
              'AU': '🇦🇺',
              'BR': '🇧🇷',
              'IT': '🇮🇹',
              'SG': '🇸🇬',
              'MY': '🇲🇾',
              'TH': '🇹🇭',
              'VN': '🇻🇳',
              'PH': '🇵🇭',
              'ID': '🇮🇩',
              'TR': '🇹🇷',
              'MX': '🇲🇽',
              'AR': '🇦🇷',
              'CL': '🇨🇱',
              'ZA': '🇿🇦',
              'EG': '🇪🇬',
              'NG': '🇳🇬',
              'BE': '🇧🇪',
              'NL': '🇳🇱',
              'SE': '🇸🇪',
              'NO': '🇳🇴',
              'DK': '🇩🇰',
              'FI': '🇫🇮',
              'PL': '🇵🇱',
              'CZ': '🇨🇿',
              'HU': '🇭🇺',
              'AT': '🇦🇹',
              'CH': '🇨🇭',
              'PT': '🇵🇹',
              'IE': '🇮🇪',
              'IL': '🇮🇱',
              'SA': '🇸🇦',
              'AE': '🇦🇪',
              'HK': '🇭🇰',
              'TW': '🇹🇼'
            };
            
            const emoji = countryEmojis[data.country_code] || '🏳';
            
            setIpInfo({
              ip: data.ip,
              country: `${emoji} ${data.country_name || '未知'}`,
              countryCode: data.country_code || '未知',
              region: data.region || '未知',
              city: data.city || '未知',
              isp: data.org || '未知',
              timezone: data.timezone || '未知',
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              ipSource: 'ipapi.co (direct)'
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          // 忽略错误，继续尝试其他方法
        }
        
        // 尝试从 window.getUserIP 获取 IP
        if (typeof window !== 'undefined' && (window as any).getUserIP) {
          try {
            ip = await (window as any).getUserIP();
            source = 'ipify API (direct)';
          } catch (e) {
            console.warn('通过 getUserIP 获取 IP 失败:', e);
          }
        }
        
        // 如果上面的方法失败，则使用 IPService 获取 IP
        if (!ip) {
          try {
            const ipResult = await IPService.getCurrentIP();
            ip = ipResult.ip;
            source = 'IPService';
          } catch (e) {
            console.warn('通过 IPService 获取 IP 失败:', e);
          }
        }
        
        // 如果仍然没有获取到 IP，则使用默认方法
        if (!ip) {
          const info = await IPService.getIPInfo('');
          setIpInfo(info);
          setLoading(false);
          return;
        }
        
        // 获取 IP 的详细信息
        const info = await IPService.getIPInfo(ip);
        setIpInfo({...info, ipSource: source});
        console.log('获取到的 IP 信息:', info);
      } catch (error) {
        console.error('获取IP信息失败:', error);
        // 如果获取失败，尝试使用备用方法
        try {
          const info = await IPService.getIPInfo('127.0.0.1');
          setIpInfo(info);
        } catch (fallbackError) {
          console.error('备用IP获取也失败:', fallbackError);
        }
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

  // 检查是否是 Cloudflare 的 IP
  const isCloudflareIP = ipInfo.ip.startsWith('146.235.') || ipInfo.ip.includes('cloudflare') || 
                        (ipInfo.isp && (ipInfo.isp.includes('Cloudflare') || ipInfo.isp.includes('AT&T')));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">IP 信息</h2>
      {isCloudflareIP && (
        <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            检测到您可能正在使用 Cloudflare 代理，显示的可能是代理服务器的 IP 而非您的真实 IP。
          </p>
        </div>
      )}
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
            <p className="text-xs text-gray-400 dark:text-gray-500">
              来源: {ipInfo.ipSource || (ipInfo.ip.includes('146.235') ? 'Cloudflare节点' : '真实IP')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPInfo;