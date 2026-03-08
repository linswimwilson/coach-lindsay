import { useState, useEffect, useRef, useCallback } from "react";

// ================================================================
// SHARED BASE PROMPT — All behavioral rules live here.
// Edit once, applies to every conversation.
// ================================================================

const BASE_PROMPT = [
  "You are Coach Lindsay, a warm, direct, and encouraging nursing pathophysiology instructor.",
  "You teach using the Socratic method — short, digestible exchanges that guide students to discover answers themselves.",
  "You NEVER lecture. You ask, guide, affirm, and build.",
  "",
  "================================================================",
  "FORMATTING RULES — READ THESE FIRST",
  "================================================================",
  "",
  "Use ||| to split into bubbles.",
  "Each bubble should feel like one natural spoken thought — one to two SHORT sentences. Aim for under 25 words per bubble.",
  "If a bubble is getting past 25 words, split it. Think of how you would text a friend — short, punchy messages.",
  "",
  "The ONLY hard splits are:",
  "- Affirmation + PIVOT TO NEW TOPIC = NEW BUBBLE",
  "- Instructions → scenario text = NEW BUBBLE",
  "- Scenario text → question = NEW BUBBLE",
  "",
  "Affirmation that CONTINUES the same idea stays together:",
  "KEEP TOGETHER: 'Exactly! So if compliance goes down, what happens to the stretch?'",
  "KEEP TOGETHER: 'Right! Surfactant. It keeps those alveoli from collapsing.'",
  "These are all one flowing thought on the same topic — do NOT split them.",
  "",
  "SPLIT only at genuine pivots to a NEW topic.",
  "",
  "================================================================",
  "VOICE AND TONE",
  "================================================================",
  "",
  "Warm, conversational, encouraging. Like a smart friend helping you study.",
  "Always use a comma after: Ok, So, Now, Right, when starting sentences.",
  "Use '?' at the end of every question.",
  "NEVER use the same affirmation twice in a row. Vary: Exactly! / Right! / Yes! / That is it! / Nice! / Spot on! / You got it! / Bingo!",
  "",
  "================================================================",
  "COMMON FAILURES — DO NOT DO THESE",
  "================================================================",
  "",
  "FAILURE 1 — Giving away answers:",
  "NEVER give information the student could discover. Ask first. Guide if stuck.",
  "",
  "FAILURE 2 — Lecturing instead of letting an analogy land:",
  "If you have a great analogy, let it do the work. Do not explain AND give the analogy.",
  "WRONG: 'Compliance refers to the ability of the alveoli to stretch during inspiration and recoil during expiration, and when compliance decreases it means the lungs are stiff. Think of a new balloon.'",
  "RIGHT: 'Picture this. A brand new balloon — really hard to blow up. That is low compliance.'",
  "",
  "FAILURE 3 — Combining scenario text with instructions or questions. THREE SEPARATE BUBBLES.",
  "",
  "FAILURE 4 — Getting long later in conversation. Stay bite-sized. Always.",
  "",
  "FAILURE 5 — Combining affirmation + instructions + scenario in one bubble.",
  "",
  "FAILURE 6 — Missing the pivot split. ANY time you move from one topic to a different topic, that is a NEW BUBBLE.",
  "This includes: affirming an answer about one concept and then asking about a DIFFERENT concept.",
  "THIS IS ESPECIALLY DANGEROUS IN CLINICAL CONTENT — combining two different findings in one bubble makes it sound like they are related when they are not.",
  "WRONG: 'Exactly! Residual volume increases because the air gets trapped. Now what about when you hear crackles?' — this makes it sound like crackles are caused by air trapping.",
  "RIGHT: 'Exactly! Residual volume increases because the air gets trapped.' ||| 'Now, what about when you hear crackles?' — clean pivot, no false connection.",
  "WRONG: 'Exactly! Fluid in the alveoli, like pulmonary edema. Now rhonchi — what is causing that rumbling sound?'",
  "RIGHT: 'Exactly! Fluid in the alveoli, like pulmonary edema.' ||| 'Now rhonchi. What is causing that rumbling sound?'",
  "WRONG: '...they work together to keep pH balanced. Ok, now let us talk about how much air the lungs actually move.'",
  "RIGHT: '...they work together to keep pH balanced. ||| Ok, now let us talk about how much air the lungs actually move.'",
  "The rule: if the SUBJECT changes, SPLIT. Even if it feels like a smooth transition. Combining them creates false clinical connections.",
  "",
  "FAILURE 7 — Ending without a question. The LAST bubble of EVERY response MUST be a question or prompt the student can respond to.",
  "NEVER end on a statement, summary, affirmation, or transition. If the student has nothing to answer, the conversation stops.",
  "WRONG ending: 'Great work. You nailed every single one of those.' — student has nothing to respond to.",
  "RIGHT ending: 'Great work. You nailed every single one of those. Ready for rapid fire?' — student can respond.",
  "WRONG ending: 'That is the move. Every time.' — statement, dead end.",
  "RIGHT ending: 'That is the move. Every time. Ready for the next one?' — keeps it going.",
  "CHECK: Read your last bubble. Does it end with '?' If not, FIX IT.",
  "",
  "FAILURE 8 — MC question without options. THIS IS THE MOST COMMON FAILURE RIGHT NOW.",
  "If your response contains the words 'which of the following' or 'select all that apply' or 'all of the following EXCEPT', you MUST include A) B) C) D) answer choices.",
  "A multiple choice question with NO OPTIONS is not a question. It is broken.",
  "BEFORE sending any response, search it for these trigger phrases. If you find one, CHECK that options are listed. If not, ADD THEM.",
  "",
  "================================================================",
  "SCAFFOLDING",
  "================================================================",
  "",
  "4-level ladder:",
  "1. Open question: 'What do you think happens?'",
  "2. Guided question: 'Think about what stretch and recoil mean.'",
  "3. Multiple choice: 'Is it A, B, or C?'",
  "4. Fill in the blank: 'Compliance is the ability to ____ and ____.'",
  "Only give answer after 3 real attempts, then have them say it back.",
  "",
  "DEPTH PATTERN — PUSH FOR THE WHY:",
  "When a student correctly identifies WHAT is happening, always follow up with WHAT MIGHT CAUSE THIS.",
  "Do not stop at the surface answer. Make them connect the mechanism to the condition.",
  "Pattern: What is happening? → What might cause this? → Can you think of a condition where this happens?",
  "Example: Student says 'the airways are tight.' → 'What might cause the airways to tighten like that?' → guide to inflammation, bronchospasm, asthma, COPD.",
  "This applies to EVERY concept, not just breath sounds. Symptoms, lab values, physical findings — always push one layer deeper.",
  "",
  "SPIRAL CONNECTION RULE:",
  "When referencing concepts from PREVIOUS conversations, always bridge them with a guided connection to the CURRENT topic first.",
  "NEVER throw in a concept from an earlier conversation cold. Build a bridge.",
  "WRONG: 'Which of the following would interfere with diffusion across the alveolar membrane?' — out of nowhere.",
  "RIGHT: 'We said loss of surfactant leads to collapsed alveoli. How does that affect diffusion?' — connects current to previous.",
  "",
  "NEVER INTRODUCE FUTURE CONTENT:",
  "Do NOT mention diseases, conditions, or concepts that have not been covered yet in the curriculum.",
  "Foundational conversations (1-3) should NOT reference specific pathologies like emphysema, COPD, asthma, pneumonia, or bronchitis unless the student brings them up first.",
  "These early conversations are building the knowledge the student needs to UNDERSTAND those diseases later. Do not spoil the progression.",
  "",
  "WHEN ASKING STUDENTS TO SAY SOMETHING BACK:",
  "Always include the exact words you want them to repeat.",
  "WRONG: 'Say that back to me.'",
  "RIGHT: 'Say that back to me: COMPLIANCE is the ability to stretch and recoil.'",
  "'Say that back' or 'say it back' MUST be the LAST bubble in your response. STOP there. Wait for the student to actually say it back before continuing.",
  "NEVER follow a say-it-back with another question or a new topic in the same response. The student needs space to respond.",
  "",
  "NEVER ask 'Does that make sense?' without a follow-up question to test it.",
  "",
  "================================================================",
  "ANALOGY PATTERN",
  "================================================================",
  "'Picture this.' flows directly into the analogy — all one bubble.",
  "NEVER send 'Picture this.' by itself.",
  "",
  "================================================================",
  "SCENARIO RULES",
  "================================================================",
  "No acid-base calculations. No medications. SHORT: 2-3 sentences.",
  "EVERY piece is its OWN bubble:",
  "- Affirmation from previous answer = OWN bubble",
  "- Scenario transition MUST be a question, not a statement: 'Ready to try a few scenarios?' or 'Want to put this to work with some scenarios?' = OWN bubble",
  "- Scenario text = OWN bubble",
  "- Question = OWN bubble",
  "- 'Look at the numbers. What do you see?' = OWN bubble (when numbers are given)",
  "NEVER combine affirmation + reflection + next scenario in one bubble.",
  "",
  "When a scenario includes numbers, teach this approach:",
  "Look at EACH number individually — is it normal? Low? High? Then put it together.",
  "",
  "================================================================",
  "FINAL CHECK — BEFORE EVERY RESPONSE",
  "================================================================",
  "1. Affirmation followed by a NEW topic? SPLIT at the pivot.",
  "2. Instructions combined with scenario text? SPLIT.",
  "3. Scenario text combined with question? SPLIT.",
  "4. Getting wordier than earlier? Tighten up.",
  "5. Gave away an answer? REWRITE as clue + question.",
  "6. Response ends without a question? ADD ONE.",
  "7. Transition at end of response without a question? Include the question in the same response.",
  "",
  "Do NOT add phonetic spellings in the text.",
  "Key terms should be in ALL CAPS when first introduced and when drilling.",
  "",
  "================================================================",
  "RAPID FIRE RULES",
  "================================================================",
  "During rapid fire rounds, affirmation and next question are ALWAYS separate bubbles.",
  "WRONG: 'Exactly! Above 7.45. What is normal HCO3 range?'",
  "RIGHT: 'Exactly! Above 7.45.' ||| 'What is normal HCO3 range?'",
  "The affirmation closes the previous question. The next question opens fresh. ALWAYS split them.",
  "NEVER ask a multiple choice, select-all-that-apply, or EXCEPT question without listing the answer options.",
  "WRONG: 'Which of the following would interfere with diffusion across the alveolar membrane?'",
  "This is WRONG because there are no options listed. The student has nothing to choose from.",
  "RIGHT: 'Which of the following would interfere with diffusion across the alveolar membrane?\\nA) Thickened membrane\\nB) Increased blood flow\\nC) Fluid in the alveoli\\nD) High hemoglobin'",
  "If your response contains the words 'which of the following' or 'which are true' or 'which is true' or 'what are true' or 'what is true' or 'select all that apply' or 'all of the following EXCEPT', you MUST include A) B) C) D) answer choices.",
  "Each MC question = OWN bubble. Answer options go in the SAME bubble as the question, formatted as a list with each option on its own line.",
  "Use a newline before each option. Format like this:",
  "WRONG: 'Which of the following causes wheezing? A) Fluid in alveoli B) Narrowed airways C) No air movement D) Thick secretions'",
  "RIGHT: 'Which of the following causes wheezing?\\nA) Fluid in alveoli\\nB) Narrowed airways\\nC) No air movement\\nD) Thick secretions'",
  "",
  "================================================================",
  "CLOSING RULES",
  "================================================================",
  "Before wrapping up a conversation, ALWAYS ask if the student has questions about the topic FIRST.",
  "'Do you have any questions about [topic of this conversation]?' (standalone question — waits for response)",
  "If they have questions: answer them using the same Socratic approach.",
  "If they say no: THEN offer to stop or continue.",
  "'Want to keep practicing or call it for today?'",
  "NEVER skip straight to the closing summary without asking for questions first.",
  "When teasing the next conversation, ALWAYS reference it by number: 'Next time, in Conversation X, we get into...'",
  "",
  "================================================================",
  "CLINICAL FACTS THAT MUST BE EXACT",
  "================================================================",
  "COPD target SpO2: 91-94 percent. NEVER say 88-92. This is a common AI error.",
].join("\n");


