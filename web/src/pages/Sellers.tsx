import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';
import { productService } from '../services/product.service';
import { LoadingSpinner } from '../components/ui';
import { Star, Verified, ShoppingBag, ArrowRight, Search, Trophy } from 'lucide-react';

const SellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    productService.getTopSellers(20)
      .then(res => {
        if (res.success) setSellers(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredSellers = sellers.filter(s => 
    s.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.seller?.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BulletinLayout 
      title="Elite Merchants" 
      subtitle="The most trusted and active sellers in the QUADS ecosystem."
      section="08"
    >
      <BulletinSection>
        {/* Search & Stats Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-30" />
            <input 
              type="text"
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-4 border-black bg-white dark:bg-black p-4 pl-12 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:ring-0 shadow-[4px_4px_0_0_#000]"
            />
          </div>
          
          <div className="flex gap-4">
             <div className="border-4 border-black bg-[#fffacd] dark:bg-yellow-900/20 px-6 py-2 shadow-[4px_4px_0_0_#000]">
                <div className="text-[8px] font-black uppercase tracking-widest opacity-40">Active Sellers</div>
                <div className="text-xl font-black">{sellers.length}</div>
             </div>
             <div className="border-4 border-black bg-[#e0f2f7] dark:bg-sky-900/20 px-6 py-2 shadow-[4px_4px_0_0_#000]">
                <div className="text-[8px] font-black uppercase tracking-widest opacity-40">Verified</div>
                <div className="text-xl font-black">{sellers.filter(s => s.seller?.isVerified).length}</div>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner text="Consulting the leaderboard..." />
          </div>
        ) : filteredSellers.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredSellers.map((entry, idx) => (
              <Link 
                key={entry.seller?._id} 
                to={`/sellers/${entry.seller?._id}`}
                className="group relative"
              >
                <div className="border-4 border-black bg-white dark:bg-black p-6 shadow-[10px_10px_0_0_#000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all h-full">
                  
                  {/* Rank Badge */}
                  {idx < 3 && (
                    <div className="absolute -top-4 -left-4 bg-black text-white w-10 h-10 flex items-center justify-center font-black rotate-[-12deg] z-10 border-2 border-white">
                       {idx === 0 ? <Trophy className="h-5 w-5 text-yellow-400" /> : idx + 1}
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 border-2 border-black overflow-hidden bg-gray-100 flex-shrink-0">
                       <img 
                        src={entry.seller?.avatar || 'https://placehold.co/100'} 
                        alt={entry.seller?.name} 
                        className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black uppercase tracking-tight text-lg truncate">
                          {entry.seller?.storeName || entry.seller?.name}
                        </h3>
                        {entry.seller?.isVerified && <Verified className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                      </div>
                      <div className="text-[10px] font-bold opacity-40 truncate uppercase tracking-widest">
                        {entry.seller?.brandName || 'Independent Merchant'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t-2 border-black/5 pt-4">
                     <div>
                        <div className="text-[8px] font-black uppercase opacity-40">Total Revenue</div>
                        <div className="font-black text-emerald-600">GHS {entry.totalRevenue.toLocaleString()}</div>
                     </div>
                     <div>
                        <div className="text-[8px] font-black uppercase opacity-40">Success Rate</div>
                        <div className="font-black">100%</div>
                     </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                     <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(s => <Star key={s} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                        <span className="text-[10px] font-black ml-1">5.0</span>
                     </div>
                     <div className="text-[10px] font-black uppercase underline group-hover:text-[#ff6b6b]">
                        View Store →
                     </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-4 border-dashed border-black/10">
             <ShoppingBag className="h-12 w-12 mx-auto opacity-20 mb-4" />
             <p className="font-black uppercase tracking-widest opacity-40">No merchants found matching your search</p>
          </div>
        )}
      </BulletinSection>

      {/* Merchant Call to Action */}
      <BulletinSection bgColor="bg-black text-white" title="Join the Elite" subtitle="Apply for Merchant Status">
         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left">
               <p className="text-xl font-medium leading-tight opacity-70">
                 Ready to turn your side-hustle into a verified campus business? Join 50+ students already earning on QUADS.
               </p>
            </div>
            <Link to="/seller/onboarding" className="bg-white text-black px-10 py-5 font-black uppercase tracking-widest shadow-[8px_8px_0_0_#ff6b6b] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3">
               Start Selling <ArrowRight className="h-4 w-4" />
            </Link>
         </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default SellersPage;
