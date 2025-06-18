import { useState, useEffect } from 'react';
import { AnalyticsEvent } from '../utils/analytics';

interface AnalyticsEntry {
  event: AnalyticsEvent;
  details?: Record<string, any>;
  timestamp: string;
}

interface AnalyticsSummary {
  totalEvents: number;
  mostFrequentEvent: {
    type: AnalyticsEvent;
    count: number;
  };
  firstEvent: string;
  lastEvent: string;
}

const AnalyticsExport = () => {
  const [analytics, setAnalytics] = useState<AnalyticsEntry[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (analytics.length > 0) {
      const eventCounts = analytics.reduce((acc, entry) => {
        acc[entry.event] = (acc[entry.event] || 0) + 1;
        return acc;
      }, {} as Record<AnalyticsEvent, number>);

      const mostFrequent = Object.entries(eventCounts).reduce((max, [type, count]) => {
        return count > max.count ? { type: type as AnalyticsEvent, count } : max;
      }, { type: analytics[0].event, count: 0 });

      const timestamps = analytics.map(entry => new Date(entry.timestamp).getTime());
      const firstEvent = new Date(Math.min(...timestamps)).toISOString();
      const lastEvent = new Date(Math.max(...timestamps)).toISOString();

      setSummary({
        totalEvents: analytics.length,
        mostFrequentEvent: mostFrequent,
        firstEvent,
        lastEvent
      });
    } else {
      setSummary(null);
    }
  }, [analytics]);

  const loadAnalytics = () => {
    try {
      const storedAnalytics = localStorage.getItem('analytics');
      if (storedAnalytics) {
        setAnalytics(JSON.parse(storedAnalytics));
      }
    } catch (error) {
      console.warn('Failed to load analytics:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    localStorage.removeItem('analytics');
    setAnalytics([]);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(dateString));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Usage Insights</h2>
        <div className="space-x-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={analytics.length === 0}
          >
            Download JSON
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            disabled={analytics.length === 0}
          >
            Clear Analytics
          </button>
        </div>
      </div>

      {analytics.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No analytics data available</p>
      ) : (
        <>
          {summary && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">Total Events</div>
                  <div className="text-lg font-semibold text-gray-900">{summary.totalEvents}</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">Most Frequent Event</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {summary.mostFrequentEvent.type}
                    <span className="text-sm text-gray-500 ml-2">
                      ({summary.mostFrequentEvent.count} times)
                    </span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">First Event</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(summary.firstEvent)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="text-sm text-gray-500">Last Event</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(summary.lastEvent)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {entry.event}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.details ? (
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsExport; 