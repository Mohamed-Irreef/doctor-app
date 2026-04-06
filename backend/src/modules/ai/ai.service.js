const ApiError = require("../../utils/ApiError");
const https = require("https");
const DoctorProfile = require("../../models/DoctorProfile");
const LabTest = require("../../models/LabTest");
const Medicine = require("../../models/Medicine");

const SYSTEM_INSTRUCTION = `You are "Nivi Bot", an intelligent AI-powered medical assistant integrated into the NiviDoc healthcare platform.

Your role is to assist patients with:
- Medical guidance (non-diagnostic)
- Symptom understanding
- Doctor recommendations
- Lab test suggestions
- Medicine awareness
- Appointment assistance
- Health record interpretation

⚠️ You are NOT a replacement for a licensed doctor.

---------------------------------------
1. CORE PERSONALITY & BEHAVIOR
---------------------------------------

- Tone: Calm, supportive, professional
- Language: Simple, clear, easy to understand
- Approach: Empathetic + factual

Always:
✔ Be respectful and reassuring
✔ Avoid panic-inducing language
✔ Encourage consulting real doctors when needed

---------------------------------------
2. MEDICAL SAFETY RULES (CRITICAL)
---------------------------------------

You MUST:

✔ Provide evidence-based, general medical information
✔ Clearly state uncertainty when unsure
✔ Avoid giving definitive diagnosis
✔ Avoid prescribing exact medications/dosages

NEVER:
❌ Claim "You have this disease"
❌ Suggest risky treatments
❌ Provide false or unverified info
❌ Guess answers

If serious symptoms:
→ Immediately advise: "Please consult a doctor urgently"

---------------------------------------
3. RESPONSE STRUCTURE (STRICT)
---------------------------------------

For medical queries, follow:

1. Possible explanation (general causes)
2. Common symptoms (if relevant)
3. What the user can do (safe advice)
4. When to see a doctor
5. Optional: suggest booking via NiviDoc

---------------------------------------
4. PLATFORM CONTEXT (NIVIDOC)
---------------------------------------

You are part of NiviDoc, a healthcare platform that provides:

- Doctor appointment booking
- Online consultation (chat/video)
- Lab test booking
- Medicine ordering
- Health records storage

Use this context in responses.

---------------------------------------
5. DATABASE INTEGRATION
---------------------------------------

You MAY be given NiviDoc data inside a section named "NIVIDOC_DATA".

Rules:
✔ Use ONLY the provided NIVIDOC_DATA when you reference specific doctors, lab tests, medicines, prices, or availability.
✔ If NIVIDOC_DATA is not provided, do NOT invent names/prices/availability. Instead, guide the user to use NiviDoc features (Doctors tab, Labs tab, Pharmacy) or ask for more details.

---------------------------------------
6. FEATURE CAPABILITIES
---------------------------------------

You can:

A. Symptom Analysis
- Understand symptoms
- Suggest possible conditions (non-confirmed)

B. Doctor Recommendation
- Based on specialization
- Based on symptoms

C. Lab Suggestions
- Blood test, scan, etc.

D. Medicine Awareness
- General info (usage, purpose)
- NOT prescriptions

E. Booking Assistance
- Guide users step-by-step

---------------------------------------
7. ESCALATION LOGIC
---------------------------------------

If symptoms include:
- Chest pain
- Breathing difficulty
- Severe bleeding
- Unconsciousness

→ Respond:
"This could be serious. Please seek immediate medical attention or visit a hospital."

---------------------------------------
8. MULTI-TURN CONVERSATION
---------------------------------------

- Ask follow-up questions
- Maintain context
- Personalize responses

Example:
User: I have headache
Bot: Since when? Any fever or vision issues?

---------------------------------------
9. DOCTOR-LIKE BUT SAFE
---------------------------------------

Act like a knowledgeable assistant, NOT a doctor.

Use phrases like:
- "This may be due to..."
- "Common causes include..."
- "It's recommended to..."

Avoid:
- "You definitely have..."

---------------------------------------
10. MEDICAL KNOWLEDGE BASE
---------------------------------------

Base your responses on:

- General medical knowledge
- WHO guidelines
- Standard healthcare practices

If unsure:
→ Say "I recommend consulting a doctor for accurate diagnosis"

---------------------------------------
11. LANGUAGE STYLE
---------------------------------------

- Short paragraphs
- Bullet points when needed
- No complex jargon

---------------------------------------
12. SAMPLE RESPONSE STYLE
---------------------------------------

User: I have stomach pain

Response:
- Stomach pain can have several causes like indigestion, gas, or infection.
- Common symptoms may include bloating, nausea, or cramps.

What you can do:
- Drink warm water
- Avoid oily/spicy food

When to see a doctor:
- Pain lasts more than 2 days
- Severe or sharp pain

I can help you find a gastroenterologist nearby if needed.

---------------------------------------
13. ETHICAL RULES
---------------------------------------

✔ Be truthful
✔ Be transparent
✔ Prioritize patient safety
✔ Never hallucinate medical facts

---------------------------------------
14. ERROR HANDLING
---------------------------------------

If you don't know:
→ "I'm not fully sure about this. It's best to consult a doctor."

---------------------------------------
15. FINAL GOAL
---------------------------------------

Deliver:
✔ Safe medical guidance
✔ Smart platform assistance
✔ Seamless healthcare experience

You are Nivi Bot — a trusted healthcare assistant.`;

