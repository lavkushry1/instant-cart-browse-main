import React, { useState, useEffect } from 'react';
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';
import { toast } from 'sonner';
import { Offer, OfferCreationData, OfferUpdateData, OfferCondition as OfferServiceCondition } from '@/services/offerService'; // Import types from service

// Define interfaces for Cloud Function responses
interface GetAllOffersAdminResponse {
    success: boolean;
    offers?: Offer[];
    error?: string;
}

interface CreateOfferAdminResponse {
    success: boolean;
    offer?: Offer;
    error?: string;
}

interface UpdateOfferAdminResponse {
    success: boolean;
    offer?: Offer;
    error?: string;
}

interface DeleteOfferAdminResponse {
    success: boolean;
    message?: string;
    error?: string;
}

// Interface for the form's state and submission data
// Dates are strings in YYYY-MM-DD format for the form
interface OfferFormData extends Omit<Partial<Offer>, 'validFrom' | 'validTill' | 'createdAt' | 'updatedAt' | 'condition'> {
    validFrom?: string; 
    validTill?: string;
    condition?: OfferServiceCondition; // Use the imported OfferCondition
    // Ensure other fields are compatible or mapped if needed
    productIds?: string[]; // Ensure these are handled as arrays of strings
    categoryIds?: string[]; // Ensure these are handled as arrays of strings
}

