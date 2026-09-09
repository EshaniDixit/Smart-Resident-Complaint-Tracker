import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/lib/auth';

export default async function Home() {
  const user = await getUserFromSession();
  
  if (!user) {
    redirect('/login');
  }

  if (user.role === 'ADMIN') {
    redirect('/admin');
  } else {
    redirect('/resident');
  }
}
