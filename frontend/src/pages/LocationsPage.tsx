import React from 'react';
import { MapPin } from 'lucide-react';
import LookupManager from '../components/LookupManager';

const LocationsPage: React.FC = () => (
  <LookupManager
    singular="Location"
    plural="Locations"
    endpoint="/locations"
    assetFilterKey="location"
    Icon={MapPin}
    intro="Track where each asset is kept, such as the main hall, kitchen, or a storage room."
  />
);

export default LocationsPage;
