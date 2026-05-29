import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, DollarSign, Users, TrendingUp, AlertCircle, Download } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Accounting() {
  const [, setLocation] = useLocation();
  const [currentYear] = useState(new Date().getFullYear());
  const [searchName, setSearchName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const groupsQuery = trpc.groups.list.useQuery();
  const studentsQuery = trpc.students.list.useQuery();
  const paymentsQuery = trpc.payments.list.useQuery();
  const unpaidStudentsQuery = trpc.payments.unpaidStudents.useQuery({ year: currentYear });

  if (groupsQuery.isLoading || studentsQuery.isLoading || paymentsQuery.isLoading || unpaidStudentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const groups = groupsQuery.data || [];
  const students = studentsQuery.data || [];
  const payments = paymentsQuery.data || [];
  const unpaidStudents = unpaidStudentsQuery.data || [];

  // Calculate monthly totals from actual payments
  const monthlyTotals = MONTHS.map((month) => {
    const monthPayments = payments.filter(
      (p: any) => p.month === month.num && p.year === currentYear && p.isPaid
    );
    const total = monthPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);
    return {
      month: month.name,
      monthNum: month.num,
      total: total,
      count: monthPayments.length,
    };
  });

  // Calculate yearly total
  const yearlyTotal = monthlyTotals.reduce((sum, m) => sum + m.total, 0);

  // Filter unpaid students
  let filteredUnpaidStudents = unpaidStudents;
  if (searchName) {
    filteredUnpaidStudents = filteredUnpaidStudents.filter((item: any) =>
      item.student.name.toLowerCase().includes(searchName.toLowerCase())
    );
  }
  if (selectedGroup && selectedGroup !== "all") {
    filteredUnpaidStudents = filteredUnpaidStudents.filter((item: any) =>
      item.group.id.toString() === selectedGroup
    );
  }

  // Calculate total unpaid amount
  const totalUnpaidAmount = filteredUnpaidStudents.reduce((sum: number, item: any) => {
    const unpaidPayments = payments.filter(
      (p: any) =>
        p.studentId === item.student.id &&
        p.year === currentYear &&
        !p.isPaid
    );
    return sum + unpaidPayments.reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0);
  }, 0);

  // Group unpaid students by group
  const unpaidByGroup = groups.map((group: any) => {
    const count = filteredUnpaidStudents.filter((s: any) => s.group.id === group.id).length;
    return { name: group.name, value: count };
  }).filter((g: any) => g.value > 0);

  // Export to PDF function
  const handleExportPDF = () => {
    const content = `
تقرير الجرد والحسابات
السنة: ${currentYear}

إجمالي التحصيل السنوي: ${yearlyTotal.toFixed(2)} ج.م
عدد الطلاب غير المسددين: ${filteredUnpaidStudents.length}
إجمالي المبالغ المتأخرة: ${totalUnpaidAmount.toFixed(2)} ج.م

التفاصيل الشهرية:
${monthlyTotals.map((m) => `الشهر ${m.month}: ${m.total.toFixed(2)} ج.م (${m.count} طالب)`).join("\n")}

الطلاب غير المسددين:
${filteredUnpaidStudents.map((s: any) => `${s.student.name} - ${s.group.name} - ${s.unpaidMonths} شهور متأخرة`).join("\n")}
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accounting-report-${currentYear}.txt`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الجرد والحسابات</h1>
              <p className="text-slate-600 dark:text-slate-300">عرض الإحصائيات والتقارير المالية</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/advanced-analytics")} variant="outline">
              الإحصائيات المتقدمة
            </Button>
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              تصدير التقرير
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التحصيل السنوي</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{yearlyTotal.toFixed(2)} ج.م</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                من {monthlyTotals.reduce((sum, m) => sum + m.count, 0)} عملية تحصيل
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلاب غير المسددين</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{filteredUnpaidStudents.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                متأخرين عن السداد
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المبالغ المتأخرة</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalUnpaidAmount.toFixed(2)} ج.م</div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                إجمالي المتأخرات
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Collections Chart */}
          <Card>
            <CardHeader>
              <CardTitle>التحصيل الشهري</CardTitle>
              <CardDescription>إجمالي التحصيل لكل شهر</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyTotals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="المبلغ (ج.م)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Unpaid Students by Group */}
          {unpaidByGroup.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>الطلاب غير المسددين حسب المجموعة</CardTitle>
                <CardDescription>توزيع الطلاب المتأخرين</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={unpaidByGroup}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {unpaidByGroup.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">البحث باسم الطالب</label>
                <Input
                  placeholder="أدخل اسم الطالب"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">المجموعة</label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مجموعة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المجموعات</SelectItem>
                    {groups.map((group: any) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">الشهر</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر شهر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الشهور</SelectItem>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.num} value={month.num.toString()}>
                        الشهر {month.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Unpaid Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>الطلاب غير المسددين</CardTitle>
            <CardDescription>قائمة الطلاب المتأخرين عن السداد</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUnpaidStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-300">لا توجد طلاب متأخرين</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">اسم الطالب</TableHead>
                      <TableHead className="text-right">المجموعة</TableHead>
                      <TableHead className="text-right">عدد الشهور المتأخرة</TableHead>
                      <TableHead className="text-right">المبلغ المتأخر</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnpaidStudents.map((item: any) => {
                      const unpaidPayments = payments.filter(
                        (p: any) =>
                          p.studentId === item.student.id &&
                          p.year === currentYear &&
                          !p.isPaid
                      );
                      const unpaidAmount = unpaidPayments.reduce(
                        (sum: number, p: any) => sum + parseFloat(p.amount || 0),
                        0
                      );
                      return (
                        <TableRow key={item.student.id}>
                          <TableCell className="text-right">{item.student.name}</TableCell>
                          <TableCell className="text-right">{item.group.name}</TableCell>
                          <TableCell className="text-right">
                            <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-3 py-1 rounded-full text-sm font-bold">
                              {item.unpaidMonths}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600">
                            {unpaidAmount.toFixed(2)} ج.م
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