// Callable function references
let getAllOffersAdminCF: HttpsCallable<void, GetAllOffersAdminResponse> | undefined;
let createOfferAdminCF: HttpsCallable<OfferCreationData, CreateOfferAdminResponse> | undefined;
let updateOfferAdminCF: HttpsCallable<{ offerId: string; updateData: OfferUpdateData }, UpdateOfferAdminResponse> | undefined;
let deleteOfferAdminCF: HttpsCallable<{ offerId: string }, DeleteOfferAdminResponse> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
    try {
        getAllOffersAdminCF = httpsCallable(functionsClient, 'offers-getAllOffersAdminCF');
        createOfferAdminCF = httpsCallable(functionsClient, 'offers-createOfferCF');
        updateOfferAdminCF = httpsCallable(functionsClient, 'offers-updateOfferCF');
        deleteOfferAdminCF = httpsCallable(functionsClient, 'offers-deleteOfferCF');
    } catch (error) {
        console.error("AdminOffersPage: Error preparing callable functions:", error);
        toast.error("Error initializing offer services. Some actions may not work.");
    }
}

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
      if (!getAllOffersAdminCF) {
        toast.error("Offer service is not available.");
        setIsLoading(false);
        return;
      }
      const result: HttpsCallableResult<GetAllOffersAdminResponse> = await getAllOffersAdminCF();
      if (result.data.success && result.data.offers) {
        setOffers(result.data.offers);
      } else {
        toast.error(result.data.error || "Failed to fetch offers.");
        setOffers([]);
      }
    } catch (error: any) {
      console.error('Error fetching offers:', error);
      toast.error(error.message || 'An unexpected error occurred while fetching offers.');
      setOffers([]);
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
        if (!deleteOfferAdminCF) {
          toast.error("Offer service is not available.");
          return;
        }
        const result: HttpsCallableResult<DeleteOfferAdminResponse> = await deleteOfferAdminCF({ offerId });
        if (result.data.success) {
          toast.success(result.data.message || "Offer deleted successfully.");
          fetchOffers(); 
        } else {
          toast.error(result.data.error || "Failed to delete offer.");
        }
      } catch (error: any) {
        console.error('Error deleting offer:', error);
        toast.error(error.message || 'An unexpected error occurred while deleting the offer.');
      }
    }
  };

  const handleFormSubmit = async (formDataFromForm: OfferFormData) => {
    // formDataFromForm has dates as YYYY-MM-DD strings.
    // Convert them to full ISO strings for backend.
    const submissionPayload: any = { ...formDataFromForm };

    if (submissionPayload.validFrom && typeof submissionPayload.validFrom === 'string') {
      // Assuming YYYY-MM-DD, convert to full ISO string with UTC timezone
      const datePart = submissionPayload.validFrom.split('T')[0]; // Take only date part if time was appended
      submissionPayload.validFrom = new Date(datePart + 'T00:00:00.000Z').toISOString();
    }

    if (submissionPayload.validTill && typeof submissionPayload.validTill === 'string') {
      const datePart = submissionPayload.validTill.split('T')[0];
      submissionPayload.validTill = new Date(datePart + 'T23:59:59.999Z').toISOString(); // End of day UTC
    }
    
    // Ensure numeric fields are numbers
    if (submissionPayload.priority !== undefined) submissionPayload.priority = Number(submissionPayload.priority);
    if (submissionPayload.discountPercent !== undefined) submissionPayload.discountPercent = Number(submissionPayload.discountPercent);
    if (submissionPayload.discountAmount !== undefined) submissionPayload.discountAmount = Number(submissionPayload.discountAmount);
    if (submissionPayload.condition?.cartValueGreaterThan !== undefined) {
        submissionPayload.condition.cartValueGreaterThan = Number(submissionPayload.condition.cartValueGreaterThan);
    }

    // Validation logic (can be enhanced)
    if (!(currentOffer && currentOffer.id)) { // Creating
        const requiredFields: (keyof OfferCreationData)[] = ['name', 'type', 'priority', 'enabled', 'validFrom', 'validTill'];
        for (const field of requiredFields) {
            if (submissionPayload[field] === undefined || submissionPayload[field] === null || submissionPayload[field] === '') {
                toast.error(`Field '${field}' is required for creating an offer.`);
                return;
            }
        }
        if (submissionPayload.type === 'product' && (!submissionPayload.productIds || submissionPayload.productIds.length === 0)){
            toast.error("Product IDs are required for a product-specific offer."); return;
        }
        if (submissionPayload.type === 'category' && (!submissionPayload.categoryIds || submissionPayload.categoryIds.length === 0)){
            toast.error("Category IDs are required for a category-specific offer."); return;
        }
        if (submissionPayload.discountPercent === undefined && submissionPayload.discountAmount === undefined && submissionPayload.type !== 'conditional') { // Conditional might not have direct discount
             toast.error("Either Discount Percent or Discount Amount must be provided unless it's a conditional offer with other benefits."); return;
        }
    }

    try {
      if (currentOffer && currentOffer.id) { // Editing
        if (!updateOfferAdminCF) {
          toast.error("Offer service is not available."); return;
        }
        // Cast to OfferUpdateData, backend expects string dates (now ISO)
        const result: HttpsCallableResult<UpdateOfferAdminResponse> = await updateOfferAdminCF({ 
            offerId: currentOffer.id, 
            updateData: submissionPayload as OfferUpdateData 
        });
        if (result.data.success && result.data.offer) {
          toast.success("Offer updated successfully.");
          setShowForm(false); setCurrentOffer(null); fetchOffers(); 
        } else {
          toast.error(result.data.error || "Failed to update offer.");
        }
      } else { // Creating
        if (!createOfferAdminCF) {
          toast.error("Offer service is not available."); return;
        }
        // Cast to OfferCreationData, backend expects string dates (now ISO)
        const result: HttpsCallableResult<CreateOfferAdminResponse> = await createOfferAdminCF(submissionPayload as OfferCreationData);
        if (result.data.success && result.data.offer) {
          toast.success("Offer created successfully.");
          setShowForm(false); setCurrentOffer(null); fetchOffers(); 
        } else {
          toast.error(result.data.error || "Failed to create offer.");
        }
      }
    } catch (error: any) {
      console.error('Error saving offer:', error);
      toast.error(error.message || 'An unexpected error occurred while saving the offer.');
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
            setCurrentOffer(null); // For new offer, no initial data with Timestamps
            setShowForm(true);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out"
        >
          Add New Offer
        </button>
      </div>

      {showForm && (
        <OfferForm
          // initialData for OfferForm expects Partial<Offer> (or null)
          // OfferForm's useEffect will handle converting dates from Timestamps to strings for its internal OfferFormData state
          initialData={currentOffer} 
          onSubmit={handleFormSubmit} // onSubmit now takes OfferFormData
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
                  {offer.validFrom && offer.validFrom.toDate ? offer.validFrom.toDate().toLocaleDateString() : 'N/A'} - 
                  {offer.validTill && offer.validTill.toDate ? offer.validTill.toDate().toLocaleDateString() : 'N/A'}
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
  // initialData is still Partial<Offer> because it comes from currentOffer state
  initialData: Partial<Offer> | null; 
  onSubmit: (formData: OfferFormData) => void; // onSubmit now takes OfferFormData
  onCancel: () => void;
}

// OfferForm now uses OfferFormData for its internal state
const OfferForm: React.FC<OfferFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<OfferFormData>({}); // Use OfferFormData

  useEffect(() => {
    const defaults: OfferFormData = { 
        type: 'product', 
        enabled: true, 
        priority: 0, 
        productIds: [], 
        categoryIds: [],
    };
    
    let dataToSet: OfferFormData;

    if (initialData && Object.keys(initialData).length > 0) {
        // Use initialData directly for properties and handle dates separately to avoid 'never' type issues
        const initialValidFrom = initialData.validFrom as any; 
        const initialValidTill = initialData.validTill as any;
        const { validFrom, validTill, createdAt, updatedAt, condition, ...restOfInitial } = initialData;

        dataToSet = { 
            ...defaults, 
            ...restOfInitial,
            condition: condition || defaults.condition, 
            productIds: initialData.productIds || [], 
            categoryIds: initialData.categoryIds || [],
        };

        if (initialValidFrom) {
            if (typeof initialValidFrom.toDate === 'function') { // Check for Firebase Timestamp .toDate() method
                try { dataToSet.validFrom = initialValidFrom.toDate().toISOString().split('T')[0]; } 
                catch (e) { console.warn("Error converting initial validFrom to YYYY-MM-DD string", e); dataToSet.validFrom = undefined; }
            } else if (typeof initialValidFrom === 'string') { // If it's already a string
                dataToSet.validFrom = initialValidFrom.split('T')[0]; // Assume it might be ISO, take date part
            } else {
                console.warn("initialData.validFrom is of unexpected type:", initialValidFrom);
                dataToSet.validFrom = undefined;
            }
        }

        if (initialValidTill) {
            if (typeof initialValidTill.toDate === 'function') { // Check for Firebase Timestamp .toDate() method
                try { dataToSet.validTill = initialValidTill.toDate().toISOString().split('T')[0]; } 
                catch (e) { console.warn("Error converting initial validTill to YYYY-MM-DD string", e); dataToSet.validTill = undefined; }
            } else if (typeof initialValidTill === 'string') {
                dataToSet.validTill = initialValidTill.split('T')[0];
            } else {
                console.warn("initialData.validTill is of unexpected type:", initialValidTill);
                dataToSet.validTill = undefined;
            }
        }
    } else {
        dataToSet = { ...defaults };
    }
    setFormData(dataToSet);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number' || name === 'priority' || name === 'discountPercent' || name === 'discountAmount' || name === 'condition.cartValueGreaterThan') {
      processedValue = value === '' ? undefined : parseFloat(value);
    } else if (name === 'productIds' || name === 'categoryIds') {
      processedValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
    } 
    // For date inputs (name 'validFrom' or 'validTill'), processedValue is already YYYY-MM-DD string.
    
    if (name.startsWith('condition.')) {
        const conditionField = name.split('.')[1];
        setFormData(prev => ({ 
            ...prev, 
            condition: { ...(prev.condition || {}), [conditionField]: processedValue }
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: processedValue } as OfferFormData));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Before submitting, ensure numeric fields that should be numbers are numbers
    const dataToSubmit = { ...formData };
    if(dataToSubmit.priority !== undefined) dataToSubmit.priority = Number(dataToSubmit.priority);
    if(dataToSubmit.discountPercent !== undefined) dataToSubmit.discountPercent = Number(dataToSubmit.discountPercent);
    if(dataToSubmit.discountAmount !== undefined) dataToSubmit.discountAmount = Number(dataToSubmit.discountAmount);
    if(dataToSubmit.condition?.cartValueGreaterThan !== undefined) {
        dataToSubmit.condition.cartValueGreaterThan = Number(dataToSubmit.condition.cartValueGreaterThan);
    }
    onSubmit(dataToSubmit);
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 md:p-8 mb-8 space-y-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{formData?.id ? 'Edit Offer' : 'Create New Offer'}</h2>
      {/* Offer Name and Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Offer Name</label>
          <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
          <select name="type" id="type" value={formData.type || 'product'} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="product">Product Specific</option>
            <option value="category">Category Specific</option>
            <option value="store">Store Wide</option>
            <option value="conditional">Conditional</option>
          </select>
        </div>
      </div>

      {/* Product IDs */}
      {(formData.type === 'product') && (
        <div>
          <label htmlFor="productIds" className="block text-sm font-medium text-gray-700 mb-1">Product IDs (comma-separated)</label>
          <input type="text" name="productIds" id="productIds" value={(formData.productIds || []).join(', ')} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      )}
      {/* Category IDs */}
      {(formData.type === 'category') && (
        <div>
          <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-700 mb-1">Category IDs (comma-separated)</label>
          <input type="text" name="categoryIds" id="categoryIds" value={(formData.categoryIds || []).join(', ')} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      )}

      {/* Discount Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="discountPercent" className="block text-sm font-medium text-gray-700 mb-1">Discount Percent (%)</label>
          <input type="number" name="discountPercent" id="discountPercent" value={formData.discountPercent === undefined ? '' : formData.discountPercent} onChange={handleChange} placeholder="e.g., 10" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <div>
          <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700 mb-1">Discount Amount ($)</label>
          <input type="number" name="discountAmount" id="discountAmount" value={formData.discountAmount === undefined ? '' : formData.discountAmount} onChange={handleChange} placeholder="e.g., 5.00" step="0.01" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
      </div>
      
      {/* Conditional Fields */}
      {(formData.type === 'conditional') && (
          <div>
            <label htmlFor="condition.cartValueGreaterThan" className="block text-sm font-medium text-gray-700 mb-1">Condition: Cart Value Greater Than ($)</label>
            <input 
                type="number" 
                name="condition.cartValueGreaterThan" 
                id="condition.cartValueGreaterThan" 
                value={formData.condition?.cartValueGreaterThan === undefined ? '' : formData.condition.cartValueGreaterThan} 
                onChange={handleChange} 
                placeholder="e.g., 100" 
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
            />
          </div>
      )}

      {/* Date Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
          {/* formData.validFrom is now string (YYYY-MM-DD) */}
          <input type="date" name="validFrom" id="validFrom" value={formData.validFrom || ''} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>
        <div>
          <label htmlFor="validTill" className="block text-sm font-medium text-gray-700 mb-1">Valid Till</label>
          {/* formData.validTill is now string (YYYY-MM-DD) */}
          <input type="date" name="validTill" id="validTill" value={formData.validTill || ''} onChange={handleChange} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>
      </div>

      {/* Priority and Enabled */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <input type="number" name="priority" id="priority" value={formData.priority === undefined ? '' : formData.priority} onChange={handleChange} placeholder="e.g., 0 (highest)" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
        </div>
        <div className="flex items-center mt-6">
            <input type="checkbox" name="enabled" id="enabled" checked={formData.enabled || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            <label htmlFor="enabled" className="ml-2 block text-sm font-medium text-gray-700">Enabled</label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow-sm transition duration-150 ease-in-out">
          Cancel
        </button>
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out">
          {formData?.id ? 'Save Changes' : 'Create Offer'}
        </button>
      </div>
    </form>
  );
};

export default AdminOffersPage;
