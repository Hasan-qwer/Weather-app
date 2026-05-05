import { Suspense } from 'react';
import HomeClient from './HomeClient';

export default function HomePage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#080c14]" />}>
      <HomeClient />
    </Suspense>
  );
}
