import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Plus, Edit2, Trash2, ChevronLeft } from "lucide-react";

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

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentSerial, setNewStudentSerial] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());

  const groupId = parseInt(id || "0");
  const groupQuery = trpc.groups.getById.useQuery({ id: groupId });
  const studentsQuery = trpc.students.listByGroup.useQuery({ groupId });
  const createStudentMutation = trpc.students.create.useMutation();
  const deleteStudentMutation = trpc.students.delete.useMutation();

  const handleCreateStudent = async () => {
    if (!newStudentName.trim() || newStudentSerial === "") {
      toast.error("الرجاء إدخال بيانات الطالب");
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
      studentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل إضافة الطالب");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;

    try {
      await deleteStudentMutation.mutateAsync({ id });
      toast.success("تم حذف الطالب بنجاح");
      studentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل حذف الطالب");
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
              <p className="text-slate-600 dark:text-slate-300">{students.length} طالب</p>
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

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>الطلاب والمدفوعات</CardTitle>
            <CardDescription>جدول المدفوعات الشهرية للطلاب</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">م</TableHead>
                    <TableHead className="text-right">اسم الطالب</TableHead>
                    {MONTHS.map((month) => (
                      <TableHead key={month.num} className="text-center text-xs">
                        {month.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      currentYear={currentYear}
                      onDelete={() => handleDeleteStudent(student.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>

            {students.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-300 mb-4">لا توجد طلاب في هذه المجموعة</p>
                <Button onClick={() => setIsDialogOpen(true)}>إضافة طالب أول</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentRow({ student, currentYear, onDelete }: any) {
  const paymentsQuery = trpc.payments.listByStudent.useQuery({ studentId: student.id });
  const updatePaymentMutation = trpc.payments.createOrUpdate.useMutation();

  const handleTogglePayment = async (month: number, isPaid: boolean) => {
    try {
      await updatePaymentMutation.mutateAsync({
        studentId: student.id,
        month,
        year: currentYear,
        amount: "0",
        isPaid: !isPaid,
      });
      paymentsQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "فشل تحديث المدفوعات");
    }
  };

  const payments = paymentsQuery.data || [];

  return (
    <TableRow>
      <TableCell className="text-right">{student.serialNumber}</TableCell>
      <TableCell className="text-right font-medium">{student.name}</TableCell>
      {MONTHS.map((month) => {
        const payment = payments.find((p) => p.month === month.num && p.year === currentYear);
        const isPaid = payment?.isPaid || false;
        return (
          <TableCell
            key={month.num}
            className="text-center p-2 cursor-pointer"
            onClick={() => handleTogglePayment(month.num, isPaid)}
          >
            <div
              className={`inline-block w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-colors ${
                isPaid
                  ? "bg-green-500 text-white"
                  : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200"
              }`}
            >
              {isPaid ? "✓" : "✗"}
            </div>
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
