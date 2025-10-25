import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AddTurf() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [facilityInput, setFacilityInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleAddFacility = () => {
    if (facilityInput.trim() && !facilities.includes(facilityInput.trim())) {
      setFacilities([...facilities, facilityInput.trim()]);
      setFacilityInput('');
    }
  };

  const handleRemoveFacility = (facility: string) => {
    setFacilities(facilities.filter(f => f !== facility));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const address = formData.get('address') as string;
    const city = formData.get('city') as string;
    const gameType = formData.get('gameType') as string;
    const pricePerHour = parseFloat(formData.get('pricePerHour') as string);

    try {
      // Get vendor ID
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (vendorError) throw vendorError;

      // Insert turf
      const { data: turfData, error: turfError } = await supabase
        .from('turfs')
        .insert({
          vendor_id: vendorData.id,
          name,
          description,
          address,
          city,
          game_type: gameType,
          price_per_hour: pricePerHour,
          facilities,
          images: imageUrl ? [imageUrl] : [],
          active: true,
        })
        .select()
        .single();

      if (turfError) throw turfError;

      // Create default time slots (9 AM to 10 PM)
      const timeSlots = [];
      for (let hour = 9; hour <= 21; hour++) {
        timeSlots.push({
          turf_id: turfData.id,
          start_time: `${hour.toString().padStart(2, '0')}:00:00`,
          end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
          is_available: true,
        });
      }

      const { error: slotsError } = await supabase
        .from('time_slots')
        .insert(timeSlots);

      if (slotsError) throw slotsError;

      toast.success('Turf added successfully!');
      navigate('/vendor/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add turf');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/vendor/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Add New Turf</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Turf Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Champions Arena - PS5 Gaming Zone"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Premium gaming setup with latest titles..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gameType">Game Type *</Label>
                  <Select name="gameType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select game type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PS5">PS5 Gaming</SelectItem>
                      <SelectItem value="PS4">PS4 Gaming</SelectItem>
                      <SelectItem value="Football">Football</SelectItem>
                      <SelectItem value="Cricket">Cricket</SelectItem>
                      <SelectItem value="Badminton">Badminton</SelectItem>
                      <SelectItem value="Basketball">Basketball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">Price per Hour (₹) *</Label>
                  <Input
                    id="pricePerHour"
                    name="pricePerHour"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Shop 12, Linking Road, Andheri West"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="Mumbai"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                <p className="text-sm text-muted-foreground">
                  Enter an image URL (e.g., from Unsplash)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Facilities</Label>
                <div className="flex gap-2">
                  <Input
                    value={facilityInput}
                    onChange={(e) => setFacilityInput(e.target.value)}
                    placeholder="Add a facility"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
                  />
                  <Button
                    type="button"
                    onClick={handleAddFacility}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {facilities.map((facility) => (
                    <div
                      key={facility}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                    >
                      {facility}
                      <button
                        type="button"
                        onClick={() => handleRemoveFacility(facility)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Turf...
                  </>
                ) : (
                  'Add Turf'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
