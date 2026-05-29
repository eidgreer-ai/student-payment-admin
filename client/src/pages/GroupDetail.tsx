import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, ChevronLeft, Edit2 } from "lucide-react";
import { useState } from "react";

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

// دالة لحساب السنة الدراسية والشهر الحالي
function getSchoolYearInfo() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // إذا كان الشهر من 8-12 فالسنة الدراسية = السنة الحالية
  // إذا كان الشهر من 1-6 فالسنة الدراسية = السنة السابقة
  const schoolYear = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  return {
    schoolYear,
    currentMonth,
    currentYear,
  };
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentSerial, setNewStudentSerial] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditingFee, setIsEditingFee] = useState(false);
  const [newFee, setNewFee] = useState("");
  
  const { schoolYear, currentMonth } = getSchoolYearInfo();

  const groupId = parseInt(id || "0");
  const groupQuery = trpc.groups.getById.useQuery({ id: groupId }, { enabled: groupId > 0 });
  const studentsQuery = trpc.students.listByGroup.useQuery({ groupId }, { enabled: groupId > 0 });
  const createStudentMutation = trpc.students.create.useMutation();
  const deleteStudentMutation = trpc.students.delete.useMutation();
  const updateGroupMutation = trpc.groups.update.useMutation();

  const handleCreateStudent = async () => {
    if (!newStudentName.trim()) {
      toast.error("الرجاء إدخال اسم الطالب");
      return;
    }

    if (newStudentSerial === "") {
      toast.error("الرجاء إدخال المسلسل");
      return;
    }

    try {
      const serialNum = parseInt(newStudentSerial);
      if (isNaN(serialNum)) {
        toast.error("المسلسل يجب أن يكون رقماً");
        return;
      }

      await createStudentMutation.mutateAsync({
        groupId,
        name: newStudentName,
        serialNumber: serialNum,
      });
      toast.success("تم إضافة الطالب بنجاح");
      setNewStudentName("");
      setNewStudentSerial("");
      setIsDialogOpen(false);
      await studentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة الطالب");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;

    try {
      await deleteStudentMutation.mutateAsync({ id });
      toast.success("تم حذف الطالب بنجاح");
      await studentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف الطالب");
    }
  };

  const handleUpdateFee = async () => {
    if (!newFee.trim()) {
      toast.error("الرجاء إدخال قيمة الاشتراك");
      return;
    }

    try {
      const fee = parseFloat(newFee);
      if (isNaN(fee)) {
        toast.error("القيمة يجب أن تكون رقماً");
        return;
      }

      await updateGroupMutation.mutateAsync({
        id: groupId,
        name: groupQuery.data?.name || "",
        description: groupQuery.data?.description || undefined,
        monthlySubscriptionFee: fee,
      });
      toast.success("تم تحديث قيمة الاشتراك بنجاح");
      setIsEditingFee(false);
      setNewFee("");
      await groupQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث قيمة الاشتراك");
    }
  };

  if (groupQuery.isLoading || studentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const group = groupQuery.data;
  const students = studentsQuery.data || [];

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-600 dark:text-slate-300 mb-4">لم يتم العثور على المجموعة</p>
          <Button onClick={() => setLocation("/groups")}>العودة للمجموعات</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/groups")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{group?.name}</h1>
              <p className="text-slate-600 dark:text-slate-300">السنة الدراسية: {schoolYear}/{schoolYear + 1} • {students.length} طالب</p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة طالب
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
                <DialogDescription>أدخل بيانات الطالب الجديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">المسلسل</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={newStudentSerial}
                    onChange={(e) => setNewStudentSerial(e.target.value)}
                    min="1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">اسم الطالب</label>
                  <Input
                    placeholder="أدخل اسم الطالب"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCreateStudent}
                  disabled={createStudentMutation.isPending}
                  className="w-full"
                >
                  {createStudentMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Monthly Subscription Fee Card */}
        <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">قيمة الاشتراك الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingFee ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  step="0.01"
                  min="0"
                />
                <Button
                  onClick={handleUpdateFee}
                  disabled={updateGroupMutation.isPending}
                >
                  حفظ
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingFee(false);
                    setNewFee("");
                  }}
                >
                  إلغاء
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {group.monthlySubscriptionFee || "0.00"} ج.م
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewFee(group.monthlySubscriptionFee?.toString() || "");
                    setIsEditingFee(true);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  تعديل
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>الطلاب والمدفوعات</CardTitle>
            <CardDescription>جدول المدفوعات الشهرية للطلاب (السنة الدراسية {schoolYear}/{schoolYear + 1})</CardDescription>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-300 mb-4">لا توجد طلاب في هذه المجموعة</p>
                <Button onClick={() => setIsDialogOpen(true)}>إضافة طالب أول</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">م</TableHead>
                      <TableHead className="text-right">اسم الطالب</TableHead>
                      {MONTHS.map((month) => {
                        const isCurrentMonth = month.num === currentMonth;
                        return (
                          <TableHead
                            key={month.num}
                            className={`text-center text-xs font-bold ${
                              isCurrentMonth
                                ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100"
                                : ""
                            }`}
                          >
                            {month.name}
                            {isCurrentMonth && " ⭐"}
                          </TableHead>
                        );
                      })}
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <StudentRow
                        key={student.id}
                        student={student}
                        schoolYear={schoolYear}
                        currentMonth={currentMonth}
                        onDelete={() => handleDeleteStudent(student.id)}
                        onRefresh={() => studentsQuery.refetch()}
                      />
                    ))}
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

