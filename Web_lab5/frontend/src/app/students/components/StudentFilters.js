'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function StudentFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [group, setGroup] = useState(searchParams.get('group') || '');
  const [isForeigner, setIsForeigner] = useState(searchParams.get('isForeigner') || '');

  const updateURL = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);

    params.set('page', '0');
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (searchParams.get('search') || '')) updateURL('search', search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="toolbar">
      <input type="search" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
      <input type="text" placeholder="Группа" value={group} onChange={e => setGroup(e.target.value)} onBlur={() => updateURL('group', group)} />
      <select value={isForeigner} onChange={e => { setIsForeigner(e.target.value); updateURL('isForeigner', e.target.value); }}>
        <option value="">Все студенты</option>
        <option value="true">Иностранцы</option>
        <option value="false">Не иностранцы</option>
      </select>
    </div>
  );
}