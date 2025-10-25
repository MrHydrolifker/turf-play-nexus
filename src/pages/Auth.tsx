import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Store, Gamepad2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-primary)' }}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Game Zone XP</h1>
          <p className="text-xl text-white/90">Choose your login type</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Player Login */}
          <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Player</CardTitle>
              <CardDescription>
                Book turfs and gaming venues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate('/auth/player')}
              >
                Player Login
              </Button>
            </CardContent>
          </Card>

          {/* Vendor Login */}
          <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center">
                <Store className="h-10 w-10 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Vendor</CardTitle>
              <CardDescription>
                Manage your turfs and bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                variant="secondary"
                onClick={() => navigate('/auth/vendor')}
              >
                Vendor Login
              </Button>
            </CardContent>
          </Card>

          {/* Admin Login */}
          <Card className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                <Shield className="h-10 w-10 text-accent" />
              </div>
              <CardTitle className="text-2xl">Admin</CardTitle>
              <CardDescription>
                Platform management & control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth/admin')}
              >
                Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
