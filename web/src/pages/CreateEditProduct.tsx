import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldOff, Video, X, Play, UploadCloud } from 'lucide-react';
import productService from '../services/product.service';
import growthService from '../services/growth.service';
import categoryService from '../services/category.service';
import referenceService, { PickupSpot } from '../services/reference.service';
import { ImageUpload } from '../components/product';
import { Category } from '../types';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';
import { useAuth } from '../context/AuthContext';

const productSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long').optional().or(z.literal('')),
  price: z.number({ invalid_type_error: 'Price is required' }).min(0.5, 'Min price is GHS 0.50').max(100000, 'Max price is GHS 100,000').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  originalPrice: z.number().min(0.5, 'Min price is GHS 0.50').max(100000, 'Max price is GHS 100,000').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  category: z.string().min(1, 'Category is required').optional().or(z.literal('')),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor'], { required_error: 'Condition is required' }).optional().or(z.literal('')),
  deliveryOption: z.enum(['pickup', 'delivery', 'both']).default('pickup'),
  pickupLocation: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'draft']).default('active'),
  stock: z.number().min(1, 'Stock must be at least 1').max(10000, 'Stock is too high').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
});

type ProductFormData = z.infer<typeof productSchema>;

const CreateEditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { user } = useAuth();

  const isUnverifiedSeller =
    !isEdit &&
    user?.roles?.includes('seller') &&
    !user?.isVerified;

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [existingImages, setExistingImages] = useState<{ url: string; publicId: string }[]>([]);
  const [existingVideo, setExistingVideo] = useState<{ url: string; publicId: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [pricingInsights, setPricingInsights] = useState<any | null>(null);

  const [pickupSpots, setPickupSpots] = useState<PickupSpot[]>([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const fallbackSpots = [
    'Unity Hall Entrance', 'Queens Hall Entrance', 'Independence Hall Entrance',
    'CK Hostel Entrance', 'Corazon Hostel Entrance', 'Tovet Hostel Entrance',
    'Hilda Hostel Entrance', 'Figenco Hostel Entrance', "Kabi's Hostel Entrance",
    'Castle Gate Hostel Entrance', 'The White House Hostel Entrance', 'Platinum Hostel Entrance',
    'RNM Hostel Entrance', 'Nhiraba Hostel Entrance', 'Osborne Hostel Entrance',
    'Campus Library', 'Main Auditorium', 'Administration Block'
  ];

  useEffect(() => {
    referenceService.getPickupSpots()
      .then(setPickupSpots)
      .catch((err) => console.error('Failed to load pickup spots:', err));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
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
  const selectedCategory = watch('category');
  const pickupLocation = watch('pickupLocation');
  const isServiceOrAccommodation = selectedCategory === 'Services' || selectedCategory === 'Accommodation';
  
  const spotsList = pickupSpots.length > 0 ? pickupSpots.map(s => s.name) : fallbackSpots;

  useEffect(() => {
    if (pickupLocation && spotsList.length > 0 && !spotsList.includes(pickupLocation) && pickupLocation !== 'Other') {
      setIsOtherSelected(true);
    }
  }, [pickupLocation, spotsList]);

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
          if (p.video) setExistingVideo(p.video);
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
      fieldsToValidate = ['description', 'category', 'condition', 'price'];
    }

    const result = await trigger(fieldsToValidate);
    if (result) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      toast.error('Please complete the required fields for this phase');
    }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const onSubmit = async (data: ProductFormData) => {
    if (data.status === 'active') {
      if (!data.description || data.description.length < 10) {
        toast.error('Description must be at least 10 characters to publish');
        return;
      }
      if (!data.price) {
        toast.error('Price is required to publish');
        return;
      }
      if (!data.category) {
        toast.error('Category is required to publish');
        return;
      }
      if (!isServiceOrAccommodation && !data.condition) {
        toast.error('Condition is required to publish');
        return;
      }
    }

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
        description: data.description || '',
        price: data.price || 0,
        originalPrice: data.originalPrice,
        category: data.category || 'others',
        condition: data.condition || 'good',
        deliveryOption: data.deliveryOption,
        pickupLocation: data.pickupLocation,
        tags,
        status: data.status,
        stock: data.stock,
        images: images.length > 0 ? images : undefined,
        video: video || undefined,
      };

      if (isEdit) {
        await productService.updateProduct(id!, payload);
        toast.success(data.status === 'draft' ? 'Draft updated!' : 'Product updated!');
      } else {
        await productService.createProduct(payload as any);
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
    const isTitleValid = await trigger('title');
    if (!isTitleValid) {
      toast.error('Drafts need at least a title (min 3 chars)');
      return;
    }

    const values = watch();
    setSubmitting(true);
    try {
      const tags = values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        ...values,
        tags,
        status: 'draft' as const,
        images: images.length > 0 ? images : undefined,
        video: video || undefined,
      };

      if (isEdit) {
        await productService.updateProduct(id!, payload);
        toast.success('Draft updated!');
      } else {
        await productService.createProduct(payload as any);
        toast.success('Listing saved as draft!');
      }
      navigate('/my-listings');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save draft';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveExistingImage = (publicId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
    setRemovedImageIds((prev) => [...prev, publicId]);
  };

  if (loadingProduct) {
    return (
      <BulletinLayout title="Loading..." subtitle={isEdit ? 'Edit' : 'New'} section="14" showFooter={false}>
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-b-2 border-[var(--bulletin-border)]" />
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  if (isUnverifiedSeller) {
    return (
      <BulletinLayout title="Verification Required" subtitle="Seller" section="14" showFooter={false}>
        <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="inline-flex items-center justify-center h-16 w-16 border-2 border-[var(--bulletin-border)] bg-[#fce4ec] dark:bg-red-900/20 mb-6">
              <ShieldOff className="h-8 w-8 opacity-60" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[3px] opacity-50 mb-3">Check this</div>
            <h2 className="text-2xl font-bold mb-3">Verify your account to sell</h2>
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
      title={isEdit ? 'Edit Item' : 'Sell Something'}
      subtitle={isEdit ? 'Fixing up your item info...' : 'Post your item for others to buy'}
      section="14"
      hideHero={true}
      showFooter={false}
    >
      <div className="bg-[var(--bulletin-bg)] min-h-screen pb-20">
        <div className="border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-6 sticky top-[42px] z-[50] transition-colors">
          <div className="mx-auto max-w-4xl flex justify-between items-center">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-widest hover:text-[var(--bulletin-accent)]"
            >
              <div className="h-8 w-8 border-2 border-[var(--bulletin-border)] flex items-center justify-center bg-[var(--bulletin-card)] group-hover:bg-[var(--bulletin-text)] group-hover:text-[var(--bulletin-bg)] transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline">Cancel</span>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-6">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`h-10 w-10 border-4 border-[var(--bulletin-border)] flex items-center justify-center text-sm font-black transition-all ${currentStep === step ? 'bg-[var(--bulletin-accent)] text-white -rotate-3 scale-110 shadow-[4px_4px_0_0_var(--bulletin-text)]' : currentStep > step ? 'bg-[var(--bulletin-text)] text-[var(--bulletin-bg)]' : 'bg-[var(--bulletin-card)] text-[var(--bulletin-text)] opacity-30'}`}>
                    0{step}
                  </div>
                  {step < 3 && <div className="h-1 w-4 sm:w-8 bg-[var(--bulletin-text)] opacity-10" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <BulletinSection bgColor="bg-[var(--bulletin-bg)] py-12 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--bulletin-text) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

          <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto relative z-10 px-4">
            {currentStep === 1 && (
              <div className="space-y-8 sm:space-y-12 animate-card-drop">
                 <div className="bg-[var(--bulletin-card)] border-2 sm:border-4 border-[var(--bulletin-border)] p-3 sm:p-4 inline-block -rotate-2 shadow-[4px_4px_0_0_var(--bulletin-accent)] sm:shadow-[8px_8px_0_0_var(--bulletin-accent)]">
                   <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none">STEP 1: PHOTOS</h2>
                   <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">Make sure photos are clear and show the item well</p>
                 </div>

                <div className="relative pt-4 sm:pt-6">
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 h-6 sm:h-8 w-32 sm:w-48 bg-[#ffd700]/40 rotate-1 shadow-sm z-20 border border-black/5" />
                  
                  <BulletinCard rotation={-0.5} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-8 shadow-[6px_6px_0_0_var(--bulletin-text)] sm:shadow-[12px_12px_0_0_var(--bulletin-text)]">
                    <div className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-4">
                      <div className="h-0.5 sm:h-1 flex-1 bg-[var(--bulletin-text)] opacity-10" />
                      Add Photos
                      <div className="h-0.5 sm:h-1 flex-1 bg-[var(--bulletin-text)] opacity-10" />
                    </div>
                    <ImageUpload
                      images={images}
                      existingImages={existingImages}
                      onChange={setImages}
                      onRemoveExisting={handleRemoveExistingImage}
                      maxImages={5}
                    />

                    {/* Video Upload Section */}
                    <div className="mt-10 border-t-2 border-[var(--bulletin-border)] pt-10">
                       <div className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-4">
                         <div className="h-0.5 sm:h-1 flex-1 bg-[var(--bulletin-text)] opacity-10" />
                        Item Video
                        <div className="h-0.5 sm:h-1 flex-1 bg-[var(--bulletin-text)] opacity-10" />
                      </div>

                      {(video || existingVideo) ? (
                        <div className="relative aspect-video border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] overflow-hidden group">
                           {video ? (
                             <video 
                              src={URL.createObjectURL(video)} 
                              className="w-full h-full object-contain"
                              controls
                             />
                           ) : (
                             <video 
                              src={existingVideo?.url} 
                              className="w-full h-full object-contain"
                              controls
                             />
                           )}
                           <button 
                            type="button"
                            onClick={() => { setVideo(null); setExistingVideo(null); if (existingVideo) setRemovedImageIds(prev => [...prev, existingVideo.publicId]); }}
                            className="absolute top-4 right-4 bg-[#ff6b6b] text-white p-2 border-2 border-[var(--bulletin-border)] shadow-[4px_4px_0_0_var(--bulletin-border)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all z-20"
                           >
                             <X className="h-4 w-4" />
                           </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-4 border-dashed border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-12 cursor-pointer hover:bg-[var(--bulletin-card)] transition-colors group">
                           <UploadCloud className="h-12 w-12 opacity-20 mb-4 group-hover:scale-110 transition-transform" />
                           <div className="text-[11px] font-black uppercase tracking-widest opacity-40">Upload Product Video</div>
                           <div className="text-[8px] font-black uppercase opacity-20 mt-2">MP4, MOV or WebM (Max 15MB)</div>
                           <input 
                            type="file" 
                            accept="video/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 15 * 1024 * 1024) {
                                  toast.error('Video too large (Max 15MB)');
                                  return;
                                }
                                setVideo(file);
                              }
                            }}
                           />
                        </label>
                      )}
                    </div>
                  </BulletinCard>
                </div>

                <BulletinCard rotation={0.5} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-8 shadow-[6px_6px_0_0_var(--bulletin-accent)] sm:shadow-[8px_8px_0_0_var(--bulletin-accent)]">
                  <label className="block text-[9px] sm:text-[11px] font-black uppercase tracking-widest mb-2 sm:mb-4">ITEM NAME</label>
                  <input
                    type="text"
                    placeholder="E.G. ENGINEERING CALCULATOR"
                    className="w-full border-2 sm:border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-3 sm:p-4 text-lg sm:text-xl font-black uppercase placeholder:opacity-20 focus:outline-none focus:bg-[var(--bulletin-card)] transition-colors"
                    {...register('title')}
                  />
                  {errors.title && <p className="mt-2 text-[11px] sm:text-[12px] text-[var(--bulletin-accent)] font-black italic">{errors.title.message}</p>}
                </BulletinCard>

                <div className="flex justify-end pt-6 sm:pt-10">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full sm:w-auto bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-8 sm:px-12 py-4 sm:py-6 text-[12px] sm:text-[14px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-[var(--bulletin-accent)] hover:text-white transition-all shadow-[6px_6px_0_0_var(--bulletin-shadow)] sm:shadow-[12px_12px_0_0_var(--bulletin-shadow)] hover:shadow-[8px_8px_0_0_var(--bulletin-accent)] active:scale-95"
                  >
                    CONTINUE TO DETAILS →
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-8 sm:space-y-12 animate-card-drop">
                 <div className="bg-[var(--bulletin-accent)] border-2 sm:border-4 border-[var(--bulletin-border)] p-3 sm:p-4 inline-block rotate-2 shadow-[4px_4px_0_0_var(--bulletin-card)] sm:shadow-[8px_8px_0_0_var(--bulletin-card)] text-white">
                   <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none">STEP 2: DETAILS</h2>
                   <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-60 mt-1 text-white">Specify condition and details</p>
                 </div>

                <BulletinCard rotation={-0.4} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-8 shadow-[6px_6px_0_0_var(--bulletin-text)] sm:shadow-[12px_12px_0_0_var(--bulletin-text)]">
                  <label className="block text-[9px] sm:text-[11px] font-black uppercase tracking-widest mb-2 sm:mb-4">ABOUT THIS ITEM (DESCRIPTION)</label>
                  <textarea
                    placeholder="DESCRIBE YOUR ITEM..."
                    rows={6}
                    className="w-full border-2 sm:border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-3 sm:p-4 text-[13px] sm:text-[14px] font-bold uppercase resize-none focus:outline-none focus:bg-[var(--bulletin-card)] transition-colors"
                    {...register('description')}
                  />
                  {errors.description && <p className="mt-2 text-[11px] sm:text-[12px] text-[var(--bulletin-accent)] font-black italic">{errors.description.message}</p>}
                </BulletinCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="relative">
                     <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 h-8 w-8 sm:h-10 sm:w-10 bg-[var(--bulletin-text)] rotate-45 z-20" />
                     <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-6 shadow-[6px_6px_0_0_var(--bulletin-text)] sm:shadow-[8px_8px_0_0_var(--bulletin-text)]">
                      <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3">CATEGORY</label>
                      <input
                        type="text"
                        placeholder="CATEGORY"
                        className="w-full border-2 border-[var(--bulletin-border)] bg-transparent p-2 sm:p-3 text-[11px] sm:text-[12px] font-black uppercase focus:outline-none"
                        {...register('category')}
                        autoComplete="off"
                        list="category-suggestions"
                      />
                      <datalist id="category-suggestions">
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name} />
                        ))}
                      </datalist>
                    </BulletinCard>
                  </div>

                  {!isServiceOrAccommodation && (
                    <BulletinCard rotation={-0.5} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-6 shadow-[6px_6px_0_0_var(--bulletin-accent)] sm:shadow-[8px_8px_0_0_var(--bulletin-accent)]">
                      <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3">CONDITION</label>
                      <select className="w-full border-2 border-[var(--bulletin-border)] p-2 sm:p-3 text-[11px] sm:text-[12px] font-black uppercase focus:outline-none bg-[var(--bulletin-card)] text-[var(--bulletin-text)]" {...register('condition')}>
                        <option value="" className="bg-white text-black dark:bg-zinc-800 dark:text-white">SELECT CONDITION</option>
                        <option value="new" className="bg-white text-black dark:bg-zinc-800 dark:text-white">BRAND NEW</option>
                        <option value="like-new" className="bg-white text-black dark:bg-zinc-800 dark:text-white">LIKE NEW</option>
                        <option value="good" className="bg-white text-black dark:bg-zinc-800 dark:text-white">GOOD</option>
                        <option value="fair" className="bg-white text-black dark:bg-zinc-800 dark:text-white">FAIR</option>
                        <option value="poor" className="bg-white text-black dark:bg-zinc-800 dark:text-white">POOR</option>
                      </select>
                    </BulletinCard>
                  )}
                </div>

                <BulletinCard rotation={0.4} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-6 shadow-[6px_6px_0_0_var(--bulletin-text)] sm:shadow-[8px_8px_0_0_var(--bulletin-text)]">
                  <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3">SEARCH TAGS</label>
                  <input
                    type="text"
                    placeholder="SAMSUNG, PHONE..."
                    className="w-full border-2 border-[var(--bulletin-border)] bg-transparent p-2 sm:p-3 text-[11px] sm:text-[12px] font-black uppercase placeholder:opacity-40 focus:outline-none"
                    {...register('tags')}
                  />
                </BulletinCard>

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 sm:pt-10">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="order-2 sm:order-1 px-8 py-4 text-[11px] sm:text-[12px] font-black uppercase tracking-widest border-2 sm:border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] text-[var(--bulletin-text)] hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] transition-all shadow-[4px_4px_0_0_var(--bulletin-text)] sm:shadow-[6px_6px_0_0_var(--bulletin-text)]"
                  >
                    ← BACK
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="order-1 sm:order-2 bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-10 sm:px-12 py-4 sm:py-5 text-[12px] sm:text-[14px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-[var(--bulletin-accent)] hover:text-white transition-all shadow-[6px_6px_0_0_var(--bulletin-accent)]"
                  >
                    PRICE & DELIVERY →
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-8 sm:space-y-12 animate-card-drop">
                 <div className="bg-[var(--bulletin-card)] border-2 sm:border-4 border-[var(--bulletin-border)] p-3 sm:p-4 inline-block -rotate-1 shadow-[4px_4px_0_0_var(--bulletin-accent)] sm:shadow-[8px_8px_0_0_var(--bulletin-accent)]">
                   <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter leading-none">STEP 3: PRICE & LOCATION</h2>
                   <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">Determine value and where to meet</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <BulletinCard rotation={0.4} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-8 shadow-[6px_6px_0_0_var(--bulletin-text)] sm:shadow-[12px_12px_0_0_var(--bulletin-text)]">
                    <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-2 sm:mb-4">PRICE (GHS)</label>
                    <div className="flex items-center gap-2 sm:gap-4">
                       <span className="text-2xl sm:text-3xl font-black">¢</span>
                       <input
                        type="number"
                        step="0.01"
                        className="w-full border-b-2 sm:border-b-4 border-[var(--bulletin-border)] text-2xl sm:text-4xl font-black bg-transparent focus:outline-none focus:border-[var(--bulletin-accent)] transition-colors"
                        {...register('price', { valueAsNumber: true })}
                      />
                    </div>
                  </BulletinCard>

                  <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-8 opacity-60">
                    <label className="block text-[10px] sm:text-[11px] font-black uppercase tracking-widest mb-2 sm:mb-4">ORIGINAL PRICE</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border-b-2 sm:border-b-4 border-[var(--bulletin-border)] text-xl sm:text-2xl font-black bg-transparent focus:outline-none"
                      {...register('originalPrice', { valueAsNumber: true })}
                    />
                  </BulletinCard>
                </div>

                {pricingInsights && (
                  <div className="p-4 sm:p-8 border-2 sm:border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] rotate-[-0.3deg] shadow-[4px_4px_0_0_var(--bulletin-accent)] sm:shadow-[8px_8px_0_0_var(--bulletin-accent)]">
                    <div className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 sm:mb-2 underline decoration-2">Price Guide</div>
                    <div className="text-lg sm:text-xl font-black leading-tight">GHS {pricingInsights.recommendedMin} — {pricingInsights.recommendedMax}</div>
                  </div>
                )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <BulletinCard rotation={-0.4} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-6 shadow-[6px_6px_0_0_var(--bulletin-text)] sm:shadow-[12px_12px_0_0_var(--bulletin-text)]">
                    <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3">{isServiceOrAccommodation ? 'OFFERING METHOD' : 'DELIVERY'}</label>
                    <select className="w-full border-2 border-[var(--bulletin-border)] p-2 sm:p-3 text-[11px] sm:text-[12px] font-black uppercase focus:outline-none bg-[var(--bulletin-card)] text-[var(--bulletin-text)]" {...register('deliveryOption')}>
                      <option value="pickup" className="bg-white text-black dark:bg-zinc-800 dark:text-white">{isServiceOrAccommodation ? 'AT SELLER LOCATION' : 'PICKUP'}</option>
                      <option value="delivery" className="bg-white text-black dark:bg-zinc-800 dark:text-white">{isServiceOrAccommodation ? 'AT BUYER LOCATION / REMOTE' : 'DELIVERY'}</option>
                      <option value="both" className="bg-white text-black dark:bg-zinc-800 dark:text-white">BOTH / FLEXIBLE</option>
                    </select>
                  </BulletinCard>

                  {(deliveryOption === 'pickup' || deliveryOption === 'both') && (
                    <BulletinCard rotation={0.4} bgColor="bg-[var(--bulletin-card)]" className="border-2 sm:border-4 border-[var(--bulletin-border)] p-4 sm:p-6 shadow-[6px_6px_0_0_var(--bulletin-accent)] sm:shadow-[8px_8px_0_0_var(--bulletin-accent)]">
                      <label className="block text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-3">{isServiceOrAccommodation ? 'MEETING POINT' : 'CAMPUS LOCATION'}</label>
                      <select
                        className="w-full border-2 border-[var(--bulletin-border)] p-2 sm:p-3 text-[11px] sm:text-[12px] font-black uppercase focus:outline-none bg-[var(--bulletin-card)] text-[var(--bulletin-text)] mb-3"
                        value={isOtherSelected ? 'Other' : (pickupLocation || '')}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Other') {
                            setIsOtherSelected(true);
                            setValue('pickupLocation', '');
                          } else {
                            setIsOtherSelected(false);
                            setValue('pickupLocation', val);
                          }
                        }}
                      >
                        <option value="" className="bg-white text-black dark:bg-zinc-800 dark:text-white">SELECT A SPOT</option>
                        {spotsList.map(spot => (
                          <option key={spot} value={spot} className="bg-white text-black dark:bg-zinc-800 dark:text-white">{spot}</option>
                        ))}
                        <option value="Other" className="bg-white text-black dark:bg-zinc-800 dark:text-white">OTHER (SPECIFY BELOW)</option>
                      </select>
                      {isOtherSelected && (
                        <input
                          type="text"
                          placeholder="SPECIFY CUSTOM LOCATION"
                          value={spotsList.includes(pickupLocation || '') ? '' : (pickupLocation || '')}
                          className="w-full border-2 border-[var(--bulletin-border)] bg-transparent p-2 sm:p-3 text-[11px] sm:text-[12px] font-black uppercase focus:outline-none animate-fade-up-in"
                          onChange={(e) => setValue('pickupLocation', e.target.value)}
                        />
                      )}
                    </BulletinCard>
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:gap-6 pt-6 sm:pt-12">
                  <button
                    type="submit"
                    disabled={submitting}
                    onClick={() => setValue('status', 'active')}
                    className="w-full bg-[var(--bulletin-text)] text-[var(--bulletin-bg)] px-8 sm:px-10 py-6 sm:py-8 text-[14px] sm:text-[18px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] hover:bg-[var(--bulletin-accent)] hover:text-white transition-all shadow-[8px_8px_0_0_var(--bulletin-accent)] sm:shadow-[16px_16px_0_0_var(--bulletin-accent)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:scale-[0.98] border-2 sm:border-4 border-white/10"
                  >
                    {submitting ? 'SAVING...' : isEdit ? 'UPDATE ITEM' : 'POST ITEM'}
                  </button>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="order-2 sm:order-1 flex-1 px-8 py-4 sm:py-5 text-[11px] sm:text-[12px] font-black uppercase tracking-widest border-2 sm:border-4 border-[var(--bulletin-border)] text-[var(--bulletin-text)] bg-[var(--bulletin-card)] hover:bg-[var(--bulletin-text)] hover:text-[var(--bulletin-bg)] transition-all"
                    >
                      ← BACK
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={submitting}
                      className="order-1 sm:order-2 flex-1 border-2 sm:border-4 border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700] px-8 py-4 sm:py-5 text-[11px] sm:text-[12px] font-black uppercase tracking-widest hover:bg-[#ffd700] hover:text-black transition-colors"
                    >
                      SAVE AS DRAFT
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </BulletinSection>
      </div>
    </BulletinLayout>
  );
};

export default CreateEditProduct;