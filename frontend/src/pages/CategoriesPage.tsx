import React from 'react';
import { FolderTree } from 'lucide-react';
import LookupManager from '../components/LookupManager';

const CategoriesPage: React.FC = () => (
  <LookupManager
    singular="Category"
    plural="Categories"
    endpoint="/categories"
    assetFilterKey="category"
    Icon={FolderTree}
    intro="Group assets by type, such as furniture, electronics, or kitchen equipment."
  />
);

export default CategoriesPage;
