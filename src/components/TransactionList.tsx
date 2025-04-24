
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
}

const TransactionList = ({ transactions }: TransactionListProps) => {
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionList;
