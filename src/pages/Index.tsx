import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TurfCard from '@/components/TurfCard';
import Landing from './Landing';
import { Loader2, Search, LogOut, LayoutDashboard, Calendar, Clock, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

interface Turf {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  game_type: string;
  price_per_hour: number;
  facilities: string[];
  images: string[];
  rating: number;
  total_reviews: number;
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
    game_type: string;
  };
}

export default function Index() {
  const { user, userRole, signOut, loading: authLoading } = useAuth();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [gameTypeFilter, setGameTypeFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Show landing page for unauthenticated users
      return;
    }

    // Redirect based on role
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
      return;
    } else if (userRole === 'vendor') {
      navigate('/vendor/dashboard');
      return;
    }

    // Players stay on home page and see turfs
    fetchTurfs();
    if (userRole === 'player') {
      fetchRecentBookings();
    }
  }, [user, userRole, authLoading, navigate]);

  const fetchTurfs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('turfs')
        .select('*')
        .eq('active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setTurfs(data || []);
    } catch (error: any) {
      toast.error('Failed to load turfs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          turf:turfs(name, game_type)
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false })
        .limit(3);

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Failed to load bookings', error);
    }
  };

  const handleDashboardClick = () => {
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (userRole === 'vendor') {
      navigate('/vendor/dashboard');
    }
  };

  const filteredTurfs = turfs.filter((turf) => {
    const matchesSearch = turf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         turf.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === 'all' || turf.city === cityFilter;
    const matchesGameType = gameTypeFilter === 'all' || turf.game_type === gameTypeFilter;
    return matchesSearch && matchesCity && matchesGameType;
  });

  const cities = Array.from(new Set(turfs.map(t => t.city)));
  const gameTypes = Array.from(new Set(turfs.map(t => t.game_type)));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Game Zone XP
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {userRole === 'player' && (
              <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                <Calendar className="h-4 w-4 mr-2" />
                My Bookings
              </Button>
            )}
            {(userRole === 'admin' || userRole === 'vendor') && (
              <Button variant="outline" onClick={handleDashboardClick}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4" style={{ background: 'var(--gradient-primary)' }}>
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Find Your Perfect Gaming Venue
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Book PS5, Football, Badminton & More
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg p-4 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search venues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Game Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Games</SelectItem>
                  {gameTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Bookings for Players */}
      {userRole === 'player' && bookings.length > 0 && (
        <section className="py-8 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">My Recent Bookings</h3>
              <Button variant="outline" onClick={() => navigate('/my-bookings')}>
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.turf.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{booking.turf.game_type}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(booking.booking_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">₹{booking.total_amount}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant={booking.booking_status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.booking_status}
                      </Badge>
                      <Badge 
                        variant={
                          booking.payment_status === 'paid' 
                            ? 'default' 
                            : booking.payment_status === 'pending' 
                            ? 'outline' 
                            : 'destructive'
                        }
                      >
                        {booking.payment_status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Turfs Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h3 className="text-2xl font-bold mb-6">
            {filteredTurfs.length} Venues Available
          </h3>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTurfs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No venues found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTurfs.map((turf) => (
                <TurfCard
                  key={turf.id}
                  id={turf.id}
                  name={turf.name}
                  description={turf.description || ''}
                  address={turf.address}
                  city={turf.city}
                  gameType={turf.game_type}
                  pricePerHour={turf.price_per_hour}
                  facilities={turf.facilities || []}
                  images={turf.images || []}
                  rating={turf.rating || 0}
                  totalReviews={turf.total_reviews || 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
