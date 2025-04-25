import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, RefreshCw } from "lucide-react";
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
  const [resetDate, setResetDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchResetDate();
    fetchTransactions();

    // Thiết lập subscription realtime cho cả transactions và reset_dates
    const channel = supabase.channel('db-changes', {
      config: {
        broadcast: { self: true },
        presence: { key: '' },
      },
    });
    
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        async (payload) => {
          console.log('Realtime change received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT': {
              const newTransaction: Transaction = {
                id: payload.new.id,
                created_at: new Date(payload.new.created_at),
                original_price: payload.new.original_price,
                selling_price: payload.new.selling_price,
                profit: payload.new.profit,
                profit_per_person: payload.new.profit_per_person,
                note: payload.new.note
              };
              setTransactions(prev => [newTransaction, ...prev]);
              break;
            }
              
            case 'DELETE':
              setTransactions(prev => 
                prev.filter(t => t.id !== payload.old.id)
              );
              break;
              
            case 'UPDATE': {
              const updatedTransaction: Transaction = {
                id: payload.new.id,
                created_at: new Date(payload.new.created_at),
                original_price: payload.new.original_price,
                selling_price: payload.new.selling_price,
                profit: payload.new.profit,
                profit_per_person: payload.new.profit_per_person,
                note: payload.new.note
              };
              setTransactions(prev =>
                prev.map(t => t.id === payload.new.id ? updatedTransaction : t)
              );
              break;
            }
              
            default:
              await fetchTransactions();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reset_dates'
        },
        async (payload) => {
          console.log('Reset date change received:', payload);
          await fetchResetDate();
        }
      )
      .subscribe(async (status) => {
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to changes');
          await fetchTransactions();
          await fetchResetDate();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.log('Subscription closed or error, attempting to reconnect...');
          setTimeout(() => {
            channel.subscribe();
          }, 2000);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchResetDate = async () => {
    try {
      const { data, error } = await supabase
        .from('reset_dates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching reset date:', error);
        return;
      }

      if (data && data.length > 0) {
        setResetDate(new Date(data[0].created_at));
      } else {
        setResetDate(null);
      }
    } catch (error) {
      console.error('Unexpected error fetching reset date:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      // Đảm bảo resetDate đã được fetch trước
      await fetchResetDate();
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        toast({
          title: "Lỗi",
          description: "Không thể tải dữ liệu giao dịch",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Chuyển đổi created_at thành Date object
        const formattedData = data.map((t: any) => ({
          ...t,
          created_at: new Date(t.created_at)
        }));
        
        setTransactions(formattedData);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Lỗi không xác định",
        description: "Đã xảy ra lỗi khi tải dữ liệu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalForCuong = () => {
    if (!resetDate) {
      return transactions.reduce((sum, t) => sum + t.original_price + t.profit_per_person, 0);
    }
    
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= resetDate;
      })
      .reduce((sum, t) => sum + t.original_price + t.profit_per_person, 0);
  };

  const calculateTotalForLong = () => {
    if (!resetDate) {
      return transactions.reduce((sum, t) => sum + t.profit_per_person, 0);
    }
    
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate >= resetDate;
      })
      .reduce((sum, t) => sum + t.profit_per_person, 0);
  };

  const handleResetTotals = async () => {
    try {
      const { error } = await supabase
        .from('reset_dates')
        .insert([{ created_at: new Date().toISOString() }]);

      if (error) {
        console.error('Error resetting totals:', error);
        toast({
          title: "Lỗi",
          description: "Không thể reset tổng tiền",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Đã reset tổng tiền",
        description: "Tổng tiền Cường và Long đã được reset về 0",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Lỗi không xác định",
        description: "Đã xảy ra lỗi khi reset tổng tiền",
        variant: "destructive",
      });
    }
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
                <div className="col-span-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetTotals}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reset Tổng Tiền
                  </Button>
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
