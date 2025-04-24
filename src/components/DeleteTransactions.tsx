import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Trash2, Calendar, Clock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeleteTransactionsProps {
  onSuccess: () => void;
}

const DeleteTransactions = ({ onSuccess }: DeleteTransactionsProps) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [deleteMode, setDeleteMode] = useState<"date" | "time">("date");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!date) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn ngày",
        variant: "destructive",
      });
      return;
    }

    if (deleteMode === "time" && !time) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn giờ",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let query = supabase
        .from('transactions')
        .delete();

      // Xây dựng điều kiện xóa dựa trên chế độ
      if (deleteMode === "date") {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());
      } else {
        const [hours, minutes] = time.split(':').map(Number);
        const targetDate = new Date(date);
        targetDate.setHours(hours, minutes, 0, 0);

        query = query.eq('created_at', targetDate.toISOString());
      }

      const { error } = await query;

      if (error) throw error;

      toast({
        title: "Thành công",
        description: deleteMode === "date" 
          ? `Đã xóa tất cả giao dịch trong ngày ${date}`
          : `Đã xóa giao dịch lúc ${time} ngày ${date}`,
      });

      setDate("");
      setTime("");
      onSuccess();
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa giao dịch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center gap-2">
        <Trash2 className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-semibold">Xóa Giao Dịch</h2>
      </div>

      <div className="space-y-4">
        <Select
          value={deleteMode}
          onValueChange={(value: "date" | "time") => setDeleteMode(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn chế độ xóa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Xóa theo ngày</span>
              </div>
            </SelectItem>
            <SelectItem value="time">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Xóa theo giờ</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ngày</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>

          {deleteMode === "time" && (
            <div>
              <label className="block text-sm font-medium mb-2">Giờ</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>

        <Button
          onClick={handleDelete}
          variant="destructive"
          className="w-full"
          disabled={isLoading || !date || (deleteMode === "time" && !time)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isLoading ? "Đang xóa..." : "Xóa Giao Dịch"}
        </Button>
      </div>
    </div>
  );
};

export default DeleteTransactions; 