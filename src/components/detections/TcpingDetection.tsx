import React, { useState } from 'react';
import { Server, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { TCPingResult } from '../../types';
import { performMockTCPingDetection, performCommonPortsDetection, getPortStatusDescription } from '../../services/tcpingService';

interface TcpingDetectionProps {
  ip: string;
}

export const TcpingDetection: React.FC<TcpingDetectionProps> = ({ ip }) => {
  const [result, setResult] = useState<TCPingResult[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [targetHost, setTargetHost] = useState<string>(ip);
  const [targetPort, setTargetPort] = useState<string>('80');

  const handleSinglePortDetection = async () => {
    if (!targetHost) {
      setError('请输入目标主机');
      return;
    }

    if (!targetPort || isNaN(Number(targetPort))) {
      setError('请输入有效的端口号');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 使用模拟检测服务
      const tcpingResult = await performMockTCPingDetection(targetHost, Number(targetPort));
      setResult([tcpingResult]);
    } catch (err) {
      setError('TCPing检测失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommonPortsDetection = async () => {
    if (!targetHost) {
      setError('请输入目标主机');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 使用模拟检测服务
      const tcpingResults = await performCommonPortsDetection(targetHost);
      setResult(tcpingResults);
    } catch (err) {
      setError('TCPing检测失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPortsCount = result ? result.filter(r => r.status === 'open').length : 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">TCPing检测</h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={targetHost}
              onChange={(e) => setTargetHost(e.target.value)}
              placeholder="输入目标主机"
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="text"
              value={targetPort}
              onChange={(e) => setTargetPort(e.target.value)}
              placeholder="端口"
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-20"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSinglePortDetection}
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  检测中...
                </>
              ) : (
                '检测端口'
              )}
            </button>
            <button
              onClick={handleCommonPortsDetection}
              disabled={loading}
              className="btn-secondary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 dark:border-gray-300 mr-2"></div>
                  检测中...
                </>
              ) : (
                '常用端口'
              )}
            </button>
          </div>
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
            openPortsCount > 5 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : openPortsCount > 2 
                ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center">
              <Server className="h-6 w-6 mr-2" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">TCPing检测完成</h4>
            </div>
            <p className="mt-2 text-gray-700 dark:text-gray-300">
              检测了 {result.length} 个端口，其中 {openPortsCount} 个端口开放。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">开放端口</h5>
              {openPortsCount > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {result.filter(r => r.status === 'open').map((port, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <span className="font-medium text-gray-900 dark:text-white">端口 {port.port}</span>
                      <span className="text-sm text-green-700 dark:text-green-300">{port.serviceName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  未发现开放端口
                </div>
              )}
            </div>

            <div className="card">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">检测统计</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测主机:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{targetHost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测端口数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{result.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">开放端口数:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{openPortsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">检测时间:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {result[0]?.timestamp || new Date().toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h5 className="font-medium text-gray-900 dark:text-white mb-3">端口详情</h5>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">端口号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">服务</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">响应时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">描述</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {result.map((port, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{port.port}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{port.serviceName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {port.status === 'open' ? (
                          <span className="badge-success">开放</span>
                        ) : port.status === 'closed' ? (
                          <span className="badge-error">关闭</span>
                        ) : (
                          <span className="badge-warning">过滤</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {port.responseTime ? `${port.responseTime.toFixed(2)} ms` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {getPortStatusDescription(port.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Server className="h-12 w-12 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">尚未进行TCPing检测</h4>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto">
            点击"检测端口"按钮测试目标主机特定端口的开放情况和连接质量，或点击"常用端口"检测常见服务端口。
          </p>
        </div>
      )}
    </div>
  );
};