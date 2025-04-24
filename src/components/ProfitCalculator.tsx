import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import Statistics from './Statistics';
import { useTheme } from '@/providers/ThemeProvider';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import DeleteTransactions from './DeleteTransactions';

interface Transaction {
  id: string;
  original_price: number;
  selling_price: number;
  profit: number;
  profit_per_person: number;
  note?: string;
  created_at: Date;
}

const ProfitCalculator = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchTransactions();

    // Thiết lập subscription realtime
    const subscription = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Lắng nghe tất cả các sự kiện (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Realtime change received:', payload);
          
          // Thêm delay nhỏ để đảm bảo dữ liệu đã được cập nhật
          setTimeout(() => {
            fetchTransactions();
          }, 100);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscription established');
        } else if (status === 'CLOSED') {
          console.log('Realtime subscription closed');
          // Thử kết nối lại sau 5 giây
          setTimeout(() => {
            subscription.subscribe();
          }, 5000);
        }
      });

    // Cleanup subscription khi component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransactions(data.map((t: any) => ({
          ...t,
          created_at: new Date(t.created_at)
        })));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu giao dịch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalForCuong = () => {
    return transactions.reduce((sum, t) => sum + t.original_price + t.profit_per_person, 0);
  };

  const calculateTotalForLong = () => {
    return transactions.reduce((sum, t) => sum + t.profit_per_person, 0);
  };

  const filteredTransactions = transactions.filter(t => {
    if (!dateFilter) return true;
    const transactionDate = new Date(t.created_at).toLocaleDateString();
    return transactionDate === new Date(dateFilter).toLocaleDateString();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="p-4 md:p-6 shadow-2xl rounded-2xl border-0 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70">
          <div className="flex items-center justify-between mb-4 md:mb-8">
            <h1 className="text-xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
              Tính Tiền Lời
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <TransactionForm 
            onSuccess={fetchTransactions}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </Card>

        <DeleteTransactions onSuccess={fetchTransactions} />

        {transactions.length > 0 && (
          <Card className="p-4 md:p-6 shadow-2xl rounded-2xl border-0 backdrop-blur-sm bg-white/70 dark:bg-gray-800/70">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-2 md:gap-4">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Tổng Kết
              </h2>
              <div className="grid grid-cols-2 gap-2 md:gap-4 w-full md:w-auto">
                <div className="text-right">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Tổng tiền Cường</p>
                  <p className="text-base md:text-lg font-semibold text-purple-600 dark:text-purple-400">
                    {calculateTotalForCuong().toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">(Gốc + Lời/2)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Tổng tiền Long</p>
                  <p className="text-base md:text-lg font-semibold text-pink-600 dark:text-pink-400">
                    {calculateTotalForLong().toLocaleString('vi-VN')} VNĐ
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">(Lời/2)</p>
                </div>
              </div>
            </div>

            <TransactionList 
              transactions={filteredTransactions} 
              onDeleteSuccess={fetchTransactions}
            />
          </Card>
        )}

        {transactions.length > 0 && <Statistics transactions={transactions} />}
      </div>
    </div>
  );
};

export default ProfitCalculator;
