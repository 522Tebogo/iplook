import React, { useState } from 'react';
import { WhoerService, WhoerResult } from '../../services/whoerService';
import { User, CheckCircle, XCircle, AlertTriangle, MapPin } from 'lucide-react';

interface WhoerDetectionProps {
  ip: string;
}

export const WhoerDetection: React.FC<WhoerDetectionProps> = ({ ip }) => {
  const [result, setResult] = useState<WhoerResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const whoerResult = await WhoerService.checkWhoer(ip);
      setResult(whoerResult);
    } catch (err) {
      setError('Whoer查询失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Whoer查询</h3>
        <button
          onClick={handleDetection}
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              查询中...
            </>
          ) : (
            '开始查询'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className={`rounded-lg p-4 ${
            result.privacyScore > 80 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : result.privacyScore > 50 
                ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center">
              {result.privacyScore > 80 ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <h4 className="text-lg font-medium text-green-800 dark:text-green-200">隐私保护良好</h4>
                </>
              ) : result.privacyScore > 50 ? (
                <>
                  <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                  <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">隐私保护一般</h4>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500 mr-2" />
                  <h4 className="text-lg font-medium text-red-800 dark:text-red-200">隐私保护较差</h4>
                </>
              )}
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              您的隐私分数是 {result.privacyScore}/100。{result.privacyScore > 80 
                ? '您的在线隐私保护得很好，很难被追踪。' 
                : result.privacyScore > 50 
                  ? '您的在线隐私保护一般，建议采取额外措施。' 
                  : '您的在线隐私保护较差，容易被追踪和识别。'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">基本信息</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">IP地址:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">地理位置:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">ISP:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.isp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">时区:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.timezone}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">隐私检测</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">代理检测</span>
                  </div>
                  <span className={`font-medium ${result.usingProxy ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {result.usingProxy ? '使用中' : '未使用'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-purple-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">VPN检测</span>
                  </div>
                  <span className={`font-medium ${result.usingVpn ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {result.usingVpn ? '使用中' : '未使用'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">Tor检测</span>
                  </div>
                  <span className={`font-medium ${result.usingTor ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {result.usingTor ? '使用中' : '未使用'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">浏览器信息</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="text-gray-700 dark:text-gray-300 mb-2">浏览器指纹</h6>
                <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md font-mono">
                  {result.browserFingerprint}
                </div>
              </div>
              <div>
                <h6 className="text-gray-700 dark:text-gray-300 mb-2">HTTP头部信息</h6>
                <div className="text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md font-mono">
                  {result.httpHeaders}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <User className="h-12 w-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">尚未进行Whoer查询</h4>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            点击"开始查询"按钮进行全面的IP地址和隐私检测，包括代理、VPN、Tor检测等。
          </p>
        </div>
      )}
    </div>
  );
};