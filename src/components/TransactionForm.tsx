import React, { useState } from 'react';
import { normalizeVNDAmount } from '@/utils/currencyUtils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface TransactionFormProps {
  onSuccess: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const TransactionForm = ({ onSuccess, isLoading, setIsLoading }: TransactionFormProps) => {
  const [originalPrice, setOriginalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const calculateProfit = async () => {
    try {
      // Kiểm tra kết nối internet
      if (!navigator.onLine) {
        toast({
          title: "Lỗi kết nối",
          description: "Vui lòng kiểm tra kết nối internet của bạn",
          variant: "destructive",
        });
        return;
      }

      // Kiểm tra dữ liệu đầu vào
      if (!originalPrice || !sellingPrice) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập đầy đủ giá gốc và giá bán",
          variant: "destructive",
        });
        return;
      }

      const original = normalizeVNDAmount(originalPrice);
      const selling = normalizeVNDAmount(sellingPrice);
      
      if (isNaN(original) || isNaN(selling)) {
        console.error('Invalid input values:', { original, selling });
        toast({
          title: "Lỗi",
          description: "Giá trị nhập vào không hợp lệ",
          variant: "destructive",
        });
        return;
      }

      if (selling <= original) {
        toast({
          title: "Lỗi",
          description: "Giá bán phải lớn hơn giá gốc",
          variant: "destructive",
        });
        return;
      }
      
      const profit = selling - original;
      const profitPerPerson = profit / 2;
      
      console.log('Attempting to save transaction with values:', {
        original_price: original,
        selling_price: selling,
        profit,
        profit_per_person: profitPerPerson,
        note: note.trim() || null
      });
      
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          original_price: original,
          selling_price: selling,
          profit,
          profit_per_person: profitPerPerson,
          note: note.trim() || null
        })
        .select();

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Kiểm tra nếu lỗi là do kết nối nhưng giao dịch đã được lưu
        if (error.message.includes('Failed to fetch')) {
          // Thử tải lại danh sách giao dịch
          onSuccess();
          toast({
            title: "Thông báo",
            description: "Giao dịch có thể đã được lưu. Đang tải lại danh sách...",
          });
          return;
        }

        let errorMessage = "Không thể lưu giao dịch";
        
        if (error.code === '23505') {
          errorMessage = "Giao dịch đã tồn tại";
        } else if (error.code === '23514') {
          errorMessage = "Dữ liệu không hợp lệ";
        } else if (error.code === '42501') {
          errorMessage = "Không có quyền thực hiện thao tác này";
        }

        toast({
          title: "Lỗi",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Nếu có data trả về, giao dịch đã được lưu thành công
      if (data && data.length > 0) {
        console.log('Transaction saved successfully:', data);
        
        setOriginalPrice("");
        setSellingPrice("");
        setNote("");
        onSuccess();
        
        toast({
          title: "Giao dịch thành công",
          description: `Đã thêm giao dịch với lợi nhuận: ${profit.toLocaleString('vi-VN')} VNĐ`,
        });
      } else {
        // Nếu không có data nhưng cũng không có lỗi, thử tải lại danh sách
        onSuccess();
        toast({
          title: "Thông báo",
          description: "Đang tải lại danh sách giao dịch...",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Lỗi không xác định",
        description: "Đã xảy ra lỗi không mong muốn",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Giá gốc</label>
          <Input
            type="number"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="Nhập giá gốc"
            className="w-full focus:ring-2 focus:ring-purple-300 transition-all duration-300"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Giá bán</label>
          <Input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="Nhập giá bán"
            className="w-full focus:ring-2 focus:ring-pink-300 transition-all duration-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Ghi chú</label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú về tài khoản (ví dụ: Tên game, level...)"
          className="w-full focus:ring-2 focus:ring-purple-300 transition-all duration-300"
        />
      </div>

      <Button 
        onClick={calculateProfit} 
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 group"
        disabled={!originalPrice || !sellingPrice || isLoading}
      >
        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
        {isLoading ? "Đang lưu..." : "Thêm Giao Dịch"}
      </Button>
    </div>
  );
};

export default TransactionForm;
