import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, DollarSign, Users, TrendingUp } from "lucide-react";

const MONTHS = [
  { num: 8, name: "أغسطس" },
  { num: 9, name: "سبتمبر" },
  { num: 10, name: "أكتوبر" },
  { num: 11, name: "نوفمبر" },
  { num: 12, name: "ديسمبر" },
  { num: 1, name: "يناير" },
  { num: 2, name: "فبراير" },
  { num: 3, name: "مارس" },
  { num: 4, name: "أبريل" },
  { num: 5, name: "مايو" },
  { num: 6, name: "يونيو" },
];

export default function Accounting() {
  const [, setLocation] = useLocation();
  const [currentYear] = useState(new Date().getFullYear());
  const [searchName, setSearchName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const groupsQuery = trpc.groups.list.useQuery();
  const unpaidStudentsQuery = trpc.payments.unpaidStudents.useQuery({ year: currentYear });

  // Calculate monthly totals
  const monthlyTotals = MONTHS.map((month) => ({
    month: month.name,
    monthNum: month.num,
  }));

  if (groupsQuery.isLoading || unpaidStudentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const groups = groupsQuery.data || [];
  const unpaidStudents = unpaidStudentsQuery.data || [];

  // Filter unpaid students
  let filteredStudents = unpaidStudents;
  if (searchName) {
    filteredStudents = filteredStudents.filter((item: any) =>
      item.student.name.includes(searchName)
    );
  }
  if (selectedGroup) {
    filteredStudents = filteredStudents.filter((item: any) =>
      item.group.id.toString() === selectedGroup
    );
  }

  // Calculate statistics
  const totalUnpaidAmount = filteredStudents.reduce((sum: number, item: any) => {
    return sum + (item.unpaidMonths * 100); // Assuming 100 per month
  }, 0);

  const totalUnpaidStudents = filteredStudents.length;
  const totalMonthlyCollections = monthlyTotals.length * 1000; // Placeholder

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التحصيل السنوي</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMonthlyCollections} ريال</div>
              <p className="text-xs text-muted-foreground">من جميع الطلاب</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلاب غير المسددين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnpaidStudents}</div>
              <p className="text-xs text-muted-foreground">طالب متأخر في السداد</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المبلغ المتأخر</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnpaidAmount} ريال</div>
              <p className="text-xs text-muted-foreground">إجمالي المتأخرات</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">البحث عن طالب</label>
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
                    <SelectValue placeholder="جميع المجموعات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع المجموعات</SelectItem>
                    {groups.map((group) => (
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
                    <SelectValue placeholder="جميع الأشهر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الأشهر</SelectItem>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.num} value={month.num.toString()}>
                        {month.name}
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
            <CardDescription>قائمة الطلاب الذين لم يسددوا رسومهم</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">م</TableHead>
                    <TableHead className="text-right">اسم الطالب</TableHead>
                    <TableHead className="text-right">المجموعة</TableHead>
                    <TableHead className="text-center">عدد الشهور المتأخرة</TableHead>
                    <TableHead className="text-center">المبلغ المتأخر</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((item: any, index: number) => (
                    <TableRow key={item.student.id}>
                      <TableCell className="text-right">{index + 1}</TableCell>
                      <TableCell className="text-right font-medium">{item.student.name}</TableCell>
                      <TableCell className="text-right">{item.group.name}</TableCell>
                      <TableCell className="text-center">
                        <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-3 py-1 rounded-full text-sm">
                          {item.unpaidMonths} شهر
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {item.unpaidMonths * 100} ريال
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-300">لا توجد طلاب غير مسددين</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
