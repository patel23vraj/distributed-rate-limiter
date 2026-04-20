// dashboard/src/pages/Overview.jsx
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend
} from 'recharts';
import {
  getOverview,
  getRequestVolume,
  getAlgorithmStats,
  getTopUsers,
} from '../api/metrics';
import StatCard from '../components/StatCard';

const COLORS = ['#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'];

const Overview = () => {
  const [overview, setOverview] = useState(null);
  const [volume, setVolume] = useState([]);
  const [algorithms, setAlgorithms] = useState([]);
  const [topUsers, setTopUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ov, vol, alg, users] = await Promise.all([
          getOverview(),
          getRequestVolume(24),
          getAlgorithmStats(),
          getTopUsers(),
        ]);
        setOverview(ov);
        setVolume(vol.reverse());
        setAlgorithms(alg);
        setTopUsers(users);
      } catch (err) {
        setError('Failed to load metrics. Is the API running?');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
      Loading metrics...
    </div>
  );

  if (error) return (
    <div style={{
      padding: '48px',
      textAlign: 'center',
      color: '#ef4444',
      background: '#1e293b',
      margin: '24px',
      borderRadius: '12px',
    }}>
      {error}
    </div>
  );

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <StatCard
          title="Total Requests"
          value={overview?.total_requests?.toLocaleString() ?? 0}
          subtitle="All time"
          color="#6366f1"
        />
        <StatCard
          title="Total Blocked"
          value={overview?.total_blocked?.toLocaleString() ?? 0}
          subtitle="All time"
          color="#ef4444"
        />
        <StatCard
          title="Block Rate"
          value={`${overview?.block_rate_percent ?? 0}%`}
          subtitle="Of all requests"
          color="#f59e0b"
        />
        <StatCard
          title="Last 24 Hours"
          value={overview?.last_24_hours?.toLocaleString() ?? 0}
          subtitle="Total requests"
          color="#22c55e"
        />
        <StatCard
          title="Last Hour"
          value={overview?.last_hour?.toLocaleString() ?? 0}
          subtitle="Total requests"
          color="#8b5cf6"
        />
        <StatCard
          title="Unique IPs"
          value={overview?.unique_ips?.toLocaleString() ?? 0}
          subtitle="All time"
          color="#06b6d4"
        />
      </div>

      {/* Charts Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        marginBottom: '32px',
      }}>

        {/* Request Volume Chart */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #334155',
        }}>
          <h3 style={{ marginBottom: '24px', fontSize: '15px' }}>
            Request Volume — Last 24 Hours
          </h3>
          {volume.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
              No data yet — hit some endpoints to generate traffic
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(val) => new Date(val).getHours() + ':00'}
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                />
                <Bar dataKey="allowed_requests" name="Allowed" fill="#6366f1" radius={[4,4,0,0]} />
                <Bar dataKey="blocked_requests" name="Blocked" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Algorithm Pie Chart */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #334155',
        }}>
          <h3 style={{ marginBottom: '24px', fontSize: '15px' }}>
            Requests by Algorithm
          </h3>
          {algorithms.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={algorithms}
                  dataKey="total_requests"
                  nameKey="algorithm"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ algorithm, percent }) =>
                    `${algorithm.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {algorithms.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top IPs Table */}
      <div style={{
        background: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #334155',
      }}>
        <h3 style={{ marginBottom: '24px', fontSize: '15px' }}>
          Top IP Addresses
        </h3>
        {!topUsers?.top_ips?.length ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
            No data yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['IP Address', 'Total Requests', 'Blocked', 'Block Rate'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '12px',
                    fontSize: '12px',
                    color: '#64748b',
                    textTransform: 'uppercase',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topUsers.top_ips.map((ip, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                    {ip.ip_address}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {ip.total_requests}
                  </td>
                  <td style={{ padding: '12px', color: '#ef4444' }}>
                    {ip.blocked_requests}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{
                      display: 'inline-block',
                      background: ip.blocked_requests > 0 ? '#450a0a' : '#052e16',
                      color: ip.blocked_requests > 0 ? '#ef4444' : '#22c55e',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      {ip.total_requests > 0
                        ? ((ip.blocked_requests / ip.total_requests) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default Overview;