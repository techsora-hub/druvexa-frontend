import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Suspense } from 'react';
import MetaPixelRouteTracker from '../components/analytics/MetaPixelRouteTracker';
import SnapPixelRouteTracker from '../components/analytics/SnapPixelRouteTracker';
import AdClickTracker from '../components/analytics/AdClickTracker';
import { parsePixelIds } from '../lib/metaPixel';
import { SITE_NAME } from '../lib/site';

export const metadata = {
  title: SITE_NAME,
  description: 'Watch series and movies — one free scene, unlock everything with a subscription.',
};

// Comma-separated — e.g. NEXT_PUBLIC_META_PIXEL_IDS="111111,222222,333333"
const META_PIXEL_IDS = parsePixelIds(process.env.NEXT_PUBLIC_META_PIXEL_IDS);

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text-hi font-body min-h-screen flex flex-col">
        <Suspense fallback={null}>
          <MetaPixelRouteTracker />
        </Suspense>
        <Suspense fallback={null}>
          <SnapPixelRouteTracker />
        </Suspense>
        <Suspense fallback={null}>
          <AdClickTracker />
        </Suspense>
        {META_PIXEL_IDS.map((id) => (
          <noscript key={id}>
            <img height="1" width="1" style={{ display: 'none' }} src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`} alt="" />
          </noscript>
        ))}
        <Navbar />
        {/* Login gating happens server-side in middleware.js. */}
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}