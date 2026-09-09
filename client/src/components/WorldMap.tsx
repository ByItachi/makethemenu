import { useMemo } from "react";
import { MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Coordinate {
  lat: number;
  lng: number;
}

interface Restaurant {
  id: number;
  name: string;
  city?: string;
  country?: string;
  coordinates?: Coordinate;
  type: string;
  license?: string;
  licenseCode?: string;
  licenseExpiry?: string;
}

interface WorldMapProps {
  restaurants: Restaurant[];
  className?: string;
}

export default function WorldMap({ restaurants, className }: WorldMapProps) {
  // Projection logic for Equirectangular (Plate Carrée) map
  // Longitude: -180 to 180
  // Latitude: 90 to -90
  
  const getPosition = (coord: Coordinate) => {
    // Basic Equirectangular projection
    const x = ((coord.lng + 180) / 360) * 100;
    const y = ((90 - coord.lat) / 180) * 100;
    return { x, y };
  };

  return (
    <div className={`relative w-full h-[500px] bg-blue-50/50 rounded-xl overflow-hidden border border-border ${className}`}>
        {/* Background Map Image - Using local SVG to avoid ORB errors */}
    <img 
        src="/world-map.svg?v=20" 
        alt="World Map" 
                className="absolute inset-0 w-full h-full object-fill opacity-100 transition-all duration-500"
            />
        
        {/* Points */}
        <div className="absolute inset-0 w-full h-full">
            {restaurants.map((restaurant) => {
                if (!restaurant.coordinates) return null;
                const pos = getPosition(restaurant.coordinates);
                
                return (
                    <TooltipProvider key={restaurant.id}>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <div 
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                >
                                    <div className="relative flex items-center justify-center">
                                        <MapPin 
                                            className={`w-6 h-6 ${restaurant.type === 'Restoran' ? 'text-red-600 fill-red-600' : 'text-blue-600 fill-blue-600'} drop-shadow-md transition-transform group-hover:scale-110`} 
                                        />
                                        <div className="absolute top-2 w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="flex flex-col gap-1">
                                    <div className="font-bold text-sm">{restaurant.name}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span className={`w-2 h-2 rounded-full ${restaurant.type === 'Restoran' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                        {restaurant.city}, {restaurant.country}
                                    </div>
                                    {restaurant.license && (
                                      <div className="text-xs border-t pt-1 mt-1 flex flex-col">
                                        <span className="text-muted-foreground font-medium">Lisans: <span className="text-foreground">{restaurant.license}</span></span>
                                        <span className="text-[10px] text-muted-foreground">Bitiş: {restaurant.licenseExpiry}</span>
                                      </div>
                                    )}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg border shadow-sm text-xs space-y-1">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600 border border-white"></div>
                <span>Restoran</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 border border-white"></div>
                <span>Kafe / Diğer</span>
            </div>
        </div>
    </div>
  );
}
