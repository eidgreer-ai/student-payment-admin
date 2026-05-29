import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Printer, Download, FileText } from "lucide-react";

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

export default function Invoices() {
  const [, setLocation] = useLocation();
  const [currentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

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

  // Get paid students
  let paidStudents = payments
    .filter((p: any) => p.isPaid && p.year === currentYear)
    .reduce((acc: any, p: any) => {
      const existing = acc.find((s: any) => s.studentId === p.studentId);
      if (existing) {
        existing.months.push(p.month);
        existing.totalAmount += parseFloat(p.amount || 0);
      } else {
        acc.push({
          studentId: p.studentId,
          months: [p.month],
          totalAmount: parseFloat(p.amount || 0),
        });
      }
      return acc;
    }, []);

  if (selectedMonth !== "all") {
    paidStudents = paidStudents.filter((s: any) => s.months.includes(parseInt(selectedMonth)));
  }

  if (searchName) {
    paidStudents = paidStudents.filter((s: any) => {
      // Filter by group name or student ID since studentName doesn't exist
      const group = groups.find((g: any) =>
        payments.some((p: any) => p.studentId === s.studentId && p.groupId === g.id)
      );
      return group && group.name?.toLowerCase().includes(searchName.toLowerCase());
    });
  }

  const handlePrintInvoice = (studentId: number) => {
    setIsPrinting(true);
    try {
      const paidData = paidStudents.find((s: any) => s.studentId === studentId);
      if (!paidData) {
        toast.error("لم يتم العثور على بيانات الفاتورة");
        setIsPrinting(false);
        return;
      }

      const invoiceContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>فاتورة</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #333; }
            .header p { margin: 5px 0; color: #666; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-box { flex: 1; }
            .info-box label { font-weight: bold; display: block; margin-bottom: 5px; }
            .info-box p { margin: 0 0 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .total { font-weight: bold; font-size: 16px; }
            .footer { text-align: center; margin-top: 30px; border-top: 2px solid #333; padding-top: 20px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>فاتورة دفع</h1>
            <p>مدرسة تعليمية</p>
          </div>
          
          <div class="invoice-info">
            <div class="info-box">
              <label>رقم الفاتورة:</label>
              <p>#${studentId}-${currentYear}</p>
            </div>
            <div class="info-box">
              <label>التاريخ:</label>
              <p>${new Date().toLocaleDateString("ar-EG")}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>الشهر</th>
                <th>المبلغ (ج.م)</th>
                <th>تاريخ السداد</th>
              </tr>
            </thead>
            <tbody>
              ${paidData.months.map((month: number) => `
                <tr>
                  <td>شهر ${month}</td>
                  <td>${(paidData.totalAmount / paidData.months.length).toFixed(2)}</td>
                  <td>${new Date().toLocaleDateString("ar-EG")}</td>
                </tr>
              `).join("")}
              <tr>
                <td colspan="1" class="total">الإجمالي:</td>
                <td class="total">${paidData.totalAmount.toFixed(2)} ج.م</td>
                <td></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>شكراً لسداد المستحقات</p>
            <p>تم طباعة هذه الفاتورة بتاريخ ${new Date().toLocaleDateString("ar-EG")} الساعة ${new Date().toLocaleTimeString("ar-EG")}</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        printWindow.print();
      }
      toast.success("تم فتح الفاتورة للطباعة");
    } catch (error: any) {
      toast.error(error.message || "فشل طباعة الفاتورة");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">الفواتير</h1>
            <p className="text-slate-600 dark:text-slate-300">فواتير الطلاب المسددين</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>البحث والتصفية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="ابحث عن اسم الطالب"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
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
              <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center">
                عدد الفواتير: {paidStudents.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <div className="space-y-4">
          {paidStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-300">لا توجد فواتير متطابقة</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            paidStudents.map((paidStudent: any) => {
              const student = payments.find((p: any) => p.studentId === paidStudent.studentId);
              const group = groups.find((g: any) =>
                payments.some((p: any) => p.studentId === paidStudent.studentId && p.groupId === g.id)
              );

              return (
                <Card key={paidStudent.studentId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>فاتورة #{paidStudent.studentId}-{currentYear}</CardTitle>
                        <CardDescription>{group?.name || "غير محددة"}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {paidStudent.totalAmount.toFixed(2)} ج.م
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {paidStudent.months.length} شهور
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">الشهور المسددة:</p>
                      <div className="flex flex-wrap gap-2">
                        {paidStudent.months.map((month: number) => (
                          <span
                            key={month}
                            className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 rounded-full text-sm"
                          >
                            شهر {month}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePrintInvoice(paidStudent.studentId)}
                        disabled={isPrinting}
                        className="gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        طباعة الفاتورة
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        تحميل PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
