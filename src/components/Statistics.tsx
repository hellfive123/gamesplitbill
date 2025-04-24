
import { Card } from "@/components/ui/card";
import { ArrowUpRight, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface StatisticsProps {
  transactions: Array<{
    created_at: Date;
    profit: number;
    profit_per_person: number;
  }>;
}

export default function Statistics({ transactions }: StatisticsProps) {
  const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
  const averageProfit = transactions.length ? totalProfit / transactions.length : 0;
  const lastMonthProfit = transactions
    .filter(t => {
      const date = new Date(t.created_at);
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      return date >= lastMonth;
    })
    .reduce((sum, t) => sum + t.profit, 0);

  const chartData = transactions
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(t => ({
      date: new Date(t.created_at).toLocaleDateString(),
      profit: t.profit
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 dark:bg-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng lợi nhuận</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {totalProfit.toLocaleString('vi-VN')} VNĐ
              </h3>
            </div>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lợi nhuận trung bình</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {averageProfit.toLocaleString('vi-VN')} VNĐ
              </h3>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6 dark:bg-gray-800">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lợi nhuận tháng trước</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {lastMonthProfit.toLocaleString('vi-VN')} VNĐ
              </h3>
            </div>
            <Calendar className="w-5 h-5 text-purple-500" />
          </div>
        </Card>
      </div>

      <Card className="p-6 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Biểu đồ lợi nhuận</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
