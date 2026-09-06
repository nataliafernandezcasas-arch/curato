import FloralBackdrop from "../floral-backdrop";

// The flower sits behind the whole storyteller dashboard, darkened enough that
// the text and cards stay readable. FloralBackdrop owns the motion.
export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <FloralBackdrop />
      {children}
    </div>
  );
}
