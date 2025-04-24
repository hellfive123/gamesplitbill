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
      
      setIsLoading(true);
      
      try {
        // Thêm timeout để tránh lỗi kết nối
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

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

        clearTimeout(timeoutId);

        if (error) {
          console.error('Supabase error:', error);
          
          // Kiểm tra nếu lỗi là do kết nối
          if (error.message.includes('Failed to fetch') || 
              error.message.includes('Error: 201') || 
              error.message.includes('ERR_INTERNET_DISCONNECTED') ||
              error.message.includes('AbortError')) {
            
            // Kiểm tra xem có phải đang chạy localhost không
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1';

            if (isLocalhost) {
              toast({
                title: "Thông báo",
                description: "Đang chạy trên localhost. Vui lòng kiểm tra kết nối internet và khởi động lại server nếu cần.",
                variant: "default",
              });
            } else {
              toast({
                title: "Lỗi kết nối",
                description: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet của bạn.",
                variant: "destructive",
              });
            }
            
            // Thử tải lại danh sách giao dịch
            onSuccess();
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

        // Reset form và hiển thị thông báo thành công
        setOriginalPrice("");
        setSellingPrice("");
        setNote("");
        
        // Gọi onSuccess trước khi hiển thị thông báo
        onSuccess();
        
        // Kiểm tra xem có phải đang chạy localhost không
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';

        if (isLocalhost) {
          toast({
            title: "Giao dịch thành công (Localhost)",
            description: `Đã thêm giao dịch với lợi nhuận: ${profit.toLocaleString('vi-VN')} VNĐ`,
          });
        } else {
          toast({
            title: "Giao dịch thành công",
            description: `Đã thêm giao dịch với lợi nhuận: ${profit.toLocaleString('vi-VN')} VNĐ`,
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        
        // Kiểm tra nếu lỗi là do mất kết nối
        if (error.message?.includes('ERR_INTERNET_DISCONNECTED') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('AbortError')) {
          
          const isLocalhost = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';

          if (isLocalhost) {
            toast({
              title: "Lỗi kết nối (Localhost)",
              description: "Vui lòng kiểm tra kết nối internet và khởi động lại server nếu cần",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Lỗi kết nối",
              description: "Vui lòng kiểm tra kết nối internet của bạn",
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Lỗi không xác định",
            description: "Đã xảy ra lỗi không mong muốn",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Lỗi không xác định",
        description: "Đã xảy ra lỗi không mong muốn",
        variant: "destructive",
      });
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
