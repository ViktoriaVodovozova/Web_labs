'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RealtimeClient } from '../lib/realtime';
import { refreshStudentCache } from '../app/students/actions';

const labels = {
  STUDENT_CREATED: 'Добавлен студент',
  STUDENT_UPDATED: 'Данные студента обновлены',
  STUDENT_DELETED: 'Студент удалён',
};

export default function RealtimeListener() {
  const router = useRouter();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const client = new RealtimeClient();
    let timer;
    let refreshTimer;
    let lastSeq;

    function refresh() {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        try {
          await refreshStudentCache();
          if (!client.stopped) router.refresh();
        } catch {
          if (!client.stopped) router.refresh();
        }
      }, 250);
    }

    client.on('student.event', (event) => {
      lastSeq = event.seq;
      window.dispatchEvent(new Event('student-audit-update'));
      if (!labels[event.action]) return;
      setToast(labels[event.action]);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 3000);
      refresh();
    });
    client.on('hello', ({ user, lastSeq: latest }) => {
      if (user.role === 'ADMIN' && lastSeq !== undefined && lastSeq !== latest) {
        refresh();
        window.dispatchEvent(new Event('student-audit-update'));
      }
      lastSeq = latest;
    });
    client.on('job.update', (job) => {
      window.dispatchEvent(new CustomEvent('student-job-update', { detail: job }));
    });
    client.connect();

    return () => {
      clearTimeout(timer);
      clearTimeout(refreshTimer);
      client.close();
    };
  }, [router]);

  return toast && <div className="realtime-toast" role="status">{toast}</div>;
}
