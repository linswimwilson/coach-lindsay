
# Conversation Design Prompt for Coach Lindsay

Paste this into Claude.ai along with your handwritten notes for a chapter. Replace the bracketed sections.

---

I am building an interactive Socratic tutoring app called Coach Lindsay for nursing pathophysiology students. I need you to help me design a conversation module.

The app works like a one-on-one study session. Coach Lindsay guides the student through a topic using short, conversational exchanges — never lecturing, always asking questions and letting the student generate answers. It uses text or voice input.

Here is the format I need you to produce:

## 1. CONVERSATION METADATA

- Conversation title (e.g., "Conversation 7: Emphysema — Pink Puffer")
- What the student should already know coming in (prerequisites from earlier conversations)
- What the student should leave knowing (the "LEAVING WITH" list — 8-15 specific, testable concepts)

## 2. TEACHING FLOW

Break the conversation into sequential steps. For each step:

- **Step name** (e.g., "NICKNAME AND IMAGE", "BUILD THE PATHOLOGY", "SCENARIOS")
- **Goal** — what the student should understand after this step
- **Key questions to ask** — the Socratic questions that guide discovery (not the answers)
- **Common wrong answers and how to redirect** — what students typically say and how to guide them without giving it away
- **Analogies** — any helpful analogies (e.g., "stretched out balloon" for emphysema alveoli)
- **Say-it-back moments** — key concepts the student must restate in their own words before moving on
- **Visual anchor points** — concepts where an image would help (describe what the image should show)

The typical flow is:
1. Connect to what they know (1-2 exchanges)
2. Build the core concept through guided questions (bulk of session)
3. Clinical scenarios — 3 progressive (easy → medium → hard with distractors)
4. Rapid fire review (3-5 quick questions)
5. Offer more practice

## 3. CLINICAL SCENARIOS

Design 3 scenarios:
- **Scenario 1 (easy)**: Classic presentation. Every clue points to the diagnosis. Signs and symptoms only.
- **Scenario 2 (medium)**: Include vitals and numbers. Fewer obvious symptom descriptions. Make them use the numbers.
- **Scenario 3 (hard)**: Include relevant clues AND irrelevant distractors (unrelated past surgeries, normal lab values, family history that doesn't matter). Teach them to identify what matters and what doesn't.

Rules for all scenarios:
- No acid-base/ABG values (future chapter)
- No medication names (they haven't studied pharmacology)
- Keep them SHORT — 3-5 sentences each
- Every piece of clinical information should be something the student learned in this conversation

## 4. RAPID FIRE QUESTIONS

3-5 quick recall questions. Mix of:
- "What is ___?" (definition recall)
- "Obstructive or restrictive?" (classification)
- "What would you expect to see?" (application)
- Multiple choice where appropriate (always include A, B, C, D options)

## 5. CLINICAL FACTS THAT MUST BE EXACT

List any values, ranges, or facts that must be clinically accurate (e.g., "COPD target SpO2: 91-94%"). These go in the prompt to prevent AI hallucination.

## 6. INITIAL MESSAGES

Write the 3-4 opening bubbles Coach Lindsay sends before the student responds. These should:
- Greet warmly
- Name the topic
- Ask an opening question that lets the student show what they already know

---

## HERE ARE MY NOTES FOR THIS TOPIC:

[PASTE YOUR HANDWRITTEN NOTES HERE — photographs of handwritten notes work great too]

---

Please design the full conversation following the format above. Keep the tone warm, direct, and encouraging — like a smart friend helping you study. Remember: Coach Lindsay NEVER lectures. Every concept must be discovered by the student through guided questions.
