import 'package:get/get.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../features/triage/presentation/screens/home_screen.dart';
import '../features/triage/presentation/screens/question_screen.dart';
import '../features/triage/presentation/screens/result_screen.dart';
import '../features/triage/presentation/controllers/triage_controller.dart';
import '../core/services/gemini_service.dart';
import '../core/services/speech_service.dart';
import '../features/triage/data/repositories/triage_repository.dart';

class AppRoutes {
  static const String home = '/';
  static const String question = '/question';
  static const String result = '/result';

  static final pages = [
    GetPage(
      name: home,
      page: () => const HomeScreen(),
      binding: BindingsBuilder(() {
        // Services
        Get.lazyPut<GeminiService>(() {
          final svc = GeminiService();
          final apiKey = dotenv.env['AI_API_KEY'];
          if (apiKey == null || apiKey.isEmpty) {
            throw StateError('Missing AI_API_KEY in .env');
          }
          svc.initialize(apiKey);
          return svc;
        });

        Get.lazyPut<SpeechService>(() => SpeechService());

        Get.lazyPut<TriageRepository>(
          () => TriageRepository(
            geminiService: Get.find<GeminiService>(),
          ),
        );

        Get.lazyPut<TriageController>(
          () => TriageController(
            repository: Get.find<TriageRepository>(),
            speechService: Get.find<SpeechService>(),
          ),
        );
      }),
      transition: Transition.fadeIn,
    ),
    GetPage(
      name: question,
      page: () => const QuestionScreen(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 280),
    ),
    GetPage(
      name: result,
      page: () => const ResultScreen(),
      transition: Transition.rightToLeft,
      transitionDuration: const Duration(milliseconds: 280),
    ),
  ];
}
