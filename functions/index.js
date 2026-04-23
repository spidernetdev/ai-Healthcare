const functions = require("firebase-functions");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);
const MODEL_NAME = "gemini-2.0-flash";

// ─── Shared model config ──────────────────────────────────────────────────────

function getModel() {
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 512,
    },
  });
}

// ─── 1. Get follow-up question ────────────────────────────────────────────────

exports.getFollowUpQuestion = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    const { symptoms, language } = data;

    if (!symptoms || typeof symptoms !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "symptoms required",
      );
    }

    const isHindi = language === "hindi";

    const prompt = isHindi
      ? `Tum ek gramin swasthya triage assistant ho.
Mujhe patient ke lakshan ke baare mein batao: "${symptoms}"
Sirf EK sabse zaroori anusaran prashna poochho. Simple Hindi mein, 1-2 vaakyon mein. Koi heading nahi.`
      : `You are a rural health triage assistant.
Patient symptoms: "${symptoms}"
Ask ONE most important follow-up question. Simple English, 1-2 sentences. No headings.`;

    try {
      const model = getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      return { question: text, success: true };
    } catch (error) {
      console.error("getFollowUpQuestion error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

// ─── 2. Classify triage ───────────────────────────────────────────────────────

exports.classifyTriage = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    const { symptoms, followUpQuestion, followUpAnswer, language } = data;

    if (!symptoms || !followUpAnswer) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "symptoms and followUpAnswer required",
      );
    }

    const isHindi = language === "hindi";

    const prompt = isHindi
      ? `Tum ek gramin swasthya triage assistant ho.
Neeche diye gaye lakshan aur jawab ke aadhar par triage karo.
SIRF is JSON format mein jawab do (koi aur text nahi):
{
  "category": "EMERGENCY" ya "DOCTOR_VISIT" ya "HOME_CARE",
  "reason": "Hindi mein 1 line",
  "next_steps": "Hindi mein 1-2 vaakyon mein",
  "urgency_score": 0-100,
  "home_care_tips": ["tip1", "tip2", "tip3"]
}

Symptoms: ${symptoms}
Follow-up Q: ${followUpQuestion}
Answer: ${followUpAnswer}`
      : `You are a rural health triage assistant.
Respond ONLY with this JSON (no other text):
{
  "category": "EMERGENCY" or "DOCTOR_VISIT" or "HOME_CARE",
  "reason": "1-line reason",
  "next_steps": "1-2 sentences on what to do",
  "urgency_score": 0-100,
  "home_care_tips": ["tip1", "tip2", "tip3"]
}

Symptoms: ${symptoms}
Follow-up Q: ${followUpQuestion}
Answer: ${followUpAnswer}`;

    try {
      const model = getModel();
      const result = await model.generateContent(prompt);
      let raw = result.response.text().trim();

      // Strip code fences if present
      raw = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(raw);
      return { result: parsed, success: true };
    } catch (error) {
      console.error("classifyTriage error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

// ─── 3. Save session to Firestore (optional) ─────────────────────────────────

exports.saveTriageSession = functions
  .region("asia-south1")
  .https.onCall(async (data, context) => {
    const admin = require("firebase-admin");
    if (!admin.apps.length) admin.initializeApp();

    const db = admin.firestore();
    const { symptoms, result, language, timestamp } = data;

    try {
      const docRef = await db.collection("triage_sessions").add({
        symptoms,
        result,
        language,
        timestamp: timestamp || admin.firestore.FieldValue.serverTimestamp(),
        // No PII stored — anonymous sessions only
      });
      return { id: docRef.id, success: true };
    } catch (error) {
      console.error("saveTriageSession error:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });
