import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:get/get.dart';
import 'core/constants/app_theme.dart';
import 'routes/app_routes.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await dotenv.load(fileName: '.env');

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Status bar styling
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    systemNavigationBarColor: Color(0xFFF4EFE5),
    systemNavigationBarIconBrightness: Brightness.dark,
  ));

  runApp(const RuralTriageApp());
}

class RuralTriageApp extends StatelessWidget {
  const RuralTriageApp({super.key});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'Rural Triage Assistant',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: AppRoutes.home,
      getPages: AppRoutes.pages,
      defaultTransition: Transition.fadeIn,
      locale: const Locale('hi', 'IN'),
      fallbackLocale: const Locale('en', 'US'),
      builder: (context, child) {
        // Ensure text scale doesn't break layout
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(
              MediaQuery.of(context).textScaleFactor.clamp(0.85, 1.2),
            ),
          ),
          child: child!,
        );
      },
    );
  }
}