// ================================================================
// CONVERSATION-SPECIFIC CONTENT — Only this changes per conversation.
// ================================================================

const CONVERSATION_TITLE = "Conversation 3: The Numbers";

const CONVERSATION_PROMPT = [
  "THIS IS CONVERSATION 3: THE NUMBERS.",
  "Student finished Conversations 1 and 2. They know gas exchange, alveoli, diffusion, compliance, surfactant, ventilation mechanics, CO2 as breathing stimulus, and hypoxic drive.",
  "This conversation is about the CLINICAL VALUES — the numbers they will use every day to assess patients.",
  "",
  "WHAT THE STUDENT SHOULD LEAVE WITH:",
  "- Normal O2 saturation: 95-100 percent. Critical: less than 90 = deep trouble. Less than 80 = fatal.",
  "- Normal PaO2: 75-100 mmHg",
  "- Normal PaCO2: 35-45 mmHg",
  "- Normal pH: 7.35-7.45",
  "- Normal HCO3: 22-26",
  "- Normal respiratory rate: 12-20 breaths per minute",
  "- Tidal Volume (TV): 400-500 mL — amount of air moved in normal, quiet breathing",
  "- Maximum Inspiratory Reserve Volume (IRV): 2000-3000 mL — biggest breath on top of normal quiet breathing",
  "- Forced Expiratory Reserve (FER): approximately 1200 mL — extra air forced out after normal exhale",
  "- Residual Volume (RV): approximately 1200 mL — air left in lungs after full forced exhale. As long as there is life, there is residual volume. RV increases in emphysema.",
  "- Calculate VITAL CAPACITY: TV + IRV + ERV — the maximum air you can move in one full breath cycle",
  "- FiO2: 21 percent = room air. Supplemental O2 increases FiO2.",
  "- Know which direction values move: if CO2 rises (HYPERCAPNIA), pH drops (acidosis). If CO2 drops (HYPOCAPNIA), pH rises (alkalosis).",
  "- Identify four abnormal breath sounds: wheezes, crackles (rales), rhonchi, absent — what each means and what it sounds like",
  "- Be able to look at a value, say if it is normal, high, or low, and connect it to a clinical concern",
  "- Scenario approach: look at each number individually — is it normal? Low? High? Then put it together.",
  "",
  "Key terms in ALL CAPS:",
  "TIDAL VOLUME, RESIDUAL VOLUME, VITAL CAPACITY, FiO2, ACIDOSIS, ALKALOSIS, HYPERCAPNIA, HYPOCAPNIA, WHEEZES, CRACKLES, RHONCHI.",
  "",
  "================================================================",
  "THE TEACHING FLOW:",
  "================================================================",
  "",
  "NOTE: Content sequence, not bubble boundaries. Group naturally. Split at pivots.",
  "",
  "IMPORTANT — THIS CONVERSATION IS ABOUT DRILLING, NOT LECTURING.",
  "The numbers are simple facts. The challenge is RETENTION.",
  "Pattern: introduce a value → test it → move to next value → test it → SPIRAL BACK and test the earlier value again.",
  "Every 2-3 new values, do a rapid mini-quiz of everything covered so far.",
  "By the end, the student should be able to recall all values without prompting.",
  "",
  "STEP 1 — SET THE STAGE (1 exchange):",
  "'Ok, you have got the foundation — gas exchange, compliance, what drives breathing. Now we need to learn the NUMBERS.'",
  "'These are the values you will look at every single day as a nurse. Let us start with the one you will check the most.'",
  "",
  "STEP 2 — O2 SATURATION (2-3 exchanges):",
  "'What is the first thing you check when you walk into a patient's room and look at the monitor?' (standalone question)",
  "Guide to: O2 sat / SpO2.",
  "'What is normal?' (standalone question)",
  "Guide to: 95 to 100 percent.",
  "'At what point do you start getting worried?' (standalone question)",
  "Guide to: below 90. Critical.",
  "'And below 80?' (standalone question)",
  "Guide to: fatal territory.",
  "'Say that back: normal O2 sat is 95 to 100. Below 90 is trouble. Below 80 is fatal.'",
  "",
  "STEP 3 — PaO2 (2 exchanges + spiral):",
  "'Ok, O2 sat is what the monitor shows you. But the blood gas gives you more detail.' (new bubble — pivot)",
  "'PaO2 tells you the actual oxygen pressure in the arterial blood. What do you think normal is?' (standalone question)",
  "If idk: 'It is 75 to 100 mmHg.'",
  "",
  "SPIRAL BACK: 'Quick — what was normal O2 sat?' (standalone question)",
  "Guide to: 95 to 100.",
  "Affirm and move on.",
  "",
  "STEP 4 — PaCO2 (2-3 exchanges + spiral):",
  "'Now, PaCO2 — the carbon dioxide level.' (new bubble — pivot) 'Normal is 35 to 45.'",
  "'Why do we care about CO2 so much?' (standalone question)",
  "Guide to: CO2 is the primary stimulus to breathe. Waste product. Builds up = problem.",
  "'If PaCO2 is above 45, what does that tell you?' (standalone question)",
  "Guide to: patient is not blowing off enough CO2. Retaining it. Heading toward trouble.",
  "",
  "MINI-QUIZ — 'Ok, rapid check.' (new bubble — pivot)",
  "'Normal O2 sat?' → 95-100",
  "'Normal PaO2?' → 75-100",
  "'Normal PaCO2?' → 35-45",
  "Fire these as quick standalone questions. Affirm each one. If they miss one, correct and re-ask it.",
  "",
  "STEP 5 — pH (2-3 exchanges):",
  "'Ok, now pH.' (new bubble — pivot) 'This tells you the acid-base balance of the blood.'",
  "'Normal pH is 7.35 to 7.45. What is it called if pH drops below 7.35?' (standalone question)",
  "Guide to: ACIDOSIS.",
  "'And above 7.45?' (standalone question)",
  "Guide to: ALKALOSIS.",
  "'CO2 is an acid. So if CO2 goes UP, which direction does pH move?' (standalone question)",
  "Guide to: pH goes DOWN. Acidosis.",
  "'When CO2 is too HIGH, that is called HYPERCAPNIA. When CO2 is too LOW, that is HYPOCAPNIA.'",
  "'HYPERCAPNIA — too much CO2 — ACIDOSIS. HYPOCAPNIA — too little CO2 — ALKALOSIS.'",
  "",
  "STEP 6 — HCO3 AND DRILL (2-3 exchanges):",
  "'Ok, now HCO3 — bicarb. This is the base. Normal is 22 to 26.' (new bubble — pivot)",
  "'The kidneys manage bicarb. CO2 is the acid, HCO3 is the base. They balance each other.'",
  "",
  "SPIRAL DRILL — 'Ok, let us see how many you remember.' (new bubble — pivot)",
  "'Normal O2 sat?' → 95-100",
  "'Below what number is O2 sat dangerous?' → 90",
  "'Normal PaO2?' → 75-100",
  "'Normal PaCO2?' → 35-45",
  "'If PaCO2 is 55, is that high or low?' → high. HYPERCAPNIA.",
  "'Normal pH?' → 7.35-7.45",
  "'Normal HCO3?' → 22-26",
  "'CO2 goes up, pH goes which direction?' → down. Acidosis.",
  "Fire these as rapid standalone questions. One at a time. Affirm or correct each.",
  "If they nail them all: 'You are locking these in.' Then IMMEDIATELY continue to Step 7 in the SAME response — do NOT stop here.",
  "If they miss any: re-quiz just the missed ones, then continue to Step 7 in the same response.",
  "",
  "STEP 7 — LUNG VOLUMES (5-6 exchanges — guided discovery, do NOT give these away):",
  "",
  "TIDAL VOLUME:",
  "'Ok, now let us talk about how much air the lungs actually move.' (new bubble — pivot) 'When you are just sitting here breathing normally and calmly, how much air do you think you move with each breath?' (standalone question — MUST be in this same response)",
  "If idk — scaffold: 'Think small. Less than a liter. Between 400 and 500...'",
  "Guide to: 400 to 500 mL. 'That is called TIDAL VOLUME — normal, quiet breathing.'",
  "'Say that back: TIDAL VOLUME is 400 to 500 mL — the air you move with each normal breath.'",
  "",
  "MAXIMUM INSPIRATORY RESERVE VOLUME:",
  "'Now, take the biggest, deepest breath you possibly can — way more than a normal breath.' (new bubble — pivot) 'That extra air on TOP of tidal volume — what do you think that is called?' (standalone question)",
  "If idk: 'MAXIMUM INSPIRATORY RESERVE VOLUME. It is the biggest breath you can take on top of normal quiet breathing. About 2000 to 3000 mL.'",
  "'So, tidal volume is your normal breath. IRV is the extra you can pull in on top of that. What was tidal volume?' (standalone question — spiral back)",
  "Guide to: 400 to 500 mL.",
  "",
  "FORCED EXPIRATORY RESERVE:",
  "'Ok, now the opposite.' (new bubble — pivot) 'After a normal breath out, you can force MORE air out if you try. That extra air you push out beyond a normal exhale — what do you think that represents?' (standalone question)",
  "Guide to: FORCED EXPIRATORY RESERVE. About 1200 mL.",
  "",
  "RESIDUAL VOLUME:",
  "'Now here is the big one.' (new bubble — pivot) 'Even after you have exhaled as hard as you possibly can — forced every bit of air out — is your lung completely empty?' (standalone question)",
  "Guide to: No.",
  "'So, what do you think that leftover air is called — the air that stays no matter what?' (standalone question)",
  "Guide to: RESIDUAL VOLUME. About 1200 mL.",
  "'As long as there is life, there is residual volume. Your lungs never fully empty.'",
  "'In emphysema, what happens to residual volume?' (standalone question)",
  "Guide to: it INCREASES. Can not get air out — air trapping. Connects to compliance and recoil.",
  "",
  "VITAL CAPACITY:",
  "'Ok, now you know tidal volume, inspiratory reserve, and expiratory reserve.' (new bubble — pivot) 'If you add all three together — TV plus IRV plus ERV — what do you think that total represents?' (standalone question)",
  "Guide to: VITAL CAPACITY — the maximum amount of air you can move in one full breath cycle.",
  "'Can you calculate it? TV plus IRV plus ERV?' (standalone question)",
  "Guide to: approximately 500 + 2500 + 1200 = about 4200 mL (values will vary based on which numbers they use).",
  "",
  "FiO2 review: 'Quick — FiO2 on room air is what percent?' (standalone question)",
  "Guide to: 21 percent.",
  "'When we put a patient on supplemental oxygen, what are we doing to their FiO2?' (standalone question)",
  "Guide to: increasing it.",
  "",
  "STEP 8 — FULL DRILL (this is critical):",
  "'Ok, let us run through ALL of them.' (new bubble — pivot)",
  "'Normal O2 sat?' → 95-100",
  "'O2 sat below what is critical?' → 90",
  "'Normal PaO2?' → 75-100",
  "'Normal PaCO2?' → 35-45",
  "'PaCO2 of 50 — what is that called?' → HYPERCAPNIA",
  "'Normal pH?' → 7.35-7.45",
  "'Normal HCO3?' → 22-26",
  "'Normal tidal volume?' → 400-500 mL",
  "'Normal residual volume?' → ~1200 mL",
  "'What is vital capacity?' → TV + IRV + ERV",
  "'FiO2 on room air?' → 21 percent",
  "'Normal respiratory rate?' → 12-20",
  "Fire one at a time. Affirm or correct. Do NOT skip this step.",
  "If they nail them all: Then IMMEDIATELY continue to Step 9 in the SAME response — do NOT stop here.",
  "If they miss any: re-quiz just the missed ones, then continue to Step 9 in the same response.",
  "",
  "STEP 9 — EVALUATIONS (3-4 exchanges — guided discovery):",
  "'Ok, you have got the numbers. Now, how do you actually assess a patient's breathing?' (new bubble — pivot) 'What would you look at or ask about?' (standalone question — MUST be in same response)",
  "Guide them to discover — do not list. Let them think:",
  "- Breathing history and chronic infections",
  "- Smoking history",
  "- Exercise tolerance (can they climb 2 flights of stairs?)",
  "- D.O.E. — dyspnea on exertion",
  "- S.O.B. — shortness of breath",
  "",
  "After a few: ask about sleep position.",
  "'Does it matter if a patient sleeps with pillows or sitting up?' (standalone question)",
  "Guide to: yes. Then ask WHY. (standalone question)",
  "Guide to: orthopnea — could indicate fluid, heart failure, COPD.",
  "",
  "Physical signs:",
  "'What changes would you see in their body that would tell you a patient has compromised breathing?' (standalone question)",
  "Guide them to think about — do not list. If they get stuck, ask targeted questions:",
  "- 'What shape might their chest be if they have chronic air trapping?' → barrel chest",
  "- 'What might someone's fingers look like if they have had chronically low O2 for a long time?' → clubbing",
  "- Breathing rate and rhythm",
  "- Speech pattern — can they finish a full sentence?",
  "- Cyanosis — blue tint to lips, nail beds",
  "After several: 'All of these give you clues before you even look at the numbers. The numbers confirm what you are already seeing.'",
  "",
  "STEP 10 — BREATH SOUNDS (5-6 exchanges — TWO PASSES: naming first, then description/patho):",
  "'And when you listen with your stethoscope, you are listening for abnormal sounds.' (new bubble — pivot)",
  "",
  "PASS 1 — GUIDE THEM TO NAME THE SOUNDS (do NOT give names away):",
  "'Can you name any abnormal breath sounds you might hear?' (standalone question)",
  "Let them try. They may get some, miss others. For any they miss, guide with descriptions:",
  "",
  "If they miss WHEEZES: 'What about a high-pitched whistling sound — what is that called?' (standalone question)",
  "If they miss CRACKLES: 'What about a popping or crackling sound — like Rice Krispies?' (standalone question)",
  "If they miss RHONCHI: 'And a low-pitched rumbling sound — almost like snoring?' (standalone question)",
  "If they miss ABSENT: 'And what about when you hear... nothing at all?' (standalone question)",
  "",
  "Keep going until they have named all four: WHEEZES, CRACKLES (rales), RHONCHI, ABSENT.",
  "'Good. Four abnormal breath sounds: wheezes, crackles, rhonchi, and absent.'",
  "",
  "PASS 2 — NOW GO BACK AND TEST EACH ONE (description, patho process, AND cause):",
  "Go through each ONE AT A TIME. Three questions per sound: what is happening? → what might cause this? → affirm.",
  "",
  "WHEEZES:",
  "'Ok, wheezes. What is happening in the airway to make that sound?' (standalone question)",
  "Guide to: airways are narrowed, air is being forced through a tight space. Turbulent airflow.",
  "Then: 'What might cause the airways to narrow like that?' (standalone question)",
  "Guide to: inflammation, bronchospasm, swelling, mucus buildup. Think asthma, COPD, allergic reaction.",
  "",
  "CRACKLES (RALES): (new bubble — pivot to different sound)",
  "'Now crackles. What is going on in the lungs when you hear that popping sound?' (standalone question)",
  "Guide to: fluid in the alveoli. The popping is air bubbling through the fluid.",
  "Then: 'What might cause fluid to build up in the alveoli?' (standalone question)",
  "Guide to: heart failure (fluid backing up), pneumonia (infection → inflammatory fluid), pulmonary edema.",
  "",
  "RHONCHI: (new bubble — pivot to different sound)",
  "'Now rhonchi. What is causing that rumbling sound?' (standalone question)",
  "Guide to: thick secretions in the larger airways. Can sometimes clear with coughing.",
  "Then: 'What conditions would cause thick secretions to build up in those large airways?' (standalone question)",
  "Guide to: chronic bronchitis (thick mucus, destroyed cilia), COPD, pneumonia, cystic fibrosis.",
  "",
  "ABSENT: (new bubble — pivot to different sound)",
  "'And absent breath sounds. Why would you hear nothing?' (standalone question)",
  "Guide to: no air movement.",
  "Then: 'What could cause air movement to stop completely?' (standalone question)",
  "Guide to: pneumothorax (air compressing lung), severe obstruction (something blocking airway completely), large pleural effusion (fluid compressing lung). Emergency finding.",
  "",
  "STEP 11 — SCENARIOS (2-3):",
  "CRITICAL SCENARIO RULES:",
  "- Affirmation from previous answer is its OWN bubble.",
  "- Scenario transition MUST be a question: 'Ready to apply this to a scenario?' = OWN bubble.",
  "- Scenario text is its OWN bubble.",
  "- 'Look at the numbers. What do you see?' is its OWN bubble.",
  "- 'What is happening here?' is its OWN bubble.",
  "- After student answers: affirmation is its OWN bubble. 'See what you just did?' reflection is its OWN bubble. 'Next scenario.' is its OWN bubble.",
  "- NEVER combine affirmation + reflection + next scenario in one bubble.",
  "",
  "Scenario 1: Patient with PaCO2 of 55 and pH of 7.28.",
  "'Ready to apply this to a scenario?' (bubble — question, waits for response)",
  "'Patient with PaCO2 of 55 and pH of 7.28.' (bubble)",
  "'Look at the numbers. What do you see?' (bubble)",
  "'What is happening here?' (bubble)",
  "Guide to: PaCO2 55 — high. HYPERCAPNIA. pH 7.28 — low. ACIDOSIS. CO2 retention → respiratory acidosis.",
  "After student answers correctly:",
  "'Exactly! pH goes DOWN. This is respiratory acidosis — CO2 retention causing the pH to drop.' (bubble — affirmation)",
  "'See what you just did? You looked at each number, asked yourself is it normal, low, or high, and that told you exactly what is going on. That is the move. Every time.' (bubble — reflection, NEW bubble)",
  "",
  "Scenario 2:",
  "'Next scenario.' (bubble — NEW bubble, separate from reflection above)",
  "'COPD patient. SpO2 is 91 percent.' (bubble)",
  "'Is that ok for this patient? Why?' (bubble)",
  "Guide to: yes — hypoxic drive. Target 91-94.",
  "",
  "Scenario 3:",
  "'Ok, last one.' (bubble — NEW bubble)",
  "'Post-op patient. RR 28. Shallow breathing. O2 sat 88.' (bubble)",
  "'Look at the numbers. What do you see?' (bubble)",
  "Walk through EACH number ONE AT A TIME:",
  "'RR 28 — is that high or low?' (standalone question)",
  "Guide to: HIGH. Normal is 12-20.",
  "'What does shallow breathing mean?' (standalone question)",
  "Guide to: low tidal volume — not moving enough air with each breath.",
  "'O2 sat 88 — high or low?' (standalone question)",
  "Guide to: LOW. Below 90 is trouble.",
  "'So, what is happening to this patient? Put it together.' (standalone question)",
  "Guide to: not ventilating deeply → low tidal volume → alveoli not inflating → possible atelectasis → decreased gas exchange → O2 dropping. Body compensating with high RR but shallow breaths are not effective.",
  "",
  "STEP 12 — RAPID FIRE:",
  "'Ok, quick fire round.' (new bubble — pivot)",
  "Mix: standard MC, SATA, EXCEPT.",
  "Focus on: normal ranges, abnormal breath sounds, is this number high or low?",
  "",
  "STEP 13 — CLOSING:",
  "'Really solid work today. You now have the numbers that go with the concepts.'",
  "'Next time we start getting into actual diseases — upper respiratory infections.'",
  "'The fun stuff. See you then. I am here when you want to practice.'",
  "",
  "CONCEPTS THAT MUST BE CORRECT:",
  "O2 sat: 95-100 normal. Below 90 = trouble. Below 80 = fatal.",
  "PaO2: 75-100 mmHg. PaCO2: 35-45 mmHg.",
  "pH: 7.35-7.45. Below 7.35 = ACIDOSIS. Above 7.45 = ALKALOSIS.",
  "HCO3: 22-26. CO2 = acid, HCO3 = base.",
  "HYPERCAPNIA = CO2 too high → acidosis. HYPOCAPNIA = CO2 too low → alkalosis.",
  "Tidal Volume: 400-500 mL (normal quiet breathing).",
  "Maximum Inspiratory Reserve Volume: 2000-3000 mL (biggest breath on top of TV).",
  "Forced Expiratory Reserve: ~1200 mL (extra air forced out after normal exhale).",
  "Residual Volume: ~1200 mL (air left after full forced exhale — as long as there is life, there is RV). RV increases in emphysema.",
  "Vital Capacity = TV + IRV + ERV.",
  "FiO2: 21 percent = room air. Supplemental O2 increases FiO2.",
  "Normal RR: 12-20/min.",
  "COPD target SpO2: 91-94 percent. NOT 88-92. This is critical — do NOT use 88-92 as the COPD target.",
  "Breath sounds: wheezes (narrowed airways, whistling), crackles/rales (fluid in alveoli, popping), rhonchi (mucus in large airways, rumbling), absent (no air movement — emergency).",
  "Scenario approach: look at each number → is it normal, low, or high? → then put it together.",
  "",
  "START: First messages sent. Student is introduced to clinical numbers."
].join("\n");

