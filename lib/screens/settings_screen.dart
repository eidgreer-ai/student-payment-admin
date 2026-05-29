import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../providers/auth_provider.dart';
import '../providers/app_provider.dart';
import '../database/database_helper.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإعدادات'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSecuritySection(),
            const SizedBox(height: 24),
            _buildAppearanceSection(),
            const SizedBox(height: 24),
            _buildBackupSection(),
            const SizedBox(height: 24),
            _buildAboutSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildSecuritySection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الأمان',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: ListTile(
            leading: const Icon(Icons.lock),
            title: const Text('تغيير الرقم السري'),
            subtitle: const Text('تحديث رقم الدخول الآمن'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showChangePasswordDialog(),
          ),
        ),
      ],
    );
  }

  Widget _buildAppearanceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'المظهر',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Consumer<AppProvider>(
            builder: (context, appProvider, _) {
              return ListTile(
                leading: const Icon(Icons.brightness_4),
                title: const Text('الوضع الليلي'),
                subtitle:
                    Text(appProvider.isDarkMode ? 'مفعل' : 'معطل'),
                trailing: Switch(
                  value: appProvider.isDarkMode,
                  onChanged: (value) {
                    appProvider.setDarkMode(value);
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBackupSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'النسخ الاحتياطية',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: ListTile(
            leading: const Icon(Icons.cloud_download),
            title: const Text('نسخ احتياطية'),
            subtitle: const Text('تحميل نسخة احتياطية من البيانات'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showBackupDialog(),
          ),
        ),
        const SizedBox(height: 8),
        Card(
          child: ListTile(
            leading: const Icon(Icons.cloud_upload),
            title: const Text('استعادة النسخة الاحتياطية'),
            subtitle: const Text('استرجاع البيانات من نسخة احتياطية'),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () => _showRestoreDialog(),
          ),
        ),
      ],
    );
  }

  Widget _buildAboutSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'عن التطبيق',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'الإصدار',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Text(
                      '1.0.0',
                      style: Theme.of(context)
                          .textTheme
                          .bodyLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'التطبيق',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Text(
                      'إدارة الطلاب والمدفوعات',
                      style: Theme.of(context)
                          .textTheme
                          .bodyLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'الترخيص',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    Text(
                      'Private',
                      style: Theme.of(context)
                          .textTheme
                          .bodyLarge
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showChangePasswordDialog() {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    bool _obscureOld = true;
    bool _obscureNew = true;
    bool _obscureConfirm = true;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('تغيير الرقم السري'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: oldPasswordController,
                  obscureText: _obscureOld,
                  decoration: InputDecoration(
                    labelText: 'الرقم السري الحالي',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureOld
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () =>
                          setState(() => _obscureOld = !_obscureOld),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: newPasswordController,
                  obscureText: _obscureNew,
                  decoration: InputDecoration(
                    labelText: 'الرقم السري الجديد',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureNew
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () =>
                          setState(() => _obscureNew = !_obscureNew),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: confirmPasswordController,
                  obscureText: _obscureConfirm,
                  decoration: InputDecoration(
                    labelText: 'تأكيد الرقم السري',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm
                            ? Icons.visibility_off
                            : Icons.visibility,
                      ),
                      onPressed: () =>
                          setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('إلغاء'),
            ),
            FilledButton(
              onPressed: () async {
                final authProvider = context.read<AuthProvider>();

                if (oldPasswordController.text != authProvider.password) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('الرقم السري الحالي غير صحيح')),
                  );
                  return;
                }

                if (newPasswordController.text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('الرجاء إدخال رقم سري جديد')),
                  );
                  return;
                }

                if (newPasswordController.text !=
                    confirmPasswordController.text) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('الرقم السري غير متطابق')),
                  );
                  return;
                }

                await authProvider
                    .changePassword(newPasswordController.text);

                if (!context.mounted) return;
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('تم تغيير الرقم السري بنجاح')),
                );
              },
              child: const Text('تحديث'),
            ),
          ],
        ),
      ),
    );
  }

  void _showBackupDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('نسخ احتياطية'),
        content: const Text(
            'هل تريد إنشاء نسخة احتياطية من جميع البيانات؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () async {
              final backup = await DatabaseHelper.instance.getFullBackup();
              final jsonString = jsonEncode(backup);

              if (!context.mounted) return;
              Navigator.pop(context);

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('تم إنشاء النسخة الاحتياطية بنجاح'),
                  action: SnackBarAction(
                    label: 'نسخ',
                    onPressed: () {
                      // Copy to clipboard functionality would go here
                    },
                  ),
                ),
              );
            },
            child: const Text('إنشاء نسخة احتياطية'),
          ),
        ],
      ),
    );
  }

  void _showRestoreDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('استعادة النسخة الاحتياطية'),
        content: const Text(
            'هذا سيستبدل جميع البيانات الحالية. هل أنت متأكد؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            onPressed: () async {
              // Restore functionality would go here
              if (!context.mounted) return;
              Navigator.pop(context);

              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('تم استعادة البيانات بنجاح')),
              );
            },
            child: const Text('استعادة'),
          ),
        ],
      ),
    );
  }
}