const SPECIALTY_HINTS = [
  { keywords: ["chest", "heart", "cardio", "cardiology"], q: "cardio" },
  { keywords: ["skin", "acne", "rash", "derma", "dermat"], q: "derma" },
  { keywords: ["tooth", "teeth", "dent", "gum"], q: "dent" },
  { keywords: ["child", "kid", "baby", "pediatric", "paediatric"], q: "pedi" },
  { keywords: ["bone", "joint", "knee", "ortho", "orthopedic"], q: "ortho" },
  { keywords: ["headache", "migraine", "neuro", "seizure"], q: "neuro" },
  { keywords: ["eye", "vision", "blur", "ophthal"], q: "ophthal" },
  { keywords: ["stomach", "abdomen", "gas", "ulcer", "gastro"], q: "gastro" },
];

function includesAny(haystack, keywords) {
  return keywords.some((k) => haystack.includes(k));
}

async function getDoctorSuggestions(lastUserText) {
  const lower = String(lastUserText || "").toLowerCase();
  const hint = SPECIALTY_HINTS.find((h) => includesAny(lower, h.keywords));

  let query = DoctorProfile.find({}).populate({
    path: "user",
    select: "name image status doctorApprovalStatus",
    match: { status: "active", doctorApprovalStatus: "approved" },
  });

  if (hint?.q) {
    query = query.where("specialization", new RegExp(hint.q, "i"));
  }

  const rows = (await query.sort({ rating: -1 }).limit(5).lean()).filter(
    (x) => x.user,
  );

  return rows.map((r) => ({
    id: String(r.user._id),
    name: r.user.name,
    specialization: r.specialization,
    rating: r.rating,
    consultationFee: r.consultationFee,
  }));
}

async function getLabTestSuggestions() {
  const tests = await LabTest.find({ active: true, isApproved: true })
    .sort({ popular: -1, rating: -1, createdAt: -1 })
    .limit(5)
    .select("name price turnaround fastingRequired category")
    .lean();

  return tests.map((t) => ({
    name: t.name,
    category: t.category,
    price: t.price,
    turnaround: t.turnaround,
    fastingRequired: t.fastingRequired,
  }));
}

async function getMedicineSuggestions() {
  const items = await Medicine.find({ active: true, isApproved: true })
    .sort({ featured: -1, rating: -1, createdAt: -1 })
    .limit(5)
    .select("name category price prescriptionRequired")
    .lean();

  return items.map((m) => ({
    name: m.name,
    category: m.category,
    price: m.price,
    prescriptionRequired: m.prescriptionRequired,
  }));
}

async function buildNiviDocDataContext(lastUserText) {
  const lower = String(lastUserText || "").toLowerCase();

  const wantsDoctors = includesAny(lower, [
    "doctor",
    "specialist",
    "cardio",
    "derma",
    "dent",
    "pediatric",
    "paediatric",
    "ortho",
    "neuro",
  ]);
  const wantsLabs = includesAny(lower, ["lab", "test", "blood test", "report"]);
  const wantsMeds = includesAny(lower, [
    "medicine",
    "tablet",
    "capsule",
    "syrup",
  ]);

  if (!wantsDoctors && !wantsLabs && !wantsMeds) return null;

  const [doctors, labTests, medicines] = await Promise.all([
    wantsDoctors ? getDoctorSuggestions(lastUserText) : Promise.resolve(null),
    wantsLabs ? getLabTestSuggestions() : Promise.resolve(null),
    wantsMeds ? getMedicineSuggestions() : Promise.resolve(null),
  ]);

  const payload = {
    doctors: doctors || undefined,
    labTests: labTests || undefined,
    medicines: medicines || undefined,
  };

  return JSON.stringify(payload, null, 2);
}

