import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, MapPin, Star, IndianRupee, ArrowLeft, Check } from 'lucide-react';
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

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export default function TurfDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [turf, setTurf] = useState<Turf | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTurfDetails();
      fetchTimeSlots();
    }
  }, [id, selectedDate]);

  const fetchTurfDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('turfs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTurf(data);
    } catch (error: any) {
      toast.error('Failed to load turf details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const { data: slotsData, error: slotsError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('turf_id', id);

      if (slotsError) throw slotsError;

      // Check for existing bookings on selected date
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('turf_id', id)
        .eq('booking_date', selectedDate.toISOString().split('T')[0])
        .eq('booking_status', 'confirmed');

      const bookedTimes = new Set(
        bookingsData?.map((b) => b.start_time) || []
      );

      const updatedSlots = slotsData?.map((slot) => ({
        ...slot,
        is_available: !bookedTimes.has(slot.start_time),
      })) || [];

      setTimeSlots(updatedSlots);
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !turf) return;
    if (!user) {
      navigate(`/auth/player?returnTo=/turf/${id}`);
      toast.info('Please sign in to book');
      return;
    }

    setBooking(true);
    try {
      const slot = timeSlots.find((s) => s.id === selectedSlot);
      if (!slot) throw new Error('Invalid slot');

      const { error } = await supabase.from('bookings').insert({
        turf_id: turf.id,
        user_id: user.id,
        booking_date: selectedDate.toISOString().split('T')[0],
        start_time: slot.start_time,
        end_time: slot.end_time,
        total_amount: turf.price_per_hour,
        payment_status: 'pending',
        booking_status: 'confirmed',
        payment_method: 'qr_code',
      });

      if (error) throw error;

      toast.success('Booking confirmed! Payment pending.');
      navigate('/my-bookings');
    } catch (error: any) {
      toast.error(error.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Turf not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to venues
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={turf.images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6'}
                alt={turf.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{turf.name}</h1>
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{turf.address}, {turf.city}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {turf.game_type}
                </Badge>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-bold text-lg">{turf.rating}</span>
                  <span className="text-muted-foreground">({turf.total_reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                  <IndianRupee className="h-6 w-6" />
                  <span>{turf.price_per_hour}</span>
                  <span className="text-base text-muted-foreground">/hour</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-muted-foreground">{turf.description}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Facilities</h2>
                <div className="flex flex-wrap gap-2">
                  {turf.facilities.map((facility, idx) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1">
                      <Check className="h-3 w-3 mr-1" />
                      {facility}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book Your Slot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Date</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Available Slots</label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedSlot === slot.id ? 'default' : 'outline'}
                        disabled={!slot.is_available}
                        onClick={() => setSelectedSlot(slot.id)}
                        className="text-sm"
                      >
                        {slot.start_time.slice(0, 5)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={!selectedSlot || booking}
                  onClick={handleBooking}
                >
                  {booking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Now'
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
