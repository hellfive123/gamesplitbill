import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Edit2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { normalizeVNDAmount } from '@/utils/currencyUtils';

interface Transaction {
  id: string;
  created_at: Date;
  original_price: number;
  selling_price: number;
  profit: number;
  profit_per_person: number;
  note?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteSuccess: () => void;
}

interface TransactionStats {
  today: number;
  thisMonth: number;
  thisYear: number;
  total: number;
}

const ITEMS_PER_PAGE = 10; // Số lượng giao dịch trên mỗi trang

const TransactionList = ({ transactions, onDeleteSuccess }: TransactionListProps) => {
  const { toast } = useToast();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editOriginalPrice, setEditOriginalPrice] = useState("");
  const [editSellingPrice, setEditSellingPrice] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

  // Lấy danh sách giao dịch cho trang hiện tại
  const getCurrentPageTransactions = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return transactions.slice(startIndex, endIndex);
  };

  // Xử lý chuyển trang
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const calculateStats = (): TransactionStats => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const thisYear = now.getFullYear().toString();

    return transactions.reduce((stats, t) => {
      const transDate = new Date(t.created_at);
      const transDateStr = transDate.toISOString().split('T')[0];
      const transMonth = transDate.getFullYear() + '-' + String(transDate.getMonth() + 1).padStart(2, '0');
      const transYear = transDate.getFullYear().toString();

      return {
        today: stats.today + (transDateStr === today ? 1 : 0),
        thisMonth: stats.thisMonth + (transMonth === thisMonth ? 1 : 0),
        thisYear: stats.thisYear + (transYear === thisYear ? 1 : 0),
        total: stats.total + 1
      };
    }, { today: 0, thisMonth: 0, thisYear: 0, total: 0 });
  };

  const stats = calculateStats();

  const handleDelete = async (id: string) => {
    try {
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('ERR_INTERNET_DISCONNECTED')) {
          
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
      toast({
        title: "Lỗi không xác định",
        description: "Đã xảy ra lỗi không mong muốn",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditOriginalPrice(transaction.original_price.toString());
    setEditSellingPrice(transaction.selling_price.toString());
    setEditNote(transaction.note || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    try {
      const original = normalizeVNDAmount(editOriginalPrice);
      const selling = normalizeVNDAmount(editSellingPrice);

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
        .update({
          original_price: original,
          selling_price: selling,
          profit,
          profit_per_person: profitPerPerson,
          note: editNote.trim() || null
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      setIsEditing(false);
      onDeleteSuccess(); // Sử dụng callback này để refresh danh sách

      toast({
        title: "Thành công",
        description: "Đã cập nhật giao dịch",
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật giao dịch",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20">
          <div className="text-sm text-gray-600 dark:text-gray-400">Hôm nay</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.today}</div>
        </div>
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tháng này</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.thisMonth}</div>
        </div>
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="text-sm text-gray-600 dark:text-gray-400">Năm nay</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.thisYear}</div>
        </div>
        <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20">
          <div className="text-sm text-gray-600 dark:text-gray-400">Tổng cộng</div>
          <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.total}</div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table className="rounded-xl overflow-hidden w-full">
          <TableHeader className="bg-purple-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="text-xs md:text-sm">Thời gian</TableHead>
              <TableHead className="text-xs md:text-sm">Giá gốc</TableHead>
              <TableHead className="text-xs md:text-sm">Giá bán</TableHead>
              <TableHead className="text-xs md:text-sm">Lợi nhuận</TableHead>
              <TableHead className="text-xs md:text-sm">Ghi chú</TableHead>
              <TableHead className="text-xs md:text-sm w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageTransactions().map((t) => (
              <TableRow key={t.id} className="hover:bg-purple-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <TableCell className="whitespace-nowrap text-xs md:text-sm text-gray-600 dark:text-gray-400 py-2 md:py-4">
                  {new Date(t.created_at).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
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
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => handleEdit(t)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa giao dịch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá gốc</label>
              <Input
                type="number"
                value={editOriginalPrice}
                onChange={(e) => setEditOriginalPrice(e.target.value)}
                placeholder="Nhập giá gốc"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Giá bán</label>
              <Input
                type="number"
                value={editSellingPrice}
                onChange={(e) => setEditSellingPrice(e.target.value)}
                placeholder="Nhập giá bán"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú</label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ghi chú về tài khoản"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionList;
