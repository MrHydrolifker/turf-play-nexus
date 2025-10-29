import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TurfCard from '@/components/TurfCard';
import { Loader2, ArrowLeft, Plus, Store, Calendar, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

interface Turf {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  game_type: string;
  price_per_hour: number;
  facilities?: string[];
  images?: string[];
  active: boolean;
  rating: number;
  total_reviews?: number;
}

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_amount: number;
  payment_status: string;
  booking_status: string;
  turf: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

export default function VendorDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorApproved, setVendorApproved] = useState(false);

  useEffect(() => {
    if (authLoading) return; // wait until auth is fully resolved

    if (!user) {
      navigate('/auth/vendor');
      return;
    }

    // Only redirect non-vendors after role is known
    if (userRole && userRole !== 'vendor') {
      navigate('/');
      return;
    }

    if (userRole === 'vendor') {
      fetchVendorData();
    }
  }, [user, userRole, authLoading, navigate]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);
      
      // Get or create vendor profile
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, approved')
        .eq('user_id', user?.id)
        .maybeSingle();

      let currentVendorId: string | null = null;
      let currentApproved = false;

      if (!vendorData) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user!.id)
          .maybeSingle();

        const business_name = profile?.full_name || 'New Vendor';
        const { data: createdVendor, error: createError } = await supabase
          .from('vendors')
          .insert({
            user_id: user!.id,
            business_name,
            approved: false,
          })
          .select('id, approved')
          .single();

        if (createError) throw createError;
        currentVendorId = createdVendor.id;
        currentApproved = createdVendor.approved;
      } else {
        currentVendorId = vendorData.id;
        currentApproved = vendorData.approved;
      }

      setVendorId(currentVendorId);
      setVendorApproved(currentApproved);

      // Fetch turfs
      const { data: turfsData, error: turfsError } = await supabase
        .from('turfs')
        .select('*')
        .eq('vendor_id', vendorData.id);

      if (turfsError) throw turfsError;
      setTurfs(turfsData || []);

      // Fetch bookings
      const turfIds = turfsData?.map(t => t.id) || [];
      if (turfIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            turf:turfs(name)
          `)
          .in('turf_id', turfIds)
          .order('booking_date', { ascending: false })
          .limit(10);

        if (bookingsError) throw bookingsError;
        
        // Fetch user profiles separately
        const userIds = bookingsData?.map(b => b.user_id) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const enrichedBookings = bookingsData?.map(b => ({
          ...b,
          profiles: profilesMap.get(b.user_id) || { full_name: 'Unknown' }
        })) || [];
        
        setBookings(enrichedBookings as any);
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          </div>
          <Button onClick={() => navigate('/vendor/add-turf')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Turf
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turfs</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{turfs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Turfs */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Turfs</CardTitle>
            <Button 
              onClick={() => navigate('/vendor/add-turf')} 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Turf
            </Button>
          </CardHeader>
          <CardContent>
            {turfs.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Turfs Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start by adding your first turf to begin accepting bookings
                </p>
                <Button 
                  onClick={() => navigate('/vendor/add-turf')} 
                  size="lg"
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Turf
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {turfs.map((turf) => (
                  <div
                    key={turf.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{turf.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {turf.game_type} • ₹{turf.price_per_hour}/hr
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={turf.active ? 'default' : 'secondary'}>
                        {turf.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm">⭐ {turf.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{booking.turf?.name || 'Unknown'}</h3>
                      <p className="text-sm text-muted-foreground">
                         {booking.profiles?.full_name || 'Unknown User'} • {booking.booking_date} • {booking.start_time?.slice(0, 5)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {booking.payment_status}
                      </Badge>
                      <span className="font-semibold">₹{booking.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
