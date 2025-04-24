import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';
import TransactionList from '@/components/TransactionList';
import TransactionForm from '@/components/TransactionForm';
import AchievementPanel from '@/components/AchievementPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch user stats
  const { data: userStats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user?.id)
    .single();

  const stats = userStats || {
    totalTransactions: 0,
    totalProfit: 0,
    highestProfit: 0,
    transactionsToday: 0,
    averageProfit: 0,
    consecutiveProfitDays: 0,
    level: 1,
    experience: 0
  };

  async function handleSuccess() {
    'use server';
    revalidatePath('/');
  }

  return (
    <main className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-4xl font-bold mb-8">Game Profit Splitter Buddy</h1>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
          <TabsTrigger value="achievements">Thành tích</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          <TransactionForm onSuccess={handleSuccess} />
          <Suspense fallback={<div>Đang tải...</div>}>
            <TransactionList
              transactions={transactions || []}
              onDeleteSuccess={handleSuccess}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="achievements">
          <Suspense fallback={<div>Đang tải...</div>}>
            <AchievementPanel stats={stats} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </main>
  );
} 