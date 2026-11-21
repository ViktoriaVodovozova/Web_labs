'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import StudentFilters from './StudentFilters';
import StudentsSkeleton from './StudentsSkeleton';

export default function StudentsView({ children }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const navigate = (url) => {
    startTransition(() => {
      router.push(url, { scroll: false });
    });
  };

  return (
    <>
      <StudentFilters navigate={navigate} />
      {isPending ? <StudentsSkeleton /> : children}
    </>
  );
}