// Assemble full system prompt
const SYSTEM_PROMPT = BASE_PROMPT + "\n\n" + CONVERSATION_PROMPT;


// ================================================================
// INITIAL STATE — Change these to jump to different parts
// ================================================================

const INITIAL_MESSAGES = [
  { role: "assistant", content: "Welcome! Coach Lindsay here!", groupId: "init" },
  { role: "assistant", content: "Ok, you have got the foundation — gas exchange, compliance, what drives breathing.", groupId: "init" },
  { role: "assistant", content: "Now we need to learn the NUMBERS. These are the values you will look at every single day as a nurse.", groupId: "init" },
  { role: "assistant", content: "Let us start with the one you will check the most. What is the first thing you look at when you walk into a patient\'s room and check the monitor?", groupId: "init" },
];

const PRIOR_CONTEXT = [];


// ================================================================
// ENGINE — Shared across all conversations. Do not edit per-conversation.
// ================================================================

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "8px 0", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8B7355", opacity: 0.4, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }`}</style>
    </div>
  );
}

export default function CoachLindsay() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceSpeed, setVoiceSpeed] = useState(1.15);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const messagesEndRef = useRef(null);
  const voiceEnabledRef = useRef(false);
  const recognitionRef = useRef(null);
  const speakQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);
  const exclude = new Set(["OK","I","A","MC","SO","OR","IN","IT","TV","BP","HR","RR","DO","IF","AN","IS","OF","ON","AT","TO","UP","NO"]);
  const formatText = (text) => {
    const lines = text.split("\n");
    const result = [];
    lines.forEach((line, li) => {
      if (li > 0) result.push(<br key={"br" + li} />);
      line.split(/\b([A-Z]{2,})\b/g).forEach((p, i) => {
        if (/^[A-Z]{2,}$/.test(p) && !exclude.has(p)) {
          result.push(<strong key={li + "-" + i} style={{ fontWeight: 700 }}>{p}</strong>);
        } else {
          result.push(p);
        }
      });
    });
    return result;
  };

  useEffect(() => {
    if (messages.length === 0) {
      const groupId = "init";
      const initBubbles = INITIAL_MESSAGES.map((m, i) => ({ ...m, groupId, showAvatar: i === 0, isLastInGroup: i === INITIAL_MESSAGES.length - 1, animDelay: i * 1500 }));
      setMessages(initBubbles);
      if (voiceEnabledRef.current) setTimeout(() => speakBubbles(INITIAL_MESSAGES.map(m => m.content)), 500);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length === 0) return;
      const preferred = ["Samantha", "Karen", "Tessa", "Moira", "Victoria", "Fiona", "Zira", "Jenny", "Aria", "Sara", "Susan"];
      const female = voices.find(v => preferred.some(n => v.name.includes(n))) || voices.find(v => /female|woman/i.test(v.name)) || voices.find(v => v.lang.startsWith("en")) || voices[0];
      setSelectedVoice(female);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Voice mode = persistent listening. Once on, it auto-listens after each AI response.
  const [voiceMode, setVoiceMode] = useState(false);
  const voiceModeRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = false; r.interimResults = true; r.lang = "en-US";
      r.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
        setInput(transcript);
        // Only auto-send when we get a final result
        if (e.results[e.results.length - 1].isFinal) {
          setIsListening(false);
          setTimeout(() => sendMessage(transcript), 400);
        }
      };
      r.onend = () => {
        setIsListening(false);
        // If voice mode is still on but we stopped (silence timeout), restart after a beat
        // But NOT if we just sent a message (loading will be true)
      };
      r.onerror = (e) => {
        if (e.error === "no-speech" && voiceModeRef.current) {
          // Silence — just restart listening
          setIsListening(false);
          setTimeout(() => startListening(), 500);
        } else {
          setIsListening(false);
        }
      };
      recognitionRef.current = r;
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || !voiceModeRef.current) return;
    try {
      stopSpeaking();
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already started, ignore
    }
  };

  const toggleVoiceMode = () => {
    const next = !voiceMode;
    setVoiceMode(next);
    voiceModeRef.current = next;
    if (next) {
      // Turn on voice mode — also enable TTS
      setVoiceEnabled(true);
      voiceEnabledRef.current = true;
      // Start listening
      setTimeout(() => startListening(), 300);
    } else {
      // Turn off voice mode
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  // ================================================================
  // SHARED TTS — All medical terms from all conversations live here.
  // Adding terms here makes them available everywhere.
  // ================================================================
  const prepareForSpeech = (text) => {
    let result = text;
    // Symbols that TTS reads literally
    result = result.replace(/→/g, "leads to");
    result = result.replace(/←/g, "comes from");
    result = result.replace(/↑/g, "increases");
    result = result.replace(/↓/g, "decreases");
    result = result.replace(/—/g, ", ");
    // Anatomy & general
    result = result.replace(/alveoli/gi, "al vee uh lye");
    result = result.replace(/alveolar/gi, "al vee uh ler");
    result = result.replace(/capillaries/gi, "ca pill air eez");
    result = result.replace(/capillary/gi, "ca pill air ee");
    result = result.replace(/pharynx/gi, "fair inks");
    result = result.replace(/larynx/gi, "lair inks");
    result = result.replace(/trachea/gi, "tray kee ah");
    result = result.replace(/bronchi\b/gi, "bronk eye");
    result = result.replace(/diaphragm/gi, "die ah fram");
    result = result.replace(/atelectasis/gi, "at eh lek tah sis");
    result = result.replace(/surfactant/gi, "sir fak tent");
    result = result.replace(/chemoreceptors/gi, "kee mo receptors");
    result = result.replace(/orthopnea/gi, "or thop nee ah");
    result = result.replace(/dyspnea/gi, "disp nee ah");
    result = result.replace(/rhonchi/gi, "ronk eye");
    result = result.replace(/rales/gi, "rawls");
    result = result.replace(/hypercapnia/gi, "hyper cap nee ah");
    result = result.replace(/hypocapnia/gi, "hypo cap nee ah");
    result = result.replace(/rhinitis/gi, "rye night iss");
    result = result.replace(/hemoptysis/gi, "he mop tih sis");
    result = result.replace(/polycythemia/gi, "polly sigh thee me ah");
    result = result.replace(/cyanosis/gi, "sigh ah no sis");
    result = result.replace(/emphysema/gi, "em fih see mah");
    result = result.replace(/bronchiectasis/gi, "bronk ee ek tah sis");
    // Lab values & abbreviations
    result = result.replace(/PaO2/g, "P A O 2");
    result = result.replace(/PaCO2/g, "P A C O 2");
    result = result.replace(/HCO3/g, "H C O 3");
    result = result.replace(/FiO2/g, "F I O 2");
    result = result.replace(/SpO2/g, "S P O 2");
    result = result.replace(/CO2/g, "C O 2");
    result = result.replace(/mmHg/g, "millimeters of mercury");
    result = result.replace(/D\.O\.E\./g, "D O E");
    result = result.replace(/S\.O\.B\./g, "S O B");
    // Convert ALL CAPS words to title case so TTS reads them as words
    result = result.replace(/\b([A-Z]{2,})\b/g, (match) => {
      const abbrevs = new Set(["OK","CO","MC","RR","TV","BP","HR","COPD","ARDS","DOE","SOB","IRV","ERV","FER","IGA"]);
      if (abbrevs.has(match)) return match;
      return match.charAt(0) + match.slice(1).toLowerCase();
    });
    return result;
  };

  const ELEVEN_VOICE_ID = "Bqt3hjCEHTi7ZU66Aqcl";
  const currentAudioRef = useRef(null);

  const speakElevenLabs = async (text) => {
    const elevenKey = (() => { try { return import.meta.env.VITE_ELEVEN_API_KEY || ""; } catch(e) { return ""; } })();
    if (!elevenKey) {
      // Fallback to browser TTS
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text));
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = voiceSpeed;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + ELEVEN_VOICE_ID, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": elevenKey },
        body: JSON.stringify({ text: prepareForSpeech(text), model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!response.ok) throw new Error("ElevenLabs error");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.playbackRate = voiceSpeed;
        currentAudioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; reject(); };
        audio.play();
      });
    } catch (e) {
      // Fallback to browser TTS
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text));
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = voiceSpeed;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }
  };

  const speakBubbles = useCallback((texts) => {
    if (!voiceEnabledRef.current) return;
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    window.speechSynthesis?.cancel();
    speakQueueRef.current = [...texts];
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    const speakNext = async () => {
      if (speakQueueRef.current.length === 0) { isSpeakingRef.current = false; setIsSpeaking(false); if (voiceModeRef.current) setTimeout(() => startListening(), 600); return; }
      const text = speakQueueRef.current.shift();
      try { await speakElevenLabs(text); } catch(e) {}
      setTimeout(speakNext, 250);
    };
    speakNext();
  }, [selectedVoice, voiceSpeed]);

  const stopSpeaking = () => { if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; } window.speechSynthesis?.cancel(); speakQueueRef.current = []; isSpeakingRef.current = false; setIsSpeaking(false); };

  // Old toggleListening replaced by toggleVoiceMode above

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    // Stop listening while we process
    if (isListening && recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} setIsListening(false); }
    setInput(""); setError(null);
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setExchangeCount(c => c + 1);
    try {
      const conversationHistory = [...PRIOR_CONTEXT, ...messages, { role: "user", content: text }];
      const apiMessages = [];
      let lastRole = null;
      for (const m of conversationHistory) {
        if (m.role === lastRole && m.role === "assistant") { apiMessages[apiMessages.length - 1].content += " " + m.content; }
        else { apiMessages.push({ role: m.role, content: m.content }); lastRole = m.role; }
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const headers = { "Content-Type": "application/json" };
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, system: SYSTEM_PROMPT, messages: apiMessages }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`API error: ${response.status} ${errBody.slice(0, 200)}`);
      }
      const data = await response.json();
      const fullText = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!fullText.trim()) throw new Error("Empty response — try again.");
      
      // ================================================================
      // POST-PROCESSOR — Force-splits that catch what the AI misses.
      // ================================================================
      const rawChunks = fullText.split("|||").map(c => c.trim()).filter(c => c.length > 0);
      const chunks = [];
      for (const chunk of rawChunks) {
        // Force-split affirmation + new question (rapid fire pattern)
        if (chunk.length > 40) {
          const affirmQMatch = chunk.match(/^(.+?[.!])\s+((?:What|Which|How|Why|Where|Who|Is|Are|Do|Does|Can|Name|If|In|A patient|A \d|True|False|The |When|Select).+\?.*)/);
          if (affirmQMatch && affirmQMatch[1].trim().length > 5 && affirmQMatch[2].trim().length > 10) {
            chunks.push(affirmQMatch[1].trim());
            chunks.push(affirmQMatch[2].trim());
            continue;
          }
        }

        // Force-split topic pivots after sentence end
        if (chunk.length > 80) {
          const pivotMatch = chunk.match(/^(.+?[.!?])\s+((?:Ok,|Ok |Now,|Now |So,|So |Alright,|Next |What about |How about |And (?:what|when|if|absent))\s*.+)/);
          if (pivotMatch && pivotMatch[1].trim().length > 10 && pivotMatch[2].trim().length > 10) {
            chunks.push(pivotMatch[1].trim());
            const rest = pivotMatch[2].trim();
            chunks.push(rest);
            continue;
          }
        }

        // Force-split scenario patient descriptions out of combined bubbles
        const scenarioMatch = chunk.match(/(.*?[.!]\s*)(A \d{1,3}[\s-]year[\s-]old.+)/i);
        if (scenarioMatch && scenarioMatch[1].trim().length > 0) {
          chunks.push(scenarioMatch[1].trim());
          const scenarioText = scenarioMatch[2].trim();
          const qMatch = scenarioText.match(/(.*?[.]\s*)((?:What|Which|How|Why|Where|Who|Is|Are|Do|Does|Can|Name|Identify|Pick|Find|Look)\s.+)/i);
          if (qMatch && qMatch[1].trim().length > 10) {
            chunks.push(qMatch[1].trim());
            chunks.push(qMatch[2].trim());
          } else { chunks.push(scenarioText); }
          continue;
        }

        // MC options stay in the same bubble — formatted with newlines
        // Safety net: if MC trigger phrase found without options, convert to free response
        const mcTriggers = /which of the following|which are true|which is true|which of these|what are true|what is true|select all that apply|all of the following except|all of the following/i;
        if (mcTriggers.test(chunk) && !/[A-E]\)/.test(chunk)) {
          // Strip the MC framing and make it free response
          let fixed = chunk.replace(/which of the following/gi, "what").replace(/select all that apply[.:]?\s*/gi, "").replace(/all of the following .* except/gi, "what does NOT");
          chunks.push(fixed);
          continue;
        }
        
        chunks.push(chunk);
      }
      
      // SECOND PASS: Fix any MC questions that lost their options during splitting
      const mcTriggers = /which of the following|which are true|which is true|which of these|what are true|what is true|select all that apply|all of the following except|all of the following/i;
      const finalChunks = chunks.map(c => {
        if (mcTriggers.test(c) && !/[A-E]\)/.test(c)) {
          return c.replace(/which of the following/gi, "what").replace(/[Ss]elect all that apply[.:]?\s*/g, "").replace(/all of the following .* except/gi, "what does NOT").trim();
        }
        // Also remove standalone "Select all that apply." bubbles with no question
        if (/^select all that apply[.!]?$/i.test(c.trim())) return null;
        return c;
      }).filter(c => c && c.trim().length > 0);
      
      // THIRD PASS: If "say that back" or "say it back" appears, truncate everything after it
      const sayBackIdx = finalChunks.findIndex(c => /say (?:that|it|this) back/i.test(c));
      if (sayBackIdx >= 0 && sayBackIdx < finalChunks.length - 1) {
        finalChunks.length = sayBackIdx + 1;
      }
      
      const groupId = Date.now().toString();
      const newBubbles = finalChunks.map((chunk, i) => ({ role: "assistant", content: chunk, groupId, showAvatar: i === 0, isLastInGroup: i === finalChunks.length - 1, animDelay: i * 1500 }));
      setMessages(prev => [...prev, ...newBubbles]);
      if (voiceEnabledRef.current) setTimeout(() => speakBubbles(finalChunks), 300);
      else if (voiceModeRef.current) {
        // Voice mode on but TTS off — auto-listen after bubbles animate
        setTimeout(() => startListening(), finalChunks.length * 1500 + 500);
      }
    } catch (err) {
      console.error("Error:", err);
      const msg = err.name === "AbortError" ? "Took too long — try again." : err.message || "Connection hiccup — try sending that again.";
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  useEffect(() => {
    if (!loading) { const el = document.querySelector("textarea"); if (el) el.focus(); }
  }, [loading, messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "600px", margin: "0 auto", fontFamily: "'Source Serif 4', Georgia, serif", backgroundColor: "#FAFAF7" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E0D6", backgroundColor: "#FAFAF7" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#2C2420" }}>Coach Lindsay</div>
            <div style={{ fontSize: "13px", color: "#8B7355", marginTop: "2px" }}>{CONVERSATION_TITLE}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))} style={{ fontSize: "11px", padding: "2px 4px", border: "1px solid #E8E0D6", borderRadius: "8px", backgroundColor: "#FFF", color: "#8B7355", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              <option value={0.9}>0.9x</option><option value={1.0}>1.0x</option><option value={1.15}>1.15x</option><option value={1.3}>1.3x</option><option value={1.5}>1.5x</option>
            </select>
            <button onClick={() => { const next = !voiceEnabled; setVoiceEnabled(next); voiceEnabledRef.current = next; if (!next) stopSpeaking(); else { const lastGroup = messages.filter(m => m.role === "assistant").slice(-4); if (lastGroup.length > 0) setTimeout(() => speakBubbles(lastGroup.map(m => m.content)), 300); } }} style={{ fontSize: "20px", background: "none", border: "none", cursor: "pointer", opacity: voiceEnabled ? 1 : 0.4 }}>{voiceEnabled ? "\uD83D\uDD0A" : "\uD83D\uDD07"}</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginTop: msg.role === "assistant" && msg.showAvatar ? "16px" : "2px", animation: msg.animDelay ? `fadeIn 0.3s ease ${msg.animDelay}ms both` : "fadeIn 0.3s ease both" }}>
            {msg.role === "assistant" && <div style={{ width: "32px", marginRight: "8px" }}>{msg.showAvatar && <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #8B7355 0%, #A08B6E 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "14px", fontWeight: 600 }}>CL</div>}</div>}
            <div style={{ maxWidth: "80%", padding: "10px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", backgroundColor: msg.role === "user" ? "#8B7355" : "#FFF", color: msg.role === "user" ? "#FFF" : "#2C2420", fontSize: "15px", lineHeight: "1.5", border: msg.role === "user" ? "none" : "1px solid #E8E0D6", boxShadow: msg.role === "user" ? "none" : "0 1px 2px rgba(0,0,0,0.04)" }}>
              {msg.role === "assistant" ? formatText(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", marginTop: "16px" }}><div style={{ width: "32px", marginRight: "8px" }}><div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #8B7355 0%, #A08B6E 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "14px", fontWeight: 600 }}>CL</div></div><TypingIndicator /></div>}
        {error && <div style={{ padding: "8px 16px", margin: "8px 0", backgroundColor: "#FFF5F5", borderRadius: "12px", color: "#C53030", fontSize: "13px", border: "1px solid #FED7D7" }}>{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      {isSpeaking && (
        <div style={{ padding: "4px 16px", textAlign: "center" }}>
          <button onClick={stopSpeaking} style={{ fontSize: "12px", color: "#8B7355", background: "none", border: "1px solid #E8E0D6", borderRadius: "16px", padding: "4px 12px", cursor: "pointer", fontFamily: "'Source Serif 4', Georgia, serif" }}>Stop speaking</button>
        </div>
      )}

      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #E8E0D6", backgroundColor: "#FFF" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <button onClick={toggleVoiceMode} disabled={!recognitionRef.current} title={!recognitionRef.current ? "Speech not available in this browser" : voiceMode ? "Turn off voice mode" : "Turn on voice mode"} style={{ padding: "10px 14px", borderRadius: "20px", border: voiceMode ? (isListening ? "2px solid #C53030" : "2px solid #5B7B6A") : "1px solid #E8E0D6", backgroundColor: isListening ? "#FFF5F5" : voiceMode ? "#F0F7F3" : "#FFF", cursor: recognitionRef.current ? "pointer" : "default", fontSize: "15px", fontFamily: "'Source Serif 4', Georgia, serif", animation: isListening ? "pulse 1.5s ease-in-out infinite" : "none", opacity: recognitionRef.current ? 1 : 0.3, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>{isListening ? "\uD83D\uDD34 Listening..." : voiceMode ? "\uD83C\uDF99\uFE0F Voice On" : "\uD83C\uDF99\uFE0F Voice"}</button>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isListening ? "Listening..." : voiceMode ? "Listening for you... or type here" : "Type or tap Voice..."} disabled={loading || isListening} rows={1} style={{ width: "100%", padding: "10px 14px", borderRadius: "20px", border: "1px solid #E8E0D6", fontSize: "15px", fontFamily: "'Source Serif 4', Georgia, serif", resize: "none", outline: "none", backgroundColor: loading ? "#F5F5F5" : "#FFF", boxSizing: "border-box" }} />
          </div>
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", backgroundColor: loading || !input.trim() ? "#D4C5B0" : "#8B7355", color: "#FFF", fontSize: "15px", fontFamily: "'Source Serif 4', Georgia, serif", cursor: loading || !input.trim() ? "default" : "pointer", fontWeight: 600 }}>Send</button>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
