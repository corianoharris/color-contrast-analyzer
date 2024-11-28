// app/page.tsx
'use client';

import ContrastValidator from "@/components/ColorContrastValidator";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between pt-20 pl-5 pr-5 pb-10">
      <ContrastValidator />
    </main>
  );
}
