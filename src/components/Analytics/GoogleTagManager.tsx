import Script from 'next/script';
import { env } from '@/lib/env';

const GoogleTagManager = () => {
  // Don't render in development unless explicitly enabled
  if (!env.GTM_ID || (env.IS_DEVELOPMENT && !process.env.NEXT_PUBLIC_GTM_ENABLE_DEV)) {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="google-tag-manager"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${env.GTM_ID}');
          `,
        }}
      />
    </>
  );
};

export const GoogleTagManagerNoScript = () => {
  if (!env.GTM_ID || (env.IS_DEVELOPMENT && !process.env.NEXT_PUBLIC_GTM_ENABLE_DEV)) {
    return null;
  }

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${env.GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
};

export default GoogleTagManager;