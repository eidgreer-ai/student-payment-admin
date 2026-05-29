import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { ChevronLeft } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

const MONTHS = [
  { num: 8, name: "8" },
  { num: 9, name: "9" },
  { num: 10, name: "10" },
  { num: 11, name: "11" },
  { num: 12, name: "12" },
  { num: 1, name: "1" },
  { num: 2, name: "2" },
  { num: 3, name: "3" },
  { num: 4, name: "4" },
  { num: 5, name: "5" },
  { num: 6, name: "6" },
];

export default function AdvancedAnalytics() {
  const [, setLocation] = useLocation();
  const [currentYear] = useState(new Date().getFullYear());

  const groupsQuery = trpc.groups.list.useQuery();
  const paymentsQuery = trpc.payments.list.useQuery();

  if (groupsQuery.isLoading || paymentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const groups = groupsQuery.data || [];
  const payments = paymentsQuery.data || [];

  // Calculate monthly data
  const monthlyData = MONTHS.map((month) => {
    const monthPayments = payments.filter(
      (p: any) => p.month === month.num && p.year === currentYear
    );
    const paidAmount = monthPayments
      .filter((p: any) => p.isPaid)
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const unpaidAmount = monthPayments
      .filter((p: any) => !p.isPaid)
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const paidCount = monthPayments.filter((p: any) => p.isPaid).length;
    const unpaidCount = monthPayments.filter((p: any) => !p.isPaid).length;

    return {
      month: month.name,
      paid: paidAmount,
      unpaid: unpaidAmount,
      paidCount,
      unpaidCount,
      total: paidAmount + unpaidAmount,
    };
  });

  // Calculate group performance
  const groupPerformance = groups.map((group: any) => {
    const groupPayments = payments.filter((p: any) => {
      const student = payments.find((pay: any) => pay.studentId === p.studentId);
      return student;
    });
    const paidAmount = groupPayments
      .filter((p: any) => p.isPaid)
      .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    const totalAmount = groupPayments.reduce(
      (sum: number, p: any) => sum + parseFloat(p.amount || 0),
      0
    );
    const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return {
      name: group.name,
      paid: paidAmount,
      total: totalAmount,
      percentage: Math.round(percentage),
    };
  });

  // Calculate collection trend
  const collectionTrend = monthlyData.map((m) => ({
    month: m.month,
    collection: m.paid,
    target: 5000, // Target example
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/accounting")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الإحصائيات المتقدمة</h1>
            <p className="text-slate-600 dark:text-slate-300">تحليل شامل للأداء والاتجاهات</p>
          </div>
        </div>

        {/* Monthly Collection Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>اتجاه التحصيل الشهري مقابل الهدف</CardTitle>
            <CardDescription>مقارنة التحصيل الفعلي مع الهدف المستهدف</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={collectionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="collection" fill="#3b82f6" name="التحصيل الفعلي" />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#ef4444"
                  name="الهدف المستهدف"
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Paid vs Unpaid Trend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>اتجاه المدفوعات والمتأخرات</CardTitle>
            <CardDescription>المبالغ المسددة والمتأخرة شهرياً</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="paid"
                  stackId="1"
                  fill="#10b981"
                  name="المبالغ المسددة"
                />
                <Area
                  type="monotone"
                  dataKey="unpaid"
                  stackId="1"
                  fill="#ef4444"
                  name="المبالغ المتأخرة"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Group Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>أداء المجموعات</CardTitle>
            <CardDescription>نسبة التحصيل لكل مجموعة</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={groupPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="paid" fill="#3b82f6" name="المبلغ المسدد" />
                <Bar dataKey="total" fill="#cbd5e1" name="الإجمالي" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Percentage */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupPerformance.map((group: any) => (
            <Card key={group.name}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{group.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{group.percentage}%</div>
                <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${group.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  {group.paid.toFixed(2)} / {group.total.toFixed(2)} ريال
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
