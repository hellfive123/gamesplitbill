import React, { useState } from 'react';
import { normalizeVNDAmount } from '@/utils/currencyUtils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { PriceSuggestions } from "@/components/ui/price-suggestions";

interface TransactionFormProps {
  onSuccess: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const TransactionForm = ({ onSuccess, isLoading, setIsLoading }: TransactionFormProps) => {
  const [originalPrice, setOriginalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [note, setNote] = useState("");
  const [showOriginalSuggestions, setShowOriginalSuggestions] = useState(false);
  const [showSellingSuggestions, setShowSellingSuggestions] = useState(false);
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
      const { error } = await supabase
        .from('transactions')
        .insert({
          original_price: original,
          selling_price: selling,
          profit,
          profit_per_person: profitPerPerson,
          note: note.trim() || null
          })
          .select();

      if (error) throw error;

        // Reset form
      setOriginalPrice("");
      setSellingPrice("");
      setNote("");
      
      toast({
          title: "Thành công",
          description: "Đã thêm giao dịch mới",
        });

        onSuccess();
      } catch (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Lỗi",
          description: "Không thể lưu giao dịch",
          variant: "destructive",
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

  const handleOriginalPriceChange = (value: string) => {
    setOriginalPrice(value);
    setShowOriginalSuggestions(!!value && !isNaN(parseFloat(value)));
  };

  const handleSellingPriceChange = (value: string) => {
    setSellingPrice(value);
    setShowSellingSuggestions(!!value && !isNaN(parseFloat(value)));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium mb-2">
            Giá gốc (nghìn VNĐ)
          </label>
          <Input
            type="number"
            value={originalPrice}
            onChange={(e) => handleOriginalPriceChange(e.target.value)}
            onFocus={() => setShowOriginalSuggestions(true)}
            onBlur={() => setTimeout(() => setShowOriginalSuggestions(false), 200)}
            placeholder="Nhập giá gốc"
            className="w-full"
          />
          {showOriginalSuggestions && (
            <PriceSuggestions
              value={originalPrice}
              onSelect={(value) => {
                setOriginalPrice(value);
                setShowOriginalSuggestions(false);
              }}
            />
          )}
        </div>
        
        <div className="relative">
          <label className="block text-sm font-medium mb-2">
            Giá bán (nghìn VNĐ)
          </label>
          <Input
            type="number"
            value={sellingPrice}
            onChange={(e) => handleSellingPriceChange(e.target.value)}
            onFocus={() => setShowSellingSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSellingSuggestions(false), 200)}
            placeholder="Nhập giá bán"
            className="w-full"
          />
          {showSellingSuggestions && (
            <PriceSuggestions
              value={sellingPrice}
              onSelect={(value) => {
                setSellingPrice(value);
                setShowSellingSuggestions(false);
              }}
            />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Ghi chú
        </label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú về tài khoản"
          className="w-full"
        />
      </div>

      <Button 
        onClick={calculateProfit} 
        disabled={!originalPrice || !sellingPrice || isLoading}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 group"
      >
        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
        {isLoading ? "Đang lưu..." : "Thêm Giao Dịch"}
      </Button>
    </div>
  );
};

export default TransactionForm;
