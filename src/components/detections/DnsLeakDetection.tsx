import React, { useState } from 'react';
import { DnsLeakService, DnsLeakResult } from '../../services/dnsLeakService';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

interface DnsLeakDetectionProps {
  ip: string;
}

export const DnsLeakDetection: React.FC<DnsLeakDetectionProps> = ({ ip }) => {
  const [result, setResult] = useState<DnsLeakResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const dnsResult = await DnsLeakService.checkDnsLeak();
      setResult(dnsResult);
    } catch (err) {
      setError('DNS泄露检测失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">DNS泄露检测</h3>
        <button
          onClick={handleDetection}
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              检测中...
            </>
          ) : (
            '开始检测'
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
          <div className={`rounded-lg p-4 ${result.isLeaking ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
            <div className="flex items-center">
              {result.isLeaking ? (
                <>
                  <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                  <h4 className="text-lg font-medium text-red-800 dark:text-red-200">检测到DNS泄露风险</h4>
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                  <h4 className="text-lg font-medium text-green-800 dark:text-green-200">未检测到DNS泄露</h4>
                </>
              )}
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              {result.explanation}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">当前DNS服务器</h5>
              <ul className="space-y-2">
                {result.currentDnsServers.map((server, index) => (
                  <li key={index} className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-gray-700 dark:text-gray-300">{server}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">检测结果</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测域名:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.testDomain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">泄露状态:</span>
                  <span className={`font-medium ${result.isLeaking ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {result.isLeaking ? '存在泄露' : '安全'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测时间:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.timestamp}</span>
                </div>
                {result.dnsProvider && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">DNS提供商:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{result.dnsProvider}</span>
                  </div>
                )}
                {result.responseTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">响应时间:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{result.responseTime}ms</span>
                  </div>
                )}
                {result.serverLocation && (
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">服务器位置:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{result.serverLocation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 添加详细解释信息 */}
          <div className="card">
            <div className="flex items-center mb-3">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <h5 className="font-medium text-gray-900 dark:text-white">详细说明</h5>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• DNS泄露是指您的DNS查询请求被发送到ISP的DNS服务器，而不是您配置的DNS服务器</p>
              <p>• 这可能导致您的网络活动被ISP监控，并可能泄露您的位置信息</p>
              <p>• 使用公共DNS服务器（如8.8.8.8、1.1.1.1）通常更安全</p>
              <p>• 如果检测到泄露，建议使用VPN或配置安全的DNS服务器</p>
            </div>
          </div>

          {/* 数据源信息 */}
          <div className="card">
            <div className="flex items-center mb-3">
              <Info className="h-5 w-5 text-green-500 mr-2" />
              <h5 className="font-medium text-gray-900 dark:text-white">数据源信息</h5>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <p>• DNS检测: Google DNS API + 本地检测</p>
              <p>• 公共DNS数据库: 实时更新的公共DNS服务器列表</p>
              <p>• 缓存时间: 10分钟</p>
              <p className="text-blue-600 dark:text-blue-400">
                💡 提示: 检测结果结合了外部API数据和本地分析，提供更准确的DNS泄露评估
              </p>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">尚未进行DNS泄露检测</h4>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            点击"开始检测"按钮检测您的DNS查询是否可能泄露您的真实IP地址和位置信息。
          </p>
        </div>
      )}
    </div>
  );
};