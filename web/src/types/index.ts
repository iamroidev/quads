export interface User {
  _id: string;
  supabaseId?: string;  // legacy
  googleId?: string;
  name: string;
  storeName?: string;
  brandName?: string;
  email: string;
  phone: string;
  roles: ('buyer' | 'seller' | 'admin')[];
  viewMode: 'buyer' | 'seller';
  activeStore?: Store | string;
  avatar?: string;
  studentId?: string;
  department?: string;
  residenceHall?: string;
  currentLevel?: string;
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  isBanned: boolean;
  idCardImageUrl?: string;
  idVerificationStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  idSubmittedAt?: string;
  location?: string;
  bio?: string;
  responseTimeMinutes?: number;
  sellerOnboarding?: {
    completed: boolean;
    payoutSetupComplete: boolean;
    payoutMethod?: 'momo' | 'bank';
    payoutProvider?: string;
    payoutAccountName?: string;
    payoutAccountNumber?: string;
    identityStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    identityDocumentUrl?: string;
    identitySubmittedAt?: string;
    completedAt?: string;
  };
  savedItems: {
    productId: string;
    savedAt: string; // ISO date string
    priceWhenSaved: number;
  }[];
  notificationPrefs?: {
    orderUpdates: boolean;
    messages: boolean;
    reviews: boolean;
    promotions: boolean;
    systemAlerts: boolean;
    priceAlerts: boolean; // New preference for price change alerts
  };
  privacyPrefs?: {
    showPhone: boolean;
    showLocation: boolean;
    allowMessages: boolean;
    showOnlineStatus: boolean;
  };
  createdAt: string;
  updatedAt: string;
  totpEnabled?: boolean;
  tosAcceptedAt?: string;
}
export interface Store {
  _id: string;
  ownerId: string;
  name: string;
  slug: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  payoutSetupComplete: boolean;
  payoutMethod?: string;
  payoutProvider?: string;
  payoutAccountName?: string;
  payoutAccountNumber?: string;
  vacationMode: boolean;
  vacationMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  parent?: string | Category;
  isActive: boolean;
}

// Product types
export interface ProductImage {
  url: string;
  publicId: string;
}

export type ProductCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';
export type ProductStatus = 'active' | 'sold' | 'reserved' | 'draft' | 'removed';
export type DeliveryOption = 'pickup' | 'delivery' | 'both';

export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: Category | string;
  seller: Store | string;
  images: ProductImage[];
  video?: { url: string; publicId: string };
  condition: ProductCondition;
  status: ProductStatus;
  deliveryOption: DeliveryOption;
  pickupLocation: string;
  tags: string[];
  stock: number;
  availableFrom?: string;
  availableUntil?: string;
  flashSalePrice?: number;
  flashSaleEndsAt?: string;
  views: number;
  isFeatured: boolean;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Product with populated references
export interface ProductPopulated extends Omit<Product, 'category' | 'seller'> {
  category: Category;
  seller: Store;
}

export interface ProductFilters {
  category?: string;
  condition?: ProductCondition;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  seller?: string;
  search?: string;
  ids?: string[];
  deliveryOption?: DeliveryOption;
  pickupLocation?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationInfo;
}

// Cart types
export interface CartItem {
  _id: string; // Unique ID for the cart entry
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  sellerId: string;
  sellerName: string;
  pickupLocation: string;
}

// Order & Payment types
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type PaymentMethod = 'momo_mtn' | 'momo_vodafone' | 'momo_airteltigo' | 'card' | 'bank_transfer' | 'cash_on_delivery';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type DeliveryMethod = 'pickup' | 'delivery';

export interface OrderItem {
  product: string | {
    _id: string;
    title: string;
    price: number;
    images: ProductImage[];
    status: string;
    seller: string;
  };
  title: string;
  price: number;
  image?: string;
  quantity: number;
}

