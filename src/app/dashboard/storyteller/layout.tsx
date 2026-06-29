// Fixed flower backdrop for the storyteller dashboard: the content scrolls over
// a static, darkened image (parallax / scroll effect). Darkened heavily so the
// dashboard text and cards stay perfectly readable.
export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/flor-bg.jpg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-charcoal-deep/65" />
      </div>
      {children}
    </div>
  );
}
