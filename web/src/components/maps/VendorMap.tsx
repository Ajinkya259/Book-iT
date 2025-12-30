'use client';

import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
}

interface VendorMapProps {
  vendors: Vendor[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onVendorClick?: (vendor: Vendor) => void;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export function VendorMap({
  vendors,
  center = defaultCenter,
  zoom = 12,
  height = '400px',
  onVendorClick,
}: VendorMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    // Fit bounds to show all vendors
    if (vendors.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      vendors.forEach((vendor) => {
        if (vendor.latitude && vendor.longitude) {
          bounds.extend({ lat: vendor.latitude, lng: vendor.longitude });
        }
      });
      map.fitBounds(bounds);
    }
  }, [vendors]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg" style={{ height }}>
        <p className="text-red-500">Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" style={{ height }}>
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {vendors.map((vendor) => (
          vendor.latitude && vendor.longitude && (
            <Marker
              key={vendor.id}
              position={{ lat: vendor.latitude, lng: vendor.longitude }}
              onClick={() => {
                setSelectedVendor(vendor);
                onVendorClick?.(vendor);
              }}
            />
          )
        ))}

        {selectedVendor && selectedVendor.latitude && selectedVendor.longitude && (
          <InfoWindow
            position={{ lat: selectedVendor.latitude, lng: selectedVendor.longitude }}
            onCloseClick={() => setSelectedVendor(null)}
          >
            <div className="p-2 min-w-[150px]">
              <h3 className="font-semibold text-gray-900">{selectedVendor.businessName}</h3>
              {selectedVendor.address && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedVendor.address}
                  {selectedVendor.city && `, ${selectedVendor.city}`}
                  {selectedVendor.state && `, ${selectedVendor.state}`}
                </p>
              )}
              <a
                href={`/v/${selectedVendor.slug}`}
                className="text-sm text-blue-600 hover:text-blue-500 mt-2 inline-block"
              >
                View profile
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
