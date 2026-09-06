import FloralBackdrop from "../floral-backdrop";

// The flower sits behind the recruiter dashboard, matching the other two.
// FloralBackdrop owns the motion.
export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <FloralBackdrop />
      {children}
    </div>
  );
}
