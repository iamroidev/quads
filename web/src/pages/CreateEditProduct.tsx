import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import productService from '../services/product.service';
import growthService from '../services/growth.service';
import categoryService from '../services/category.service';
import { ImageUpload } from '../components/product';
import { Category, ProductPopulated } from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';
import { useAuth } from '../context/AuthContext';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  price: z.number({ invalid_type_error: 'Price is required' }).min(0.5, 'Min price is GHS 0.50').max(100000, 'Max price is GHS 100,000'),
  originalPrice: z.number().min(0.5, 'Min price is GHS 0.50').max(100000, 'Max price is GHS 100,000').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor'], { required_error: 'Condition is required' }),
  deliveryOption: z.enum(['pickup', 'delivery', 'both']).default('pickup'),
  pickupLocation: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'draft']).default('active'),
  stock: z.number().min(1, 'Stock must be at least 1').max(10000, 'Stock is too high').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
});

type ProductFormData = z.infer<typeof productSchema>;

const CAMPUS_LOCATIONS = [
  'Main Gate', 'Esther Hall', 'Independence Hall', 'Unity Hall', 'Queens Hall',
  'Engineering Block', 'Science Block', 'Library', 'Student Center', 'Cafeteria',
  'Sports Complex', 'Admin Block', 'ICT Center', 'Tarkwa Market',
];

const fieldBase = 'w-full border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-2 text-[12px] font-bold focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] placeholder:text-[var(--bulletin-muted)]';
const fieldError = 'border-red-500';
const labelBase = 'block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-1';

const CreateEditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();

  // Block unverified sellers from creating new listings (edit is allowed)
  const isUnverifiedSeller =
    !isEdit &&
    user?.role === 'seller' &&
    !user?.isVerified &&
    !user?.emailVerified &&
    !user?.phoneVerified;

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string; publicId: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [pricingInsights, setPricingInsights] = useState<any | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    trigger,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onChange',
    defaultValues: {
      deliveryOption: 'pickup',
      status: 'active',
    },
  });

  const deliveryOption = watch('deliveryOption');
  const watchedStatus = watch('status');

  useEffect(() => {
    categoryService.getCategories().then((res) => {
      if (res.success) setCategories(res.data.categories);
    });
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchProduct = async () => {
      try {
        const res = await productService.getProduct(id);
        if (res.success) {
          const p = res.data.product;
          reset({
            title: p.title,
            description: p.description,
            price: p.price,
            originalPrice: p.originalPrice,
            category: typeof p.category === 'string' ? p.category : p.category.name,
            condition: p.condition,
            deliveryOption: p.deliveryOption,
            pickupLocation: p.pickupLocation,
            tags: p.tags.join(', '),
            status: (p.status === 'active' || p.status === 'draft') ? p.status as 'active' | 'draft' : 'active',
            stock: p.stock,
          });
          setExistingImages(p.images);
        }
      } catch {
        toast.error('Failed to load product');
        navigate('/my-listings');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [id, isEdit, navigate, reset]);

  useEffect(() => {
    if (!isEdit || !id) return;
    growthService.getSmartPricing(id)
      .then((res) => {
        if (res.success) setPricingInsights(res.data);
      })
      .catch(() => {});
  }, [id, isEdit]);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['title'];
      const totalImages = existingImages.length + images.length;
      if (totalImages === 0 && !isEdit) {
        toast.error('Add at least one photo');
        return;
      }
    } else if (currentStep === 2) {
      fieldsToValidate = ['description', 'category', 'condition'];
    }

    const result = await trigger(fieldsToValidate);
    if (result) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const onSubmit = async (data: ProductFormData) => {
    setSubmitting(true);
    try {
      if (isEdit && removedImageIds.length > 0) {
        await productService.deleteImages(id!, removedImageIds);
      }

      const tags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        title: data.title,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        category: data.category,
        condition: data.condition,
        deliveryOption: data.deliveryOption,
        pickupLocation: data.pickupLocation,
        tags,
        status: data.status,
        stock: data.stock,
        images: images.length > 0 ? images : undefined,
      };

      if (isEdit) {
        await productService.updateProduct(id!, payload);
        toast.success(data.status === 'draft' ? 'Draft updated!' : 'Product updated!');
      } else {
        await productService.createProduct(payload);
        toast.success(data.status === 'draft' ? 'Listing saved as draft!' : 'Product listed successfully!');
      }

      navigate('/my-listings');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setValue('status', 'draft');
    // For drafts, we relax some validations if needed, but here we just try to submit
    const data = watch();
    if (!data.title) {
      toast.error('Title is required even for drafts');
      return;
    }
    handleSubmit(onSubmit)();
  };

  const handleRemoveExistingImage = (publicId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
    setRemovedImageIds((prev) => [...prev, publicId]);
  };

  if (loadingProduct) {
    return (
      <BulletinLayout title="Loading..." subtitle={isEdit ? 'Edit' : 'New'} section="14">
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-[var(--bulletin-border)]" />
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  // Verification gate
  if (isUnverifiedSeller) {
    return (
      <BulletinLayout title="Verification Required" subtitle="Seller" section="14">
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="inline-flex items-center justify-center h-16 w-16 border-2 border-[var(--bulletin-border)] bg-[#fce4ec] dark:bg-red-900/20 mb-6">
              <ShieldOff className="h-8 w-8 opacity-60" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[3px] opacity-50 mb-3">Action Required</div>
            <h2 className="text-2xl font-bold mb-3">Verify before listing</h2>
            <p className="text-[13px] opacity-60 mb-2">
              Sellers must verify their <strong>email</strong> or <strong>phone</strong> before creating listings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <button
                onClick={() => navigate('/verification')}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-6 py-3 text-[11px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] transition-colors"
              >
                Verify My Account
              </button>
            </div>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout
      title={isEdit ? 'Edit listing' : 'New listing'}
      subtitle={isEdit ? 'Update details' : 'pin to board'}
      section="14"
    >
      <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 md:p-6">
        <div className="mx-auto max-w-[1400px] flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[12px] font-bold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(step => (
              <div key={step} className="flex items-center gap-2">
                <div className={`h-6 w-6 border-2 border-black flex items-center justify-center text-[10px] font-black ${currentStep === step ? 'bg-black text-white' : currentStep > step ? 'bg-[#ff6b6b] text-white' : 'bg-white text-black'}`}>
                  {step}
                </div>
                {step < 3 && <div className="h-0.5 w-4 bg-black/10" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
          
          {/* STEP 1: IDENTITY & VISUALS */}
          {currentStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="border-l-4 border-[#ff6b6b] pl-4 mb-8">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Step 1: Visual Identity</h2>
                 <p className="text-[12px] font-bold opacity-50 uppercase">Show them what you've got</p>
               </div>

              <BulletinCard rotation={-0.5} bgColor="bg-[var(--bulletin-card)]">
                <div className={labelBase}>Item Gallery (Max 5)</div>
                <div className="mt-3">
                  <ImageUpload
                    images={images}
                    existingImages={existingImages}
                    onChange={setImages}
                    onRemoveExisting={handleRemoveExistingImage}
                    maxImages={5}
                  />
                </div>
              </BulletinCard>

              <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]">
                <label className={labelBase}>Listing Title</label>
                <input
                  type="text"
                  placeholder="e.g., iPhone 15 Pro Max — MINT CONDITION"
                  className={`${fieldBase} mt-2 text-lg py-4 ${errors.title ? fieldError : ''}`}
                  {...register('title')}
                />
                {errors.title && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.title.message}</p>}
              </BulletinCard>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-black text-white px-10 py-4 text-[12px] font-black uppercase tracking-widest hover:bg-[#ff6b6b] transition-all shadow-[8px_8px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                  Next: The Details →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: THE DETAILS */}
          {currentStep === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="border-l-4 border-[#ff6b6b] pl-4 mb-8">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Step 2: Specifications</h2>
                 <p className="text-[12px] font-bold opacity-50 uppercase">The nitty-gritty details</p>
               </div>

              <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]">
                <label className={labelBase}>Detailed Description</label>
                <textarea
                  placeholder="Explain why this is a great deal..."
                  rows={6}
                  className={`${fieldBase} mt-2 resize-none ${errors.description ? fieldError : ''}`}
                  {...register('description')}
                />
                {errors.description && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.description.message}</p>}
              </BulletinCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BulletinCard rotation={0.2} bgColor="bg-[var(--bulletin-card)]">
                  <label className={labelBase}>Category</label>
                  <input
                    type="text"
                    placeholder="Search category..."
                    className={`${fieldBase} mt-2 ${errors.category ? fieldError : ''}`}
                    {...register('category')}
                    autoComplete="off"
                    list="category-suggestions"
                  />
                  <datalist id="category-suggestions">
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name} />
                    ))}
                  </datalist>
                  {errors.category && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.category.message}</p>}
                </BulletinCard>

                <BulletinCard rotation={-0.2} bgColor="bg-[var(--bulletin-card)]">
                  <label className={labelBase}>Condition</label>
                  <select className={`${fieldBase} mt-2 ${errors.condition ? fieldError : ''}`} {...register('condition')}>
                    <option value="">Select condition</option>
                    <option value="new">Brand New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                  {errors.condition && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.condition.message}</p>}
                </BulletinCard>
              </div>

              <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]">
                <label className={labelBase}>Search Tags (Optional)</label>
                <input
                  type="text"
                  placeholder="samsung, phone, laptop..."
                  className={`${fieldBase} mt-2`}
                  {...register('tags')}
                />
              </BulletinCard>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-4 text-[12px] font-black uppercase tracking-widest border-2 border-black hover:bg-black/5"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-black text-white px-10 py-4 text-[12px] font-black uppercase tracking-widest hover:bg-[#ff6b6b] transition-all shadow-[8px_8px_0_0_rgba(0,0,0,0.2)]"
                >
                  Next: Logistics →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOGISTICS & PRICING */}
          {currentStep === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="border-l-4 border-[#ff6b6b] pl-4 mb-8">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Step 3: Final Logistics</h2>
                 <p className="text-[12px] font-bold opacity-50 uppercase">Set your price and meetup</p>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BulletinCard rotation={0.3} bgColor="bg-white dark:bg-black/40">
                  <label className={labelBase}>Your Asking Price (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`${fieldBase} mt-2 text-xl font-black ${errors.price ? fieldError : ''}`}
                    {...register('price', { valueAsNumber: true })}
                  />
                  {errors.price && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.price.message}</p>}
                </BulletinCard>

                <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]">
                  <label className={labelBase}>Original/Market Price (GHS)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={`${fieldBase} mt-2 opacity-60`}
                    {...register('originalPrice', { valueAsNumber: true })}
                  />
                </BulletinCard>
              </div>

              {pricingInsights && (
                <div className="p-4 border-2 border-dashed border-black bg-[#fffacd] dark:bg-yellow-900/10 rotate-[-1deg]">
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/40">Smart Recommendation</div>
                  <div className="text-[13px] font-bold mt-1 text-black">Students are paying GHS {pricingInsights.recommendedMin} - {pricingInsights.recommendedMax} for similar items.</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BulletinCard rotation={-0.2} bgColor="bg-[var(--bulletin-card)]">
                  <label className={labelBase}>Fulfillment</label>
                  <select className={`${fieldBase} mt-2`} {...register('deliveryOption')}>
                    <option value="pickup">Campus Pickup Only</option>
                    <option value="delivery">Hostel Delivery Only</option>
                    <option value="both">Both Available</option>
                  </select>
                </BulletinCard>

                {(deliveryOption === 'pickup' || deliveryOption === 'both') && (
                  <BulletinCard rotation={0.2} bgColor="bg-[var(--bulletin-card)]">
                    <label className={labelBase}>Meetup Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Unity Hall Gate"
                      className={`${fieldBase} mt-2`}
                      {...register('pickupLocation')}
                      list="location-suggestions"
                    />
                    <datalist id="location-suggestions">
                      {CAMPUS_LOCATIONS.map(l => <option key={l} value={l} />)}
                    </datalist>
                  </BulletinCard>
                )}
              </div>

              <div className="flex flex-col gap-4 pt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  onClick={() => setValue('status', 'active')}
                  className="w-full bg-black text-white px-10 py-5 text-[14px] font-black uppercase tracking-[0.3em] hover:bg-[#ff6b6b] transition-all shadow-[12px_12px_0_0_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  {submitting ? 'PROCESSING...' : isEdit ? 'CONFIRM CHANGES' : 'PUBLISH TO BOARD'}
                </button>
                
                <div className="flex gap-4">
                   <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-8 py-3 text-[11px] font-black uppercase tracking-widest border-2 border-black hover:bg-black/5"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={submitting}
                    className="flex-1 border-2 border-black bg-white dark:bg-black/20 px-8 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-[#fffacd] dark:hover:bg-white/10 transition-colors"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default CreateEditProduct;