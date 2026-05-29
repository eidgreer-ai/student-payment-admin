import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalAuth } from "@/contexts/AuthContext";
import { Users, BarChart3, Settings, LogOut } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useLocalAuth();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const menuItems = [
    {
      title: "المجموعات",
      description: "إدارة مجموعات الطلاب والطلاب",
      icon: Users,
      path: "/groups",
      color: "bg-blue-500",
    },
    {
      title: "الجرد والحسابات",
      description: "عرض الإحصائيات والتقارير المالية",
      icon: BarChart3,
      path: "/accounting",
      color: "bg-green-500",
    },
    {
      title: "الإعدادات",
      description: "تغيير كلمة المرور والنسخ الاحتياطي",
      icon: Settings,
      path: "/settings",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header with Logout */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">تطبيق إدارة الطلاب والمدفوعات</h1>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">مرحباً بك</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            اختر أحد الأقسام أدناه للبدء
          </p>
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.path}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => setLocation(item.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors"
                  >
                    فتح
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
