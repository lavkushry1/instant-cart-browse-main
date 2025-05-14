import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Plus, Upload, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Product } from '@/types/product';
import { 
  getProductById, 
  addProduct, 
  updateProduct,
  getAllCategories,
  getAllTags
} from '@/services/productService';
import AdminLayout from '@/components/layout/AdminLayout';
import { getProductSEO, updateProductSEO, analyzeContent } from '@/services/seoService';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Default empty product
const emptyProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  price: 0,
  compareAtPrice: 0,
  images: [],
  category: '',
  tags: [],
  stock: 0,
  featured: 0,
  discount: 0
};

const ProductForm = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const isEditMode = productId !== 'new';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>(emptyProduct);
  const [activeTab, setActiveTab] = useState('basic');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [seoData, setSeoData] = useState({
    title: '',
    description: '',
    keywords: [] as string[],
    canonicalUrl: '',
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [contentAnalysis, setContentAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load product data and categories/tags
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Load categories and tags
        const categories = await getAllCategories();
        const tags = await getAllTags();
        setAvailableCategories(categories);
        setAvailableTags(tags);
        
        // If editing, load product data
        if (isEditMode && productId) {
          const product = await getProductById(productId);
          const { id, createdAt, updatedAt, ...productData } = product;
          setFormData(productData);
        }

        // Fetch SEO data if in edit mode
        if (productId && productId !== 'new') { // Modified this line to ensure productId is not 'new'
          const fetchSEO = async () => {
            try {
              const seo = await getProductSEO(productId);
              if (seo) {
                setSeoData({
                  title: seo.title,
                  description: seo.description,
                  keywords: seo.keywords || [],
                  canonicalUrl: seo.canonicalUrl || '',
                });
              } else {
                // Set defaults from product data
                setSeoData({
                  title: formData.name,
                  description: formData.description.substring(0, 160),
                  keywords: formData.tags,
                  canonicalUrl: '',
                });
              }
            } catch (error) {
              console.error('Error loading SEO data:', error);
            }
          };
          
          fetchSEO();
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Failed to load product data');
        navigate('/admin/products');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [productId, isEditMode, navigate, formData.name, formData.description, formData.tags]);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle numeric input changes
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  // Handle featured toggle
  const handleFeaturedChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, featured: checked ? 1 : 0 }));
  };

  // Add a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Add a new image URL
  const handleAddImage = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }));
      setNewImageUrl('');
    }
  };

  // Remove an image
  const handleRemoveImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(image => image !== imageToRemove)
    }));
  };

  const handleSEOInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSeoData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !seoData.keywords.includes(newKeyword.trim())) {
      setSeoData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setSeoData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleAnalyzeContent = async () => {
    if (!seoData.keywords.length) {
      toast.error('Please add at least one keyword for content analysis');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      // Use the first keyword for analysis
      const result = await analyzeContent(formData.description, seoData.keywords[0]);
      setContentAnalysis(result);
    } catch (error) {
      console.error('Error analyzing content:', error);
      toast.error('Failed to analyze content');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save the product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (formData.images.length === 0) {
      toast.error('Please add at least one product image');
      return;
    }
    
    setIsSaving(true);
    try {
      let savedProductId;
      
      if (isEditMode && productId) {
        await updateProduct(productId, {
          ...formData
        });
        savedProductId = productId;
        toast.success('Product updated successfully');
      } else {
        const newProduct = await addProduct({
          ...formData
        });
        savedProductId = newProduct.id;
        toast.success('Product added successfully');
      }
      
      // Save SEO data
      if (activeTab === 'seo' && savedProductId) {
        await updateProductSEO(savedProductId, {
          title: seoData.title || formData.name,
          description: seoData.description || formData.description.substring(0, 160),
          keywords: seoData.keywords.length ? seoData.keywords : formData.tags,
          canonicalUrl: seoData.canonicalUrl
        });
        toast.success('SEO settings saved');
      }
      
      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/admin/products');
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container py-10">
          <div className="flex justify-center">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-10">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</CardTitle>
                <CardDescription>
                  {isEditMode 
                    ? 'Update the details for this product' 
                    : 'Fill in the details to add a new product to your inventory'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-6">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="images">Images</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="seo">SEO</TabsTrigger>
                  </TabsList>
                  
                  {/* Basic Information */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your product in detail"
                        rows={5}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={handleCategoryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map(tag => (
                          <div 
                            key={tag} 
                            className="flex items-center bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-1 text-gray-500 hover:text-red-500"
                              onClick={() => handleRemoveTag(tag)}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="newTag"
                          value={newTag}
                          onChange={e => setNewTag(e.target.value)}
                          placeholder="Add a tag"
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddTag}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="featured"
                        checked={formData.featured === 1}
                        onCheckedChange={handleFeaturedChange}
                      />
                      <Label htmlFor="featured">Featured Product</Label>
                    </div>
                  </TabsContent>
                  
                  {/* Images */}
                  <TabsContent value="images" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative rounded-md overflow-hidden border h-48">
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => handleRemoveImage(image)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </div>
                      ))}
                      
                      {formData.images.length === 0 && (
                        <div className="col-span-full flex items-center justify-center border rounded-md h-48 bg-gray-50">
                          <div className="text-center p-6">
                            <Upload className="h-10 w-10 mx-auto text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">No images added yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      <Label htmlFor="newImageUrl">Add Image URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="newImageUrl"
                          value={newImageUrl}
                          onChange={e => setNewImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                        <Button
                          type="button"
                          onClick={handleAddImage}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter URL for product image. Recommended size: 800x800 pixels
                      </p>
                    </div>
                  </TabsContent>
                  
                  {/* Pricing */}
                  <TabsContent value="pricing" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleNumericChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="compareAtPrice">Compare At Price (₹)</Label>
                        <Input
                          id="compareAtPrice"
                          name="compareAtPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.compareAtPrice}
                          onChange={handleNumericChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Original price before discount. Leave at 0 if no discount
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="discount">Discount Percentage (%)</Label>
                        <Input
                          id="discount"
                          name="discount"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discount}
                          onChange={handleNumericChange}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Inventory */}
                  <TabsContent value="inventory" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={handleNumericChange}
                      />
                    </div>
                  </TabsContent>
                  
                  {/* SEO Settings */}
                  <TabsContent value="seo" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">SEO Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={seoData.title}
                        onChange={handleSEOInputChange}
                        placeholder="SEO title (defaults to product name)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 50-60 characters. Current: {seoData.title.length} characters
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">SEO Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={seoData.description}
                        onChange={handleSEOInputChange}
                        placeholder="SEO meta description (defaults to product description)"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">
                        Recommended: 120-160 characters. Current: {seoData.description.length} characters
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="keywords">SEO Keywords</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {seoData.keywords.map(keyword => (
                          <Badge key={keyword} variant="secondary" className="gap-1">
                            {keyword}
                            <button
                              type="button"
                              className="ml-1 text-gray-500 hover:text-gray-700"
                              onClick={() => handleRemoveKeyword(keyword)}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="newKeyword"
                          value={newKeyword}
                          onChange={(e) => setNewKeyword(e.target.value)}
                          placeholder="Add keyword"
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddKeyword}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="canonicalUrl">Canonical URL (Optional)</Label>
                      <Input
                        id="canonicalUrl"
                        name="canonicalUrl"
                        value={seoData.canonicalUrl}
                        onChange={handleSEOInputChange}
                        placeholder="https://instant-cart.example.com/products/product-slug"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to use the default product URL
                      </p>
                    </div>

                    <div className="border-t pt-4 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Content Analysis</h3>
                        <Button 
                          type="button" 
                          onClick={handleAnalyzeContent}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Analyze Content'}
                        </Button>
                      </div>
                      
                      {contentAnalysis && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="border rounded-md p-3">
                              <div className="text-sm text-gray-500">Word Count</div>
                              <div className="text-2xl font-semibold">{contentAnalysis.wordCount}</div>
                            </div>
                            <div className="border rounded-md p-3">
                              <div className="text-sm text-gray-500">Keyword Density</div>
                              <div className="text-2xl font-semibold">{contentAnalysis.keywordDensity.toFixed(1)}%</div>
                            </div>
                            <div className="border rounded-md p-3 col-span-2">
                              <div className="text-sm text-gray-500">Readability Score</div>
                              <div className="flex items-center">
                                <div className="text-2xl font-semibold">{contentAnalysis.readabilityScore}</div>
                                <div className="ml-2 text-sm px-2 py-1 rounded-full bg-green-50 text-green-700">
                                  {contentAnalysis.readabilityScore > 90 
                                    ? 'Excellent' 
                                    : contentAnalysis.readabilityScore > 70 
                                      ? 'Good' 
                                      : 'Needs Improvement'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {contentAnalysis.suggestions.length > 0 && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Content Suggestions</AlertTitle>
                              <AlertDescription>
                                <ul className="list-disc pl-5 space-y-1 mt-2">
                                  {contentAnalysis.suggestions.map((suggestion: string, i: number) => (
                                    <li key={i}>{suggestion}</li>
                                  ))}
                                </ul>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditMode ? 'Update Product' : 'Add Product'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductForm; 