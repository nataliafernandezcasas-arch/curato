import FloralBackdrop from "../floral-backdrop";

// The flower sits behind the maison dashboard, matching the storyteller one,
// darkened enough that the text and cards stay readable. FloralBackdrop owns
// the motion.
export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <FloralBackdrop />
      {children}
    </div>
  );
}
