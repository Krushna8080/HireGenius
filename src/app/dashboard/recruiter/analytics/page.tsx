'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

type JobStats = {
  id: string;
  title: string;
  views: number;
  applications: number;
  matchScore: number;
  openDays: number;
};

type ApplicationStatusData = {
  name: string;
  value: number;
};

type TimeSeriesData = {
  date: string;
  applications: number;
  views: number;
};

export default function RecruiterAnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobStats, setJobStats] = useState<JobStats[]>([]);
  const [statusData, setStatusData] = useState<ApplicationStatusData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [averageMatchScore, setAverageMatchScore] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30days');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user.role !== 'RECRUITER') {
      router.push('/dashboard');
    } else {
      fetchAnalyticsData();
    }
  }, [status, session, router, selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch actual data from the API
      // For this example, we'll use mock data
      
      // Generate mock job stats data
      const mockJobStats: JobStats[] = [
        { id: '1', title: 'Senior Full Stack Developer', views: 245, applications: 32, matchScore: 78, openDays: 14 },
        { id: '2', title: 'UX/UI Designer', views: 189, applications: 25, matchScore: 82, openDays: 10 },
        { id: '3', title: 'DevOps Engineer', views: 156, applications: 18, matchScore: 74, openDays: 21 },
        { id: '4', title: 'Product Manager', views: 210, applications: 27, matchScore: 68, openDays: 17 },
        { id: '5', title: 'Data Scientist', views: 178, applications: 22, matchScore: 85, openDays: 12 },
      ];
      setJobStats(mockJobStats);
      
      // Generate mock application status data
      const mockStatusData: ApplicationStatusData[] = [
        { name: 'Pending', value: 45 },
        { name: 'Approved', value: 35 },
        { name: 'Rejected', value: 20 },
        { name: 'Withdrawn', value: 10 },
      ];
      setStatusData(mockStatusData);
      
      // Generate mock time series data
      const now = new Date();
      const mockTimeSeriesData: TimeSeriesData[] = [];
      
      // Number of days based on selected time range
      const days = selectedTimeRange === '7days' ? 7 : 
                  selectedTimeRange === '30days' ? 30 : 
                  selectedTimeRange === '90days' ? 90 : 30;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Generate random data with some trend
        const baseApplications = Math.round(Math.random() * 5) + 1;
        const baseViews = baseApplications * (Math.round(Math.random() * 5) + 3);
        
        mockTimeSeriesData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          applications: baseApplications,
          views: baseViews,
        });
      }
      setTimeSeriesData(mockTimeSeriesData);
      
      // Calculate summary metrics
      const totalApps = mockJobStats.reduce((sum, job) => sum + job.applications, 0);
      const totalJobViews = mockJobStats.reduce((sum, job) => sum + job.views, 0);
      const avgScore = mockJobStats.reduce((sum, job) => sum + job.matchScore, 0) / mockJobStats.length;
      
      setTotalApplications(totalApps);
      setTotalViews(totalJobViews);
      setAverageMatchScore(Math.round(avgScore));
      setConversionRate(Math.round((totalApps / totalJobViews) * 100));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
      setLoading(false);
    }
  };

  const COLORS = ['#facc15', '#22c55e', '#ef4444', '#94a3b8'];

  const formatPercentage = (value: number) => `${value}%`;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recruitment Analytics</h1>
        <div className="flex items-center space-x-2">
          <label htmlFor="timeRange" className="text-sm font-medium text-gray-700">
            Time Range:
          </label>
          <select
            id="timeRange"
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Applications</p>
          <h3 className="text-3xl font-bold text-gray-900">{totalApplications}</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Job Views</p>
          <h3 className="text-3xl font-bold text-gray-900">{totalViews}</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Average Match Score</p>
          <h3 className="text-3xl font-bold text-gray-900">{averageMatchScore}%</h3>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Conversion Rate</p>
          <h3 className="text-3xl font-bold text-gray-900">{conversionRate}%</h3>
        </div>
      </div>

      {/* Application Activity Over Time */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Application Activity</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="applications" stroke="#4f46e5" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="views" stroke="#94a3b8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Application Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Application Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Applications']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Job Performance */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Job Performance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jobStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="title" 
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#4f46e5" name="Applications" />
                <Bar dataKey="views" fill="#94a3b8" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Job Details Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Job Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Match Score
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Open
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobStats.map((job) => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.applications}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.matchScore}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.openDays}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round((job.applications / job.views) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 