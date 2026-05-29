import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Mail, Send, AlertCircle } from "lucide-react";

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

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [currentYear] = useState(new Date().getFullYear());
  const [subject, setSubject] = useState("تذكير بسداد المستحقات");
  const [message, setMessage] = useState(
    "السلام عليكم ورحمة الله وبركاته،\n\nنود تذكيركم بوجود مستحقات متأخرة. يرجى التفضل بسدادها في أقرب وقت.\n\nشكراً لكم."
  );
  const [sendToUnpaid, setSendToUnpaid] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const unpaidStudentsQuery = trpc.payments.unpaidStudents.useQuery({ year: currentYear });

  if (unpaidStudentsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  const unpaidStudents = unpaidStudentsQuery.data || [];

  const handleSendNotifications = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("الرجاء ملء الموضوع والرسالة");
      return;
    }

    setIsSending(true);
    try {
      // Simulate sending notifications
      const recipients = sendToUnpaid ? unpaidStudents.length : 0;
      
      // In a real application, this would call an API endpoint
      // For now, we'll just show a success message
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success(`تم إرسال ${recipients} تنبيه بنجاح`);
      setSubject("تذكير بسداد المستحقات");
      setMessage(
        "السلام عليكم ورحمة الله وبركاته،\n\nنود تذكيركم بوجود مستحقات متأخرة. يرجى التفضل بسدادها في أقرب وقت.\n\nشكراً لكم."
      );
    } catch (error: any) {
      toast.error(error.message || "فشل إرسال التنبيهات");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">التنبيهات والرسائل</h1>
            <p className="text-slate-600 dark:text-slate-300">إرسال تنبيهات للطلاب المتأخرين</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <AlertCircle className="w-5 h-5" />
              معلومات
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800 dark:text-blue-100">
            <p>سيتم إرسال التنبيهات إلى {unpaidStudents.length} طالب متأخر عن السداد.</p>
            <p className="mt-2 text-sm">
              ملاحظة: في التطبيق الحالي، التنبيهات تُعرض كرسائل توضيحية. في بيئة الإنتاج، ستُرسل عبر البريد الإلكتروني.
            </p>
          </CardContent>
        </Card>

        {/* Notification Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>إنشاء تنبيه جديد</CardTitle>
            <CardDescription>اكتب الموضوع والرسالة التي تريد إرسالها</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subject */}
            <div>
              <label className="text-sm font-medium">الموضوع</label>
              <Input
                placeholder="أدخل موضوع الرسالة"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium">الرسالة</label>
              <Textarea
                placeholder="أدخل نص الرسالة"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                rows={8}
              />
            </div>

            {/* Recipients */}
            <div className="space-y-3">
              <label className="text-sm font-medium">المستقبلون</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unpaid"
                  checked={sendToUnpaid}
                  onCheckedChange={(checked) => setSendToUnpaid(checked as boolean)}
                  disabled={isSending}
                />
                <label htmlFor="unpaid" className="text-sm cursor-pointer">
                  الطلاب المتأخرون عن السداد ({unpaidStudents.length} طالب)
                </label>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendNotifications}
              disabled={isSending || !sendToUnpaid}
              className="w-full gap-2"
            >
              {isSending ? (
                <>
                  <Spinner className="w-4 h-4" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  إرسال التنبيهات
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Unpaid Students List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الطلاب المتأخرين</CardTitle>
            <CardDescription>الطلاب الذين سيتلقون التنبيهات</CardDescription>
          </CardHeader>
          <CardContent>
            {unpaidStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-300">لا توجد طلاب متأخرين</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unpaidStudents.map((student: any, index: number) => (
                  <div
                    key={student.student.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{student.student.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {student.group.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {student.unpaidMonths} شهور متأخرة
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
