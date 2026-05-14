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
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['new', 'like-new', 'good', 'fair', 'poor'], { required_error: 'Condition is required' }),
  deliveryOption: z.enum(['pickup', 'delivery', 'both']).default('pickup'),
  pickupLocation: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['active', 'draft']).default('active'),
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
    formState: { errors },
    reset,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      deliveryOption: 'pickup',
      status: 'active',
    },
  });

  const deliveryOption = watch('deliveryOption');

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
            category: typeof p.category === 'string' ? p.category : p.category._id,
            condition: p.condition,
            deliveryOption: p.deliveryOption,
            pickupLocation: p.pickupLocation,
            tags: p.tags.join(', '),
            status: p.status === 'active' || p.status === 'draft' ? p.status : 'active',
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

  const onSubmit = async (data: ProductFormData) => {
    const totalImages = existingImages.length + images.length;
    if (totalImages === 0 && !isEdit) {
      toast.error('Please add at least one image');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && removedImageIds.length > 0) {
        await productService.deleteImages(id!, removedImageIds);
      }

      const tags = data.tags
        ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      if (isEdit) {
        await productService.updateProduct(id!, {
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          condition: data.condition,
          deliveryOption: data.deliveryOption,
          pickupLocation: data.pickupLocation,
          tags,
          status: data.status,
          images: images.length > 0 ? images : undefined,
        });
        toast.success('Product updated successfully!');
      } else {
        await productService.createProduct({
          title: data.title,
          description: data.description,
          price: data.price,
          category: data.category,
          condition: data.condition,
          deliveryOption: data.deliveryOption,
          pickupLocation: data.pickupLocation,
          tags,
          status: data.status,
          images: images.length > 0 ? images : undefined,
        });
        toast.success('Product listed successfully!');
      }

      navigate('/my-listings');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save product';
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
    return <BulletinLayout title="Loading..." subtitle={isEdit ? 'Edit' : 'New'} section="14">
      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-b-2 border-[var(--bulletin-border)]" />
        </div>
      </BulletinSection>
    </BulletinLayout>;
  }

  // Verification gate — shown before the form for new listings only
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
            <p className="text-[12px] opacity-50 mb-8">
              Use your <strong>@st.umat.edu.gh</strong> email to confirm you're a UMaT student, or verify your phone via SMS.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/verification')}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-6 py-3 text-[11px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] transition-colors"
              >
                Verify My Account
              </button>
              <button
                onClick={() => navigate(-1)}
                className="border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-3 text-[11px] font-bold uppercase shadow-[3px_3px_0_0_var(--bulletin-shadow)] hover:shadow-[4px_4px_0_0_var(--bulletin-shadow)] transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </BulletinSection>
      </BulletinLayout>
    );
  }

  return (
    <BulletinLayout
      title={isEdit ? 'Edit Listing' : 'Create Listing'}
      subtitle={isEdit ? 'Edit listing' : 'New listing'}
      section="14"
    >
      <div className="border-b border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 md:p-6">
        <div className="mx-auto max-w-[1400px]">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-[12px] font-bold hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-8">
          {/* Images */}
          <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]">
            <div className={labelBase}>Photos</div>
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

          {/* Title */}
          <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]">
            <label className={labelBase}>Title</label>
            <input
              type="text"
              placeholder="e.g., Samsung Galaxy S24 Ultra — 256GB"
              className={`${fieldBase} mt-2 ${errors.title ? fieldError : ''}`}
              {...register('title')}
            />
            {errors.title && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.title.message}</p>}
          </BulletinCard>

          {/* Description */}
          <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]">
            <label className={labelBase}>Description</label>
            <textarea
              placeholder="Describe your item — condition details, why you're selling, any defects, etc."
              rows={5}
              className={`${fieldBase} mt-2 resize-none ${errors.description ? fieldError : ''}`}
              {...register('description')}
            />
            {errors.description && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.description.message}</p>}
          </BulletinCard>

          {/* Price + Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]">
              <label className={labelBase}>Price (GHS)</label>
              <input
                type="number"
                step="0.01"
                min="0.5"
                max="100000"
                placeholder="0.00"
                className={`${fieldBase} mt-2 ${errors.price ? fieldError : ''}`}
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.price.message}</p>}
            </BulletinCard>

            <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]">
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

          {/* Pricing insights */}
          {pricingInsights && (
            <BulletinCard rotation={0} bgColor="bg-[#fffacd] dark:bg-yellow-900/20">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Smart pricing assistant</div>
              <div className="mt-2 text-[12px]">
                Recommended band: <span className="font-bold">GHS {pricingInsights.recommendedMin}</span> - <span className="font-bold">GHS {pricingInsights.recommendedMax}</span>
              </div>
              <div className="mt-1 text-[11px] opacity-70">
                Sell-through: {Math.round((pricingInsights.sellThroughProbability || 0) * 100)}% · Confidence: {(pricingInsights.confidence || 'low').toUpperCase()}
              </div>
            </BulletinCard>
          )}

          {/* Category */}
          <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]">
            <label className={labelBase}>Category</label>
            <select className={`${fieldBase} mt-2 ${errors.category ? fieldError : ''}`} {...register('category')}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-[11px] text-red-600 font-bold">{errors.category.message}</p>}
          </BulletinCard>

          {/* Delivery + Pickup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]">
              <label className={labelBase}>Delivery Option</label>
              <select className={`${fieldBase} mt-2`} {...register('deliveryOption')}>
                <option value="pickup">Campus Pickup</option>
                <option value="delivery">Delivery Available</option>
                <option value="both">Pickup or Delivery</option>
              </select>
            </BulletinCard>

            {(deliveryOption === 'pickup' || deliveryOption === 'both') && (
              <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]">
                <label className={labelBase}>Pickup Location</label>
                <select className={`${fieldBase} mt-2`} {...register('pickupLocation')}>
                  <option value="">Select location</option>
                  {CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </BulletinCard>
            )}
          </div>

          {/* Tags */}
          <BulletinCard rotation={-0.3} bgColor="bg-[var(--bulletin-card)]">
            <label className={labelBase}>Tags</label>
            <input
              type="text"
              placeholder="e.g., samsung, phone, electronics"
              className={`${fieldBase} mt-2`}
              {...register('tags')}
            />
            <div className="mt-1 text-[10px] opacity-50">Comma-separated — max 10</div>
          </BulletinCard>

          {/* Status */}
          <BulletinCard rotation={0.3} bgColor="bg-[var(--bulletin-card)]">
            <div className={labelBase}>Listing Status</div>
            <div className="flex gap-6 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="active"
                  {...register('status')}
                  className="h-4 w-4 accent-[var(--bulletin-text)]"
                />
                <span className="text-[12px] font-bold">Publish Now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="draft"
                  {...register('status')}
                  className="h-4 w-4 accent-[var(--bulletin-text)]"
                />
                <span className="text-[12px] font-bold">Save as Draft</span>
              </label>
            </div>
          </BulletinCard>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 border border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-4 py-2 text-[10px] font-bold uppercase shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:shadow-[3px_3px_0_0_var(--bulletin-shadow)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 border border-[var(--bulletin-border)] bg-[var(--bulletin-text)] px-4 py-2 text-[10px] font-bold uppercase text-[var(--bulletin-bg)] shadow-[2px_2px_0_0_var(--bulletin-shadow)] hover:bg-[var(--bulletin-card)] hover:text-[var(--bulletin-text)] disabled:opacity-40 transition-all"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Listing' : 'Post Listing'}
            </button>
          </div>
        </form>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default CreateEditProduct;