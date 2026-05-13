
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { BulletinLayout, BulletinSection } from '../components/layout/BulletinLayout';

const NotFoundPage: React.FC = () => {
  return (
    <BulletinLayout title="Page Not Found" subtitle="Error 404" section="XX">
      <BulletinSection bgColor="bg-[#faf8f5]">
        <div className="border border-black bg-[#fffacd] p-12 text-center shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
             style={{ transform: 'rotate(-0.5deg)' }}>
          <div className="text-[10px] uppercase tracking-wider opacity-40 mb-4">Error</div>
          <div className="text-[8rem] leading-none font-bold opacity-20 select-none">
            404
          </div>
          <div className="text-2xl font-bold mb-4 -mt-4">
            Page Not Found
          </div>
          <div className="text-[12px] opacity-60 mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/"
              className="border border-black bg-black px-4 py-2 text-[10px] font-bold uppercase text-white shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:bg-white hover:text-black"
            >
              <Home className="inline-block h-4 w-4 mr-1" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="border border-black bg-white px-4 py-2 text-[10px] font-bold uppercase shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            >
              <ArrowLeft className="inline-block h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default NotFoundPage;