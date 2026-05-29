import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'providers/app_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/group_provider.dart';
import 'providers/student_provider.dart';
import 'providers/payment_provider.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/groups_screen.dart';
import 'screens/group_detail_screen.dart';
import 'screens/student_detail_screen.dart';
import 'screens/inventory_screen.dart';
import 'screens/settings_screen.dart';
import 'theme/app_theme.dart';
import 'database/database_helper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await DatabaseHelper.instance.database;
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => GroupProvider()),
        ChangeNotifierProvider(create: (_) => StudentProvider()),
        ChangeNotifierProvider(create: (_) => PaymentProvider()),
      ],
      child: Consumer<AppProvider>(
        builder: (context, appProvider, _) {
          final isDarkMode = appProvider.isDarkMode;
          
          return MaterialApp.router(
            title: 'إدارة الطلاب والمدفوعات',
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
            locale: const Locale('ar'),
            routerConfig: _buildRouter(),
            debugShowCheckedModeBanner: false,
          );
        },
      ),
    );
  }

  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(),
          routes: [
            GoRoute(
              path: 'groups',
              builder: (context, state) => const GroupsScreen(),
              routes: [
                GoRoute(
                  path: ':groupId',
                  builder: (context, state) {
                    final groupId = state.pathParameters['groupId']!;
                    return GroupDetailScreen(groupId: groupId);
                  },
                  routes: [
                    GoRoute(
                      path: 'student/:studentId',
                      builder: (context, state) {
                        final groupId = state.pathParameters['groupId']!;
                        final studentId = state.pathParameters['studentId']!;
                        return StudentDetailScreen(
                          groupId: groupId,
                          studentId: studentId,
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
            GoRoute(
              path: 'inventory',
              builder: (context, state) => const InventoryScreen(),
            ),
            GoRoute(
              path: 'settings',
              builder: (context, state) => const SettingsScreen(),
            ),
          ],
        ),
      ],
      redirect: (context, state) async {
        final isAuth = context.read<AuthProvider>().isAuthenticated;
        if (!isAuth && state.uri.path != '/login') {
          return '/login';
        }
        if (isAuth && state.uri.path == '/login') {
          return '/home';
        }
        return null;
      },
    );
  }
}
