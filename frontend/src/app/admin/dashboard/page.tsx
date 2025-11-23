'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import Toast from '@/components/ui/toast';
import { 
  Calendar, 
  Users, 
  FileText, 
  BookOpen,
  TrendingUp,
  Clock,
  Plus
} from 'lucide-react';

interface DashboardStats {
  active_events: number;
  total_participants: number;
  tests_completed: number;
  bookings_this_month: number;
}

interface Activity {
  type: string;
  message: string;
  timestamp: string;
  entity_id: string;
}

interface BookingTrend {
  week: string;
  count: number;
  week_start: string;
  week_end: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    active_events: 0,
    total_participants: 0,
    tests_completed: 0,
    bookings_this_month: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    show: boolean;
  }>({
    message: '',
    type: 'success',
    show: false,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('access_token');
    
    try {
      // Fetch stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch recent activity
      const activityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/recent-activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setRecentActivity(activityData.activities);
      }

      // Fetch booking trends
      const trendsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/booking-trends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setBookingTrends(trendsData.trends);
      }

    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setToast({
        message: 'Failed to load dashboard data',
        type: 'error',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return Users;
      case 'result': return FileText;
      case 'event': return Calendar;
      default: return Clock;
    }
  };

  const getMaxTrendCount = () => {
    return Math.max(...bookingTrends.map(t => t.count), 1);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout title="Dashboard">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout title="Dashboard">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Events Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Events</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active_events} <span className="text-sm font-normal text-gray-500">Active</span></p>
              </CardContent>
            </Card>

            {/* Participants Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Participants</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total_participants} <span className="text-sm font-normal text-gray-500">Total</span></p>
              </CardContent>
            </Card>

            {/* Test Results Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Test Results</p>
                <p className="text-3xl font-bold text-gray-900">{stats.tests_completed} <span className="text-sm font-normal text-gray-500">Completed</span></p>
              </CardContent>
            </Card>

            {/* Bookings Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.bookings_this_month} <span className="text-sm font-normal text-gray-500">This Month</span></p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>

                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => {
                      const Icon = getActivityIcon(activity.type);
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{getTimeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Trends */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>

                {bookingTrends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No booking data yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookingTrends.map((trend, index) => {
                      const percentage = (trend.count / getMaxTrendCount()) * 100;
                      const colors = ['from-emerald-500 to-emerald-400', 'from-blue-500 to-blue-400', 'from-amber-500 to-amber-400', 'from-gray-400 to-gray-300'];
                      
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-28">{trend.week}</span>
                          <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div className={`h-full bg-gradient-to-r ${colors[index % colors.length]}`} style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                            {trend.count}
                          </span>
                        </div>
                      );
                    })}

                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total this month</span>
                        <span className="font-semibold text-emerald-600">+{stats.bookings_this_month} bookings</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/admin/events/create')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Create Event</p>
                </button>

                <button
                  onClick={() => router.push('/admin/results/upload')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <FileText className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Upload Result</p>
                </button>

                <button
                  onClick={() => router.push('/admin/bookings')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">View Bookings</p>
                </button>

                <button
                  onClick={() => router.push('/admin/events')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <Calendar className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Manage Events</p>
                </button>
              </div>
            </CardContent>
          </Card>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}