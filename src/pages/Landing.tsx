import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gamepad2, Store, Shield, Star, MapPin, Clock } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4" style={{ background: 'var(--gradient-primary)' }}>
        <div className="container mx-auto text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Game Zone XP
          </h1>
          <p className="text-xl md:text-3xl mb-12 opacity-90">
            Your Ultimate Turf Booking Platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth/vendor')}
              className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 text-white border-white"
            >
              List Your Venue
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose Game Zone XP?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Find Venues Easily</h3>
                <p className="text-muted-foreground">
                  Search and discover turfs near you with powerful filters for game type, price, and ratings
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-Time Booking</h3>
                <p className="text-muted-foreground">
                  Book your favorite slots instantly with live availability updates and instant confirmations
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all">
              <CardContent className="pt-8 pb-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold mb-2">Top Rated Venues</h3>
                <p className="text-muted-foreground">
                  Choose from verified, highly-rated gaming zones and sports turfs across your city
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* User Types */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Who Can Use Game Zone XP?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="hover:shadow-xl transition-all">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Gamepad2 className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Players</h3>
                <p className="text-muted-foreground mb-6">
                  Browse, book, and play at the best gaming & sports venues
                </p>
                <Button
                  className="w-full"
                  onClick={() => navigate('/auth/player')}
                >
                  Join as Player
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Store className="h-10 w-10 text-secondary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Vendors</h3>
                <p className="text-muted-foreground mb-6">
                  List your turf, manage bookings, and grow your business
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate('/auth/vendor')}
                >
                  Join as Vendor
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-all">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Shield className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Admins</h3>
                <p className="text-muted-foreground mb-6">
                  Manage the platform, vendors, and ensure quality
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/auth/admin')}
                >
                  Admin Access
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4" style={{ background: 'var(--gradient-accent)' }}>
        <div className="container mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of players and venues on Game Zone XP
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="text-lg px-12 py-6"
          >
            Sign Up Now
          </Button>
        </div>
      </section>
    </div>
  );
}
