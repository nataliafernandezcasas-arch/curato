// Fixed darkened backdrop for the recruiter dashboard, matching the other
// dashboards. Content scrolls over a static, heavily darkened image.
export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/flor-bg.jpg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-charcoal-deep/70" />
      </div>
      {children}
    </div>
  );
}
