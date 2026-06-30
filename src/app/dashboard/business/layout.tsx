// Fixed flower backdrop for the maison dashboard, matching the storyteller one:
// content scrolls over a static, darkened image. Darkened enough that the
// dashboard text and cards stay perfectly readable.
export default function BusinessLayout({ children }: { children: React.ReactNode }) {
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