function StudentRow({ student, schoolYear, currentMonth, onDelete, onRefresh }: any) {
  const paymentsQuery = trpc.payments.listByStudent.useQuery({ studentId: student.id });
  const updatePaymentMutation = trpc.payments.createOrUpdate.useMutation();
  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const handleTogglePayment = async (month: number, isPaid: boolean) => {
    try {
      await updatePaymentMutation.mutateAsync({
        studentId: student.id,
        month,
        year: schoolYear,
        amount: editAmount || "0",
        isPaid: !isPaid,
      });
      await paymentsQuery.refetch();
      setEditingMonth(null);
      setEditAmount("");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث المدفوعات");
    }
  };

  const handleSaveAmount = async (month: number, isPaid: boolean) => {
    if (!editAmount.trim()) {
      toast.error("الرجاء إدخال المبلغ");
      return;
    }

    try {
      const amount = parseFloat(editAmount);
      if (isNaN(amount)) {
        toast.error("المبلغ يجب أن يكون رقماً");
        return;
      }

      await updatePaymentMutation.mutateAsync({
        studentId: student.id,
        month,
        year: schoolYear,
        amount: editAmount,
        isPaid: true,
      });
      await paymentsQuery.refetch();
      setEditingMonth(null);
      setEditAmount("");
      onRefresh();
      toast.success("تم تحديث المدفوعات بنجاح");
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث المدفوعات");
    }
  };

  const payments = paymentsQuery.data || [];

  return (
    <TableRow>
      <TableCell className="font-medium">{student.serialNumber}</TableCell>
      <TableCell className="font-medium">{student.name}</TableCell>
      {MONTHS.map((month) => {
        const payment = payments.find((p: any) => p.month === month.num && p.year === schoolYear);
        const isPaid = payment?.isPaid || false;
        const isCurrentMonth = month.num === currentMonth;

        return (
          <TableCell key={month.num} className="text-center p-1">
            {editingMonth === month.num ? (
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-16 h-8 text-xs"
                  step="0.01"
                  min="0"
                />
                <Button
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleSaveAmount(month.num, isPaid)}
                  disabled={updatePaymentMutation.isPending}
                >
                  ✓
                </Button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingMonth(month.num);
                  setEditAmount(payment?.amount?.toString() || "0");
                }}
                className={`w-full py-2 px-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  isPaid
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                } ${isCurrentMonth ? "ring-2 ring-yellow-400" : ""}`}
              >
                {isPaid ? "✓" : "✗"}
              </button>
            )}
          </TableCell>
        );
      })}
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