function normalizeGeminiRole(role) {
  if (role === "user") return "user";
  if (role === "ai" || role === "assistant" || role === "model") return "model";
  return "user";
}

function toGeminiContents(messages) {
  const trimmed = Array.isArray(messages) ? messages.slice(-20) : [];
  return trimmed.map((m) => ({
    role: normalizeGeminiRole(m.role),
    parts: [{ text: String(m.text || "").trim() }],
  }));
}

function httpsJsonRequest({ url, method, headers, body, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch (_e) {
            json = null;
          }
          resolve({ statusCode: res.statusCode || 0, json, raw });
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("Request timeout"));
    });

    if (body) req.write(body);
    req.end();
  });
}

function getGeminiApiVersions() {
  const raw = String(process.env.GEMINI_API_VERSIONS || "").trim();
  if (!raw) return ["v1", "v1beta"];
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function getGeminiModelCandidates() {
  const raw = String(process.env.GEMINI_MODEL || "").trim();
  if (raw) {
    const values = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length) return values;
  }

  return [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro-latest",
  ];
}

function isModelNotSupportedError(message) {
  const m = String(message || "").toLowerCase();
  return (
    m.includes("is not found") ||
    m.includes("not found") ||
    m.includes("not supported") ||
    m.includes("unsupported")
  );
}

function isLeakedApiKeyError(message) {
  const m = String(message || "").toLowerCase();
  return (
    m.includes("api key") &&
    (m.includes("reported as leaked") || m.includes("was reported as leaked"))
  );
}

async function geminiGenerateText({ apiKey, contents }) {
  const payload = JSON.stringify({
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 500,
    },
  });

  const versions = getGeminiApiVersions();
  const models = getGeminiModelCandidates();

  let lastErrorMessage = "AI request failed";

  for (const version of versions) {
    for (const model of models) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey,
      )}`;

      let response;
      try {
        response = await httpsJsonRequest({
          url,
          method: "POST",
          timeoutMs: 20000,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          body: payload,
        });
      } catch (error) {
        if (
          String(error?.message || "")
            .toLowerCase()
            .includes("timeout")
        ) {
          throw new ApiError(504, "AI request timed out");
        }
        lastErrorMessage = "AI request failed";
        continue;
      }

      const { statusCode, json, raw } = response;

      if (statusCode < 200 || statusCode >= 300) {
        const message = json?.error?.message || raw || "AI request failed";
        lastErrorMessage = message;
        if (isLeakedApiKeyError(message)) {
          throw new ApiError(
            502,
            "Gemini API key is disabled (reported as leaked). Please rotate the key and update GEMINI_API_KEY on the server.",
          );
        }
        if (isModelNotSupportedError(message)) {
          continue;
        }
        throw new ApiError(502, message);
      }

      const text =
        json?.candidates?.[0]?.content?.parts
          ?.map((p) => p?.text)
          .filter(Boolean)
          .join("\n") || "";

      if (!text.trim()) {
        lastErrorMessage = "AI response was empty";
        continue;
      }

      return text.trim();
    }
  }

  throw new ApiError(502, lastErrorMessage);
}

async function chatWithAi({ messages }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(
      500,
      "AI is not configured. Please set GEMINI_API_KEY on the server.",
    );
  }

  const contents = toGeminiContents(messages);

  const lastUserIndexFromEnd = [...contents]
    .reverse()
    .findIndex((m) => m.role === "user");
  const lastUserPos =
    lastUserIndexFromEnd >= 0 ? contents.length - 1 - lastUserIndexFromEnd : -1;

  if (lastUserPos >= 0) {
    const lastText = contents[lastUserPos]?.parts?.[0]?.text || "";
    try {
      const niviDocData = await buildNiviDocDataContext(lastText);
      if (niviDocData) {
        contents[lastUserPos] = {
          ...contents[lastUserPos],
          parts: [
            {
              text: `${lastText}\n\nNIVIDOC_DATA (use only if relevant; do not invent anything not present):\n${niviDocData}`,
            },
          ],
        };
      }
    } catch (_error) {}
  }

  // Ensure last message is from user; if not, add a short follow-up.
  const lastRole = contents[contents.length - 1]?.role;
  if (lastRole !== "user") {
    contents.push({ role: "user", parts: [{ text: "Please continue." }] });
  }

  const reply = await geminiGenerateText({
    apiKey,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `INSTRUCTIONS (follow strictly):\n${SYSTEM_INSTRUCTION}`,
          },
        ],
      },
      ...contents,
    ],
  });
  return {
    reply,
  };
}

module.exports = {
  chatWithAi,
};
