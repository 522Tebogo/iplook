import React, { useState } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { PingResult } from '../../types';
import { performPingDetection } from '../../services/pingService';

interface PingDetectionProps {
  ip: string;
}

export const PingDetection: React.FC<PingDetectionProps> = ({ ip }) => {
  const [result, setResult] = useState<PingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targetHost, setTargetHost] = useState<string>(ip);

  const handleDetection = async () => {
    if (!targetHost) {
      setError('请输入目标主机');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 使用真实检测服务
      const pingResult = await performPingDetection(targetHost);
      setResult(pingResult);
    } catch (err) {
      setError('Ping检测失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ping检测</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={targetHost}
            onChange={(e) => setTargetHost(e.target.value)}
            placeholder="输入目标主机"
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
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
            result.lossPercentage < 5 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : result.lossPercentage < 15 
                ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center">
              <Activity className="h-6 w-6 mr-2" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Ping检测完成</h4>
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              向目标主机发送了 {result.packets} 个数据包，接收了 {result.received} 个，丢失了 {result.lost} 个，丢包率 {result.lossPercentage.toFixed(1)}%。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">延迟统计</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <span className="text-gray-700 dark:text-gray-300">最小延迟</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.minTime.toFixed(2)} ms</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <span className="text-gray-700 dark:text-gray-300">平均延迟</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.avgTime.toFixed(2)} ms</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                  <span className="text-gray-700 dark:text-gray-300">最大延迟</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.maxTime.toFixed(2)} ms</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">数据包统计</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">发送数据包:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.packets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">接收数据包:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.received}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">丢失数据包:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.lost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">丢包率:</span>
                  <span className={`font-medium ${
                    result.lossPercentage < 5 
                      ? 'text-green-600 dark:text-green-400' 
                      : result.lossPercentage < 15 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.lossPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">网络质量评估</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.avgTime.toFixed(2)} ms</div>
                <div className="text-gray-700 dark:text-gray-300">平均延迟</div>
                <div className={`text-sm mt-1 ${
                  result.avgTime < 50 
                    ? 'text-green-600 dark:text-green-400' 
                    : result.avgTime < 100 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {result.avgTime < 50 ? '优秀' : result.avgTime < 100 ? '良好' : '较差'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.lossPercentage.toFixed(1)}%</div>
                <div className="text-gray-700 dark:text-gray-300">丢包率</div>
                <div className={`text-sm mt-1 ${
                  result.lossPercentage < 5 
                    ? 'text-green-600 dark:text-green-400' 
                    : result.lossPercentage < 15 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {result.lossPercentage < 5 ? '优秀' : result.lossPercentage < 15 ? '良好' : '较差'}
                </div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.times.length}</div>
                <div className="text-gray-700 dark:text-gray-300">有效响应</div>
                <div className={`text-sm mt-1 ${
                  result.times.length >= result.packets * 0.8 
                    ? 'text-green-600 dark:text-green-400' 
                    : result.times.length >= result.packets * 0.5 
                      ? 'text-yellow-600 dark:text-yellow-400' 
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {result.times.length >= result.packets * 0.8 ? '稳定' : result.times.length >= result.packets * 0.5 ? '一般' : '不稳定'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Activity className="h-12 w-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">尚未进行Ping检测</h4>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            点击"开始检测"按钮测试到目标主机的网络连接质量，包括延迟、丢包率等指标。
          </p>
        </div>
      )}
    </div>
  );
};