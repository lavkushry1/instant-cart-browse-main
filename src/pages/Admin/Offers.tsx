import React, { useState, useEffect } from 'react';
// Placeholder for a service to interact with Firestore or your backend
// import { getOffers, createOffer, updateOffer, deleteOffer } from '@/services/offerService';

// Placeholder types - these should be more detailed based on your data model
interface OfferCondition {
    cartValueGreaterThan?: number;
    // Add other condition types here, e.g., specificItemsInCart, customerSegment, etc.
}

interface Offer {
  id: string;
  name: string;
  type: 'product' | 'store' | 'conditional' | 'category';
  discountPercent?: number;
  discountAmount?: number;
  productIds?: string[];
  categoryIds?: string[];
  condition?: OfferCondition;
  validFrom: string; // ISO Date string
  validTill: string; // ISO Date string
  priority: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Mock functions, replace with actual service calls
const mockOffers: Offer[] = [
  {
    id: 'offer_1',
    name: '10% Off All T-Shirts',
    type: 'product',
    productIds: ['prod_tshirt_blue', 'prod_tshirt_red'],
    discountPercent: 10,
    validFrom: new Date().toISOString(),
    validTill: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    priority: 1,
    enabled: true,
  },
  {
    id: 'offer_2',
    name: 'Summer Storewide Sale',
    type: 'store',
    discountPercent: 15,
    validFrom: new Date().toISOString(),
    validTill: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    priority: 0,
    enabled: true,
  },
  {
    id: 'offer_3',
    name: '5% off on orders over $100',
    type: 'conditional',
    condition: { cartValueGreaterThan: 100 },
    discountPercent: 5,
    validFrom: new Date().toISOString(),
    validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 2,
    enabled: true,
  }
];

const getOffers = async (): Promise<Offer[]> => {
  console.log('Fetching offers...');
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(mockOffers))), 500));
};
const createOffer = async (offerData: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> => {
  console.log('Creating offer:', offerData);
  const newOffer = { ...offerData, id: `offer_${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Offer;
  mockOffers.push(newOffer);
  return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(newOffer))), 300));
};
const updateOffer = async (offerId: string, offerData: Partial<Omit<Offer, 'id' | 'createdAt'>>): Promise<Offer> => {
  console.log(`Updating offer ${offerId}:`, offerData);
  const index = mockOffers.findIndex(o => o.id === offerId);
  if (index !== -1) {
    mockOffers[index] = { ...mockOffers[index], ...offerData, updatedAt: new Date().toISOString() };
    return new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(mockOffers[index]))), 300));
  }
  throw new Error('Offer not found');
};
const deleteOffer = async (offerId: string): Promise<void> => {
  console.log(`Deleting offer ${offerId}`);
  const index = mockOffers.findIndex(o => o.id === offerId);
  if (index !== -1) {
    mockOffers.splice(index, 1);
    return new Promise(resolve => setTimeout(() => resolve(), 300));
  }
  throw new Error('Offer not found');
};
// End of mock functions

const AdminOffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<Partial<Offer> | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      const data = await getOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
    setIsLoading(false);
  };

  const handleEdit = (offer: Offer) => {
    setCurrentOffer(JSON.parse(JSON.stringify(offer))); // Deep copy to avoid direct state mutation
    setShowForm(true);
  };

  const handleDelete = async (offerId: string) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await deleteOffer(offerId);
        fetchOffers(); 
      } catch (error) {
        console.error('Error deleting offer:', error);
      }
    }
  };

  const handleFormSubmit = async (formData: Partial<Offer>) => {
    try {
      if (currentOffer && currentOffer.id) {
        await updateOffer(currentOffer.id, formData);
      } else {
        await createOffer(formData as Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setShowForm(false);
      setCurrentOffer(null);
      fetchOffers(); 
    } catch (error) {
      console.error('Error saving offer:', error);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading offers...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Offers</h1>
        <button
          onClick={() => {
            setCurrentOffer({ type: 'product', enabled: true, priority: 0 }); // Sensible defaults for new offer
            setShowForm(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
        >
          Add New Offer
        </button>
      </div>

      {showForm && (
        <OfferForm
          initialData={currentOffer}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setCurrentOffer(null);
          }}
        />
      )}

      <div className="bg-white shadow-lg rounded-2xl overflow-hidden mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{offer.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{offer.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {offer.discountPercent ? `${offer.discountPercent}%` : ''}
                  {offer.discountPercent && offer.discountAmount ? ' / ' : ''}
                  {offer.discountAmount ? `$${offer.discountAmount.toFixed(2)}` : ''}
                  {!offer.discountPercent && !offer.discountAmount && offer.type === 'conditional' ? 'Benefit' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validTill).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{offer.priority}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${offer.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {offer.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleEdit(offer)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                  <button onClick={() => handleDelete(offer.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
            {offers.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                        No offers found. Click "Add New Offer" to create one.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface OfferFormProps {
  initialData: Partial<Offer> | null;
  onSubmit: (formData: Partial<Offer>) => void;
  onCancel: () => void;
}

const OfferForm: React.FC<OfferFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Offer>>({});

  useEffect(() => {
    // Ensure sensible defaults if creating a new offer, or use initialData if editing
    const defaults: Partial<Offer> = { type: 'product', enabled: true, priority: 0, discountPercent: undefined, discountAmount: undefined, productIds: [], categoryIds: [], condition: {} };
    setFormData(initialData && Object.keys(initialData).length > 0 ? initialData : defaults);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number' || name === 'discountPercent' || name === 'discountAmount' || name === 'priority' || name === 'condition.cartValueGreaterThan') {
      processedValue = value === '' ? undefined : parseFloat(value);
    } else if (name === 'productIds' || name === 'categoryIds') {
      processedValue = value.split(',').map(s => s.trim()).filter(s => s);
    }
    
    if (name === 'condition.cartValueGreaterThan') {
        setFormData(prev => ({ 
            ...prev, 
            condition: { ...prev.condition, cartValueGreaterThan: processedValue }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation: Ensure either discountPercent or discountAmount is provided if not a special conditional offer.
    if (formData.type !== 'conditional' && !formData.discountPercent && !formData.discountAmount) {
        // alert('Please provide either a discount percentage or a discount amount.');
        // return;
        // For now, allowing this, but real validation is needed
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-2xl p-6 mb-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">{formData?.id ? 'Edit Offer' : 'Create New Offer'}</h2>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Offer Name</label>
        <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Offer Type</label>
        <select name="type" id="type" value={formData.type || 'product'} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
          <option value="product">Product-Specific</option>
          <option value="category">Category-Specific</option>
          <option value="store">Store-Wide</option>
          <option value="conditional">Conditional</option>
        </select>
      </div>

      {(formData.type === 'product') && (
        <div>
          <label htmlFor="productIds" className="block text-sm font-medium text-gray-700">Product IDs (comma-separated)</label>
          <input type="text" name="productIds" id="productIds" placeholder="e.g., prod1,prod2,prod3" value={(formData.productIds || []).join(', ')} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      )}

      {(formData.type === 'category') && (
        <div>
          <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-700">Category IDs (comma-separated)</label>
          <input type="text" name="categoryIds" id="categoryIds" placeholder="e.g., cat1,cat2" value={(formData.categoryIds || []).join(', ')} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700">Discount Percent (%)</label>
          <input type="number" name="discountPercent" id="discountPercent" placeholder="e.g., 10" value={formData.discountPercent === undefined ? '' : formData.discountPercent} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700">Discount Amount (e.g., $)</label>
          <input type="number" name="discountAmount" id="discountAmount" placeholder="e.g., 5.00" value={formData.discountAmount === undefined ? '' : formData.discountAmount} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      </div>

      {formData.type === 'conditional' && (
        <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-sm font-medium text-gray-700 px-1">Condition</legend>
            <div>
                <label htmlFor="condition.cartValueGreaterThan" className="block text-sm font-medium text-gray-700">Cart Value Greater Than ($)</label>
                <input type="number" name="condition.cartValueGreaterThan" id="condition.cartValueGreaterThan" placeholder="e.g., 99.99" value={formData.condition?.cartValueGreaterThan === undefined ? '' : formData.condition.cartValueGreaterThan} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            {/* Add more condition fields here as needed */}
        </fieldset>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">Valid From</label>
          <input type="date" name="validFrom" id="validFrom" value={formData.validFrom ? formData.validFrom.split('T')[0] : ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="validTill" className="block text-sm font-medium text-gray-700">Valid Till</label>
          <input type="date" name="validTill" id="validTill" value={formData.validTill ? formData.validTill.split('T')[0] : ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      </div>

       <div>
        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
        <input type="number" name="priority" id="priority" placeholder="e.g., 1 (higher wins)" value={formData.priority === undefined ? '' : formData.priority} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
      </div>

      <div className="flex items-center">
        <input type="checkbox" name="enabled" id="enabled" checked={formData.enabled || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
        <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">Enable Offer</label>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          {formData?.id ? 'Update Offer' : 'Save Offer'}
        </button>
      </div>
    </form>
  );
};

export default AdminOffersPage;
