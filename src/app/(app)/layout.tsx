import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:pl-56">
      <Nav />
      <div className="mx-auto max-w-3xl px-4 pt-8 pb-28 md:pb-10">{children}</div>
    </div>
  );
}
