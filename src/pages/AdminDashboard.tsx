import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users, Store, Calendar, IndianRupee, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  totalVendors: number;
  totalTurfs: number;
  totalBookings: number;
  totalRevenue: number;
}

interface Turf {
  id: string;
  name: string;
  game_type: string;
  vendor: {
    business_name: string;
  };
  active: boolean;
}

interface Vendor {
  id: string;
  business_name: string;
  approved: boolean;
  user_id: string;
}

export default function AdminDashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalVendors: 0,
    totalTurfs: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchDashboardData();
  }, [userRole, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: vendorsCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      const { count: turfsCount } = await supabase
        .from('turfs')
        .select('*', { count: 'exact', head: true });

      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      const { data: revenueData } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('payment_status', 'paid');

      const totalRevenue = revenueData?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalVendors: vendorsCount || 0,
        totalTurfs: turfsCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
      });

      // Fetch turfs
      const { data: turfsData } = await supabase
        .from('turfs')
        .select(`
          *,
          vendor:vendors(business_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setTurfs(turfsData || []);

      // Fetch vendors
      const { data: vendorsData } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      setVendors(vendorsData || []);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTurf = async (turfId: string) => {
    if (!confirm('Are you sure you want to delete this turf?')) return;

    try {
      const { error } = await supabase
        .from('turfs')
        .delete()
        .eq('id', turfId);

      if (error) throw error;

      toast.success('Turf deleted successfully');
      fetchDashboardData();
    } catch (error: any) {
      toast.error('Failed to delete turf');
      console.error(error);
    }
  };

  const handleRemoveVendor = async (vendorId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this vendor? This will also delete all their turfs.')) return;

    try {
      // Delete vendor (cascade will delete turfs)
      const { error: vendorError } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (vendorError) throw vendorError;

      // Remove vendor role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'vendor');

      if (roleError) throw roleError;

      toast.success('Vendor removed successfully');
      fetchDashboardData();
    } catch (error: any) {
      toast.error('Failed to remove vendor');
      console.error(error);
    }
  };

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
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendors</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVendors}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turfs</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTurfs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Vendors */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>All Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {vendors.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No vendors registered</p>
            ) : (
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{vendor.business_name}</h3>
                      <Badge variant={vendor.approved ? 'default' : 'secondary'}>
                        {vendor.approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveVendor(vendor.id, vendor.user_id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Turfs */}
        <Card>
          <CardHeader>
            <CardTitle>All Turfs</CardTitle>
          </CardHeader>
          <CardContent>
            {turfs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No turfs available</p>
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
                        {turf.game_type} • {turf.vendor?.business_name || 'Unknown Vendor'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={turf.active ? 'default' : 'secondary'}>
                        {turf.active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTurf(turf.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
