import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TurfCardProps {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  gameType: string;
  pricePerHour: number;
  facilities: string[];
  images: string[];
  rating: number;
  totalReviews: number;
}

export default function TurfCard({
  id,
  name,
  description,
  address,
  city,
  gameType,
  pricePerHour,
  facilities,
  images,
  rating,
  totalReviews,
}: TurfCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={images[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6'}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
      </div>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg line-clamp-1">{name}</h3>
          <Badge variant="secondary">{gameType}</Badge>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{city}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold">{rating}</span>
            <span className="text-sm text-muted-foreground">({totalReviews})</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-primary">
            <IndianRupee className="h-4 w-4" />
            <span>{pricePerHour}/hr</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {facilities.slice(0, 3).map((facility, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {facility}
            </Badge>
          ))}
          {facilities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{facilities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => navigate(`/turf/${id}`)}
        >
          View Details & Book
        </Button>
      </CardFooter>
    </Card>
  );
}
