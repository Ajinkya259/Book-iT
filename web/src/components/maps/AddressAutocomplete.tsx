'use client';

import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';

export interface AddressComponents {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressComponents) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Enter your business address',
  className = '',
}: AddressAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['address_components', 'geometry', 'formatted_address'],
    });

    // Add listener for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (!place || !place.address_components || !place.geometry) return;

      const addressComponents: AddressComponents = {
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        latitude: place.geometry.location?.lat() || 0,
        longitude: place.geometry.location?.lng() || 0,
      };

      // Parse address components
      let streetNumber = '';
      let route = '';

      for (const component of place.address_components) {
        const type = component.types[0];

        switch (type) {
          case 'street_number':
            streetNumber = component.long_name;
            break;
          case 'route':
            route = component.long_name;
            break;
          case 'locality':
            addressComponents.city = component.long_name;
            break;
          case 'administrative_area_level_1':
            addressComponents.state = component.short_name;
            break;
          case 'postal_code':
            addressComponents.postalCode = component.long_name;
            break;
          case 'country':
            addressComponents.country = component.short_name;
            break;
        }
      }

      addressComponents.address = `${streetNumber} ${route}`.trim();
      setInputValue(place.formatted_address || addressComponents.address);
      onAddressSelect(addressComponents);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onAddressSelect]);

  if (!isLoaded) {
    return (
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className={className}
        disabled
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}
