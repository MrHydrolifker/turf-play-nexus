import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Calendar, Clock, IndianRupee, QrCode } from 'lucide-react';
import { toast } from 'sonner';

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
    address: string;
    game_type: string;
  };
}

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth/player');
      return;
    }
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          turf:turfs(name, address, game_type)
        `)
        .eq('user_id', user?.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error('Failed to load bookings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (booking: Booking) => {
    setSelectedBooking(booking);
    // Generate UPI QR code URL
    const upiUrl = `upi://pay?pa=9479719961-ga25@axl&pn=GameZoneXP&am=${booking.total_amount}&cu=INR&tn=Turf Booking Payment - ${booking.turf.name}`;
    // Use Google Charts API to generate QR code
    const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(upiUrl)}&choe=UTF-8`;
    setQrCodeUrl(qrUrl);
    setPaymentDialogOpen(true);
  };

  const handleMarkAsPaid = async () => {
    if (!selectedBooking) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid' })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast.success('Payment status updated successfully!');
      setPaymentDialogOpen(false);
      fetchBookings();
    } catch (error: any) {
      toast.error('Failed to update payment status');
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Button>

        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by booking your first turf venue
              </p>
              <Button onClick={() => navigate('/')}>
                Browse Venues
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{booking.turf.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {booking.turf.address}
                      </p>
                    </div>
                    <Badge variant={booking.turf.game_type === 'Football' ? 'default' : 'secondary'}>
                      {booking.turf.game_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(booking.booking_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">₹{booking.total_amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
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
                        Payment: {booking.payment_status}
                      </Badge>
                    </div>

                    {booking.payment_status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handlePayNow(booking)}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Pay Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Scan this QR code with any UPI app
                </p>
                <div className="bg-white p-4 rounded-lg inline-block">
                  <img 
                    src={qrCodeUrl} 
                    alt="UPI Payment QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-lg font-semibold">Amount: ₹{selectedBooking.total_amount}</p>
                  <p className="text-sm text-muted-foreground mt-1">UPI ID: 9479719961-ga25@axl</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Instructions:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
                  <li>Scan the QR code above</li>
                  <li>Verify the amount ₹{selectedBooking.total_amount}</li>
                  <li>Complete the payment</li>
                  <li>Click "I've Paid" button below</li>
                </ol>
              </div>

              <Button 
                className="w-full" 
                onClick={handleMarkAsPaid}
              >
                I've Paid
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
