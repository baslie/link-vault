import Script from "next/script";

import type { AnalyticsConfig } from "@/lib/analytics/config";

interface AnalyticsScriptsProps {
  config: AnalyticsConfig;
}

export function AnalyticsScripts({ config }: AnalyticsScriptsProps) {
  const { yandexMetrikaId, gaTrackingId } = config;
  const hasYandex = Boolean(yandexMetrikaId);
  const hasGa = Boolean(gaTrackingId);

  if (!hasYandex && !hasGa) {
    return null;
  }

  const bootstrap = `
    (function () {
      const analytics = (window.linkVaultAnalytics = window.linkVaultAnalytics || {});
      analytics.config = ${JSON.stringify({ yandexMetrikaId, gaTrackingId })};
      analytics.track = function (eventName, params) {
        if (!eventName) {
          return;
        }

        const payload = params && typeof params === 'object' ? params : {};
        ${hasGa ? "if (typeof window.gtag === 'function') { window.gtag('event', eventName, payload); }" : ""}
        ${hasYandex ? `if (typeof window.ym === 'function') { window.ym(${JSON.stringify(yandexMetrikaId)}, 'reachGoal', eventName, payload); }` : ""}
      };
      window.linkVaultTrack = analytics.track;
    })();
  `;

  return (
    <>
      {hasGa ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-setup" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaTrackingId}', { send_page_view: true });
            `}
          </Script>
        </>
      ) : null}
      {hasYandex ? (
        <>
          <Script id="yandex-metrika" strategy="afterInteractive">
            {`
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                k=e.createElement(t),a=e.getElementsByTagName(t)[0];
                k.async=1;k.src=r;a.parentNode.insertBefore(k,a);
              })(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
              ym(${yandexMetrikaId},"init",{
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                defer:true
              });
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`} alt="" className="hidden" />
          </noscript>
        </>
      ) : null}
      <Script id="link-vault-analytics" strategy="afterInteractive">
        {bootstrap}
      </Script>
    </>
  );
}
