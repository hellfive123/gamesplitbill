import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { normalizeVNDAmount } from '@/utils/currencyUtils';

export interface TransactionFormProps {
  onSuccess: () => void;
}

const TransactionForm = ({ onSuccess }: TransactionFormProps) => {
  const { toast } = useToast();
  const [originalPrice, setOriginalPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const original = normalizeVNDAmount(originalPrice);
      const selling = normalizeVNDAmount(sellingPrice);

      if (isNaN(original) || isNaN(selling)) {
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

      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            original_price: original,
            selling_price: selling,
            profit,
            profit_per_person: profitPerPerson,
            note: note.trim() || null
          }
        ]);

      if (error) throw error;

      setOriginalPrice("");
      setSellingPrice("");
      setNote("");
      onSuccess();

      toast({
        title: "Thành công",
        description: "Đã thêm giao dịch mới",
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm giao dịch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Giá gốc</label>
          <Input
            type="text"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            placeholder="Nhập giá gốc"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Giá bán</label>
          <Input
            type="text"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="Nhập giá bán"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ghi chú</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú về tài khoản"
            disabled={isLoading}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Đang thêm..." : "Thêm giao dịch"}
      </Button>
    </form>
  );
};

export default TransactionForm;