export interface Transaction {
  _id: string;
  order: string;
  reference: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paystackResponse?: Record<string, any>;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  buyer: string | Pick<User, '_id' | 'name' | 'avatar' | 'phone' | 'email'>;
  seller: string | Store;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryMethod: DeliveryMethod;
  pickupLocation?: string;
  deliveryAddress?: string;
  deliveryFee: number;
  note?: string;
  payment?: Transaction;
  handoffCode?: string;
  handoffStatus?: 'pending' | 'verified';
  cancelReason?: string;
  cancelledBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPopulated extends Omit<Order, 'buyer' | 'seller'> {
  buyer: {
    _id: string;
    name: string;
    avatar?: string;
    phone: string;
    email: string;
  };
  seller: Store;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending Payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-moss-100 text-moss-700',
  confirmed: 'bg-earth-200 text-earth-700',
  ready: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  disputed: 'bg-orange-100 text-orange-700',
};

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'momo_mtn', label: 'MTN Mobile Money', icon: '📱' },
  { value: 'momo_vodafone', label: 'Vodafone Cash', icon: '📱' },
  { value: 'momo_airteltigo', label: 'AirtelTigo Money', icon: '📱' },
  { value: 'card', label: 'Debit/Credit Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'cash_on_delivery', label: 'Cash on Meetup', icon: '🤝' },
];

// Message / Chat types
export type MessageType = 'text' | 'image' | 'system';

export interface Message {
  _id: string;
  conversation: string;
  sender: string | { _id: string; name: string; avatar?: string };
  content: string;
  type: MessageType;
  offer?: {
    amount: number;
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
  };
  quickReplyLabel?: string;
  attachments?: { url: string; mimeType?: string; name?: string }[];
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MessagePopulated extends Omit<Message, 'sender'> {
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

export interface Conversation {
  _id: string;
  participants: {
    _id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
  }[];
  product?: {
    _id: string;
    title: string;
    price: number;
    images: ProductImage[];
    status: string;
  };
  lastMessage?: {
    _id: string;
    content: string;
    sender: string;
    type: MessageType;
    createdAt: string;
  };
  unreadCount?: number;
  updatedAt: string;
  createdAt: string;
}

// Review types
export interface Review {
  _id: string;
  order: string;
  product: string;
  reviewer: string;
  seller: string;
  rating: number;
  comment: string;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPopulated extends Omit<Review, 'reviewer' | 'seller' | 'product'> {
  reviewer: {
    _id: string;
    name: string;
    avatar?: string;
  };
  seller: {
    _id: string;
    name: string;
    avatar?: string;
  };
  product: {
    _id: string;
    title: string;
    images: ProductImage[];
  };
}

export interface SellerRating {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

// Notification types
export type NotificationType =
  | 'order_placed'
  | 'order_paid'
  | 'order_confirmed'
  | 'order_ready'
  | 'order_completed'
  | 'order_cancelled'
  | 'new_message'
  | 'new_review'
  | 'review_reply'
  | 'product_sold'
  | 'system'
  | 'price_drop'
  | 'price_increase';

export interface NotificationItem {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_placed: 'New Order',
  order_paid: 'Payment Received',
  order_confirmed: 'Order Confirmed',
  order_ready: 'Order Ready',
  order_completed: 'Order Completed',
  order_cancelled: 'Order Cancelled',
  new_message: 'New Message',
  new_review: 'New Review',
  review_reply: 'Review Reply',
  product_sold: 'Product Sold',
  system: 'System',
  price_drop: 'Price Drop Alert',
  price_increase: 'Price Increase Alert',
};

// Pulse / Activity types
export type ActivityType = 'listing_created' | 'order_fulfilled' | 'user_verified' | 'coupon_created';

export interface Activity {
  _id: string;
  type: ActivityType;
  user: string | { _id: string; name: string; avatar?: string };
  product?: string;
  order?: string;
  metadata: {
    userName: string;
    productTitle?: string;
    location?: string;
    amount?: number;
  };
  createdAt: string;
}
