// app/page.tsx
'use client';

import ContrastValidator from "@/components/ColorContrastValidator";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <ContrastValidator />
    </main>
  );
}
