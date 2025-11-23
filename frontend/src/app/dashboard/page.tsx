'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Toast from '@/components/ui/toast';
import { 
  Calendar, 
  Clock, 
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

interface Event {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  address: string;
  available_slots: number;
  total_slots: number;
}

interface Booking {
  id: string;
  booking_reference: string;
  booking_status: string;
  booked_at: string;
  time_slot_start: string | null;
  time_slot_end: string | null;
  event: Event;
}

interface Result {
  id: string;
  event_name: string;
  event_date: string;
  result_category: string;
  result_available: boolean;
  uploaded_at: string;
}

export default function ParticipantDashboardPage() {
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [recentResults, setRecentResults] = useState<Result[]>([]);
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
      // Fetch upcoming published events
      const eventsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events?published_only=true`);
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        const upcoming = eventsData
          .filter((e: Event) => new Date(e.event_date) >= new Date())
          .sort((a: Event, b: Event) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
          .slice(0, 3);
        setUpcomingEvents(upcoming);
      }

      // Fetch my bookings
      const bookingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const upcoming = bookingsData
          .filter((b: Booking) => new Date(b.event.event_date) >= new Date() && b.booking_status !== 'cancelled')
          .sort((a: Booking, b: Booking) => new Date(a.event.event_date).getTime() - new Date(b.event.event_date).getTime())
          .slice(0, 2);
        setMyBookings(upcoming);
      }

      // Fetch recent test results
      const resultsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/participant/results`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        const recent = resultsData
          .filter((r: Result) => r.result_available)
          .sort((a: Result, b: Result) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
          .slice(0, 2);
        setRecentResults(recent);
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

  if (loading) {
    return (
      <ProtectedRoute requiredRole="participant">
        <DashboardLayout title="Dashboard">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="participant">
      <DashboardLayout title="Dashboard">
        <Toast
          message={toast.message}
          type={toast.type}
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <div className="space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upcoming Events Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Upcoming Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {upcomingEvents.length} <span className="text-sm font-normal text-gray-500">Available</span>
                </p>
              </CardContent>
            </Card>

            {/* My Bookings Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">My Bookings</p>
                <p className="text-3xl font-bold text-gray-900">
                  {myBookings.length} <span className="text-sm font-normal text-gray-500">Upcoming</span>
                </p>
              </CardContent>
            </Card>

            {/* Test Results Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -mr-16 -mt-16" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Test Results</p>
                <p className="text-3xl font-bold text-gray-900">
                  {recentResults.length} <span className="text-sm font-normal text-gray-500">Available</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Upcoming Events */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
                  <Button
                    onClick={() => router.push('/events')}
                    variant="outline"
                    size="sm"
                  >
                    View All
                  </Button>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No upcoming events</p>
                    <Button
                      onClick={() => router.push('/events')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Browse Events
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="p-4 bg-gradient-to-r from-pink-400 to-rose-400 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        <h4 className="font-semibold text-white mb-2">{event.name}</h4>
                        <div className="flex justify-between items-center text-white text-sm">
                          <span>{new Date(event.event_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}</span>
                          <span>{event.event_time.slice(0, 5)} onwards</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Bookings */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">My Bookings</h3>
                  <Button
                    onClick={() => router.push('/bookings')}
                    variant="outline"
                    size="sm"
                  >
                    View All
                  </Button>
                </div>

                {myBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No upcoming bookings</p>
                    <Button
                      onClick={() => router.push('/events')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Book an Event
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBookings.map((booking) => {
                      const statusConfig = booking.booking_status === 'checked_in' 
                        ? { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700', label: 'Checked In' }
                        : { bg: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700', label: 'Confirmed' };

                      return (
                        <div
                          key={booking.id}
                          onClick={() => router.push('/bookings')}
                          className={`p-4 ${statusConfig.bg} border ${statusConfig.border} rounded-lg cursor-pointer hover:shadow-lg transition-shadow`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{booking.event.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full bg-white ${statusConfig.text} font-medium`}>
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(booking.event.event_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              <span>
                                {booking.time_slot_start && booking.time_slot_end
                                  ? `${booking.time_slot_start.slice(0, 5)} - ${booking.time_slot_end.slice(0, 5)}`
                                  : booking.event.event_time.slice(0, 5)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Results Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Test Results</h3>
                <Button
                  onClick={() => router.push('/results')}
                  variant="outline"
                  size="sm"
                >
                  View All
                </Button>
              </div>

              {recentResults.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">No test results yet</p>
                  <p className="text-sm text-gray-400">
                    Results will appear here after you attend a screening event
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => router.push(`/results/${result.id}`)}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{result.event_name}</h4>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            result.result_category === 'Normal'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {result.result_category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(result.event_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-xs">
                          Uploaded {new Date(result.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/events')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <Calendar className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Browse Events</p>
                </button>

                <button
                  onClick={() => router.push('/bookings')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <CheckCircle className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">My Bookings</p>
                </button>

                <button
                  onClick={() => router.push('/results')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <FileText className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Test Results</p>
                </button>
              </div>
            </CardContent>
          </Card>

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}