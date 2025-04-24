import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  created_at: Date;
  original_price: number;
  selling_price: number;
  profit: number;
  note?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteSuccess: () => void;
}

const TransactionList = ({ transactions, onDeleteSuccess }: TransactionListProps) => {
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

      // Thêm timeout để tránh lỗi kết nối
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      clearTimeout(timeoutId);

      if (error) {
        console.error('Error deleting transaction:', error);
        
        // Kiểm tra nếu lỗi là do kết nối
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('ERR_INTERNET_DISCONNECTED') ||
            error.message.includes('AbortError')) {
          
          if (isLocalhost) {
            toast({
              title: "Thông báo (Localhost)",
              description: "Giao dịch có thể đã được xóa. Đang tải lại danh sách...",
              variant: "default",
            });
          } else {
            toast({
              title: "Lỗi kết nối",
              description: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet của bạn.",
              variant: "destructive",
            });
          }
          
          // Thử tải lại danh sách
          onDeleteSuccess();
          return;
        }

        toast({
          title: "Lỗi",
          description: "Không thể xóa giao dịch",
          variant: "destructive",
        });
        return;
      }

      // Gọi onDeleteSuccess trước khi hiển thị thông báo
      onDeleteSuccess();

      if (isLocalhost) {
        toast({
          title: "Xóa thành công (Localhost)",
          description: "Đã xóa giao dịch",
        });
      } else {
        toast({
          title: "Xóa thành công",
          description: "Đã xóa giao dịch",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

      if (isLocalhost) {
        toast({
          title: "Lỗi không xác định (Localhost)",
          description: "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại hoặc khởi động lại server.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lỗi không xác định",
          description: "Đã xảy ra lỗi không mong muốn",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <Table className="rounded-xl overflow-hidden w-full">
        <TableHeader className="bg-purple-50 dark:bg-gray-800">
          <TableRow>
            <TableHead className="text-xs md:text-sm">Thời gian</TableHead>
            <TableHead className="text-xs md:text-sm">Giá gốc</TableHead>
            <TableHead className="text-xs md:text-sm">Giá bán</TableHead>
            <TableHead className="text-xs md:text-sm">Lợi nhuận</TableHead>
            <TableHead className="text-xs md:text-sm">Ghi chú</TableHead>
            <TableHead className="text-xs md:text-sm w-16">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id} className="hover:bg-purple-50/50 dark:hover:bg-gray-800/50 transition-colors">
              <TableCell className="whitespace-nowrap text-xs md:text-sm text-gray-600 dark:text-gray-400 py-2 md:py-4">
                {new Date(t.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
              </TableCell>
              <TableCell className="text-xs md:text-sm py-2 md:py-4">{t.original_price.toLocaleString('vi-VN')} VNĐ</TableCell>
              <TableCell className="text-xs md:text-sm py-2 md:py-4">{t.selling_price.toLocaleString('vi-VN')} VNĐ</TableCell>
              <TableCell className="text-green-600 dark:text-green-400 font-semibold text-xs md:text-sm py-2 md:py-4">
                {t.profit.toLocaleString('vi-VN')} VNĐ
              </TableCell>
              <TableCell className="max-w-[100px] md:max-w-xs truncate text-xs md:text-sm text-gray-600 dark:text-gray-400 py-2 md:py-4">
                {t.note || "-"}
              </TableCell>
              <TableCell className="py-2 md:py-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
