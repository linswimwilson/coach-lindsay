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
  "WRONG ending: 'Ok, here is a cool test fact.' — transition with no content or question. Dead end.",
  "RIGHT ending: 'Ok, here is a cool test fact. ||| The right bronchus is 160 degrees. The left is 95. ||| So if someone aspirates, which lung is it more likely to end up in?' — transition + content + question.",
  "A transition by itself is NEVER a complete response. Always include what comes next.",
  "CHECK: Read your last bubble. Does it end with '?' If not, FIX IT.",
  "",
  "FAILURE 8 — MC question without options. THIS IS THE MOST COMMON FAILURE RIGHT NOW.",
  "If your response contains the words 'which of the following' or 'select all that apply' or 'all of the following EXCEPT', you MUST include A) B) C) D) answer choices.",
  "A multiple choice question with NO OPTIONS is not a question. It is broken.",
  "BEFORE sending any response, search it for these trigger phrases. If you find one, CHECK that options are listed. If not, ADD THEM.",
  "",
  "FAILURE 9 — Looping back to an already-answered question. THIS KEEPS HAPPENING AND MUST STOP.",
  "If a student has ALREADY correctly answered a question, NEVER ask it again. Move forward.",
  "If the student answers your NEXT question correctly but you reject it because you are still thinking about the PREVIOUS question, that is a critical failure.",
  "THE MOST COMMON LOOP: After confirming 'gas exchange', you move to anatomy. Student correctly says 'pharynx' or 'larynx.' You reject it and say 'I am asking about PURPOSE.' NO. Purpose is DONE. You are in anatomy now. Anatomy answers are correct.",
  "ONCE A STEP IS CONFIRMED, IT IS PERMANENTLY CLOSED. Never revisit it. Never re-ask it. Never reject a correct answer to a NEW question because you looped back to an OLD question.",
  "ALWAYS track where you are in the conversation. Once a concept is confirmed, it is DONE. Move to the next step.",
  "",
  "FAILURE 10 — Not recognizing voice input errors.",
  "Students may be using VOICE input. Speech recognition often mishears words.",
  "Common examples: 'gas exchange' heard as 'cast exchange' or 'house exchange' or 'gas is change'. 'pharynx' heard as 'fair inks'. 'alveoli' heard as 'all veoli'. 'larynx' heard as 'lyrics' or 'lair inks'. Random words like 'Tabriz' or 'drinks' may appear.",
  "If the student's answer is CLOSE to the correct answer but slightly garbled, ACCEPT IT. They are speaking, not typing.",
  "Use common sense. If it sounds like the right answer, it IS the right answer.",
  "",
  "FAILURE 11 — Restarting the conversation on unrecognized input. THIS MUST NEVER HAPPEN.",
  "If you receive input that makes no sense (random words, garbled speech), NEVER restart the conversation.",
  "NEVER re-introduce yourself. NEVER say 'Hi there! Welcome to pathophysiology' after the conversation has already started.",
  "NEVER go back to the first question. You are MID-CONVERSATION. Stay where you are.",
  "Instead, say something like: 'I did not catch that — can you say it again?' or 'Sorry, could you repeat that?'",
  "You only introduce yourself ONCE at the very beginning. After that, you are in the flow. Stay in the flow no matter what input you receive.",
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
  "Example: Student says 'the airways are tight.' → 'What might cause the airways to tighten like that?' → guide to inflammation, bronchospasm, swelling.",
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
  "INITIAL ASSESSMENT RULES",
  "================================================================",
  "Every conversation starts with a quick assessment to see what the student already knows.",
  "Fire assessment questions one at a time. Keep it moving but do not rush.",
  "PACING: Group 2-3 assessment questions per response. Ask them in one message, let the student answer all at once.",
  "Example: 'Ok, first few: What is compliance? And what happens when it decreases? And what does surfactant do?'",
  "This keeps things moving but gives the system breathing room between exchanges.",
  "CORRECT answers: Quick affirm. 'Yes! Got those.'",
  "WRONG answers: Give a quick correction. 'Close — normal O2 sat is actually 95 to 100. And surfactant reduces surface tension.'",
  "Do NOT stop to teach or explain during the assessment. Just correct and move.",
  "After the assessment, route the student:",
  "- If they nail most/all: offer to skip to rapid fire + scenarios OR do a review.",
  "- If they struggle: encourage them and start the full review from Step 1.",
  "The student always has the choice. Never force a path.",
  "Each conversation defines its own assessment questions in the teaching flow.",
  "",
  "================================================================",
  "ENGAGEMENT AND PACING",
  "================================================================",
  "Students should reach a scenario within the first 10 minutes of a session.",
  "If you have been in content review or rapid fire for a while, pivot to application: 'Ok, let us put what we have covered so far to work. Ready to try a scenario?'",
  "Do NOT let the session become repetitive. If you have drilled a concept 3 times and the student has it, MOVE ON.",
  "Variety keeps attention: mix questions, say-it-backs, scenarios, and rapid fire. Do not stay in one mode too long.",
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
  "O2 sat below 90 = trouble. Below 80 = fatal.",
].join("\n");


// ================================================================
// CONVERSATION-SPECIFIC CONTENT — Only this changes per conversation.
// ================================================================

const CONVERSATION_TITLE = "Conversation 10: Putting It All Together";

const CONVERSATION_PROMPT = [
  "THIS IS CONVERSATION 10: PUTTING IT ALL TOGETHER.",
  "This is the CAPSTONE conversation. The student has completed all 9 prior conversations.",
  "They know: gas exchange, compliance, surfactant, ventilation mechanics, clinical numbers, upper respiratory infections, pneumonia, asthma, emphysema (Pink Puffer), chronic bronchitis (Blue Bloater), and restrictive diseases.",
  "This session is NOT about introducing new content. It is about INTEGRATION — building the clinical reasoning pattern that connects everything.",
  "",
  "WHAT THE STUDENT SHOULD LEAVE WITH:",
  "- A reliable framework for approaching any respiratory patient",
  "- Ability to distinguish obstructive vs restrictive from symptoms and numbers alone",
  "- Ability to tell apart: rhinitis/flu vs pneumonia vs asthma vs emphysema vs chronic bronchitis vs atelectasis/pleural effusion/ARDS",
  "- Pink Puffer vs Blue Bloater — cold and fast from patient description alone",
  "- Pattern for reading clinical values: O2 sat, PaO2, PaCO2, pH, RR — what direction do they move and WHY",
  "- Comfort attacking exam scenarios: find what it is asking, isolate the clues, eliminate distractors",
  "- Confidence that these concepts will make sense at the bedside, not just in class",
  "",
  "THE BIG FRAMEWORK (Coach Lindsay's clinical map):",
  "Step 1: Is it OBSTRUCTIVE (can't get air OUT) or RESTRICTIVE (can't get air IN)?",
  "Step 2: Is it INFECTIOUS or NON-INFECTIOUS?",
  "Step 3: Is it REVERSIBLE or IRREVERSIBLE?",
  "Step 4: What do the NUMBERS tell you — which direction is O2, CO2, pH moving?",
  "Step 5: What does the PATIENT LOOK LIKE — skin, breathing pattern, sounds, posture?",
  "",
  "DISEASE REFERENCE MAP (do NOT give all at once — use in scenarios):",
  "- Rhinitis/Flu: viral, upper airway, infectious, reversible, obstructive. Watery then thick mucus. Viral = <101F, bacterial = >101F.",
  "- Pneumonia: infectious, restrictive, fills alveoli with fluid/mucus. Crackles. Hemoptysis. Lobar/bilateral/atypical/nosocomial/opportunistic/aspiration.",
  "- Asthma: obstructive, reversible, bronchospasm + edema + mucus. Wheezing. Extrinsic (allergy/IgE) vs intrinsic (stress/infection/irritants). Status asthmaticus = >30 min, life-threatening.",
  "- Emphysema (Pink Puffer): obstructive, IRREVERSIBLE. Lost elastin. Air trapping. Hypercapnia → hypoxic drive. Thin/pink/pursed lips/barrel chest. SpO2 target 91-94%.",
  "- Chronic Bronchitis (Blue Bloater): obstructive, IRREVERSIBLE. Thick mucus. Cilia destroyed. Polycythemia → thick blood → right heart failure → edema. Cyanosis. SpO2 target 91-94%.",
  "- Atelectasis: restrictive, collapsed alveoli, hard to reinflate. Treat with incentive spirometry.",
  "- Pulmonary Edema: restrictive, fluid IN the alveoli. Diffusion blocked.",
  "- Pleural Effusion: restrictive, fluid OUTSIDE the lung. External compression.",
  "- ARDS: restrictive, leaky alveolar walls, fluid floods in. Diffuse injury.",
  "",
  "NUMBERS TO KNOW COLD:",
  "- O2 sat: 95-100% normal. <90 = trouble. <80 = fatal.",
  "- COPD target SpO2: 91-94% (hypoxic drive — giving too much O2 removes the trigger to breathe)",
  "- PaO2: 75-100 mmHg",
  "- PaCO2: 35-45 mmHg",
  "- pH: 7.35-7.45",
  "- RR normal: 12-20. Elevated RR = sign of respiratory distress.",
  "- FiO2: 21% = room air",
  "",
  "Key terms in ALL CAPS:",
  "OBSTRUCTIVE, RESTRICTIVE, REVERSIBLE, IRREVERSIBLE, HYPOXIC DRIVE, POLYCYTHEMIA, CRACKLES, HEMOPTYSIS, STATUS ASTHMATICUS, NOSOCOMIAL.",
  "",
  "================================================================",
  "THE TEACHING FLOW:",
  "================================================================",
  "",
  "NOTE: This session is scenario-driven. Do NOT lecture. Do NOT summarize all 9 conversations up front.",
  "The student learns by DOING — by being put in front of a patient and being asked to think.",
  "Affirm what they get right. Scaffold what they miss. Connect everything to prior conversations.",
  "",
  "================================================================",
  "STEP 0 — OPEN WITH THE BIG PICTURE",
  "================================================================",
  "'Welcome to the last one.' (bubble)",
  "'You have put in the work — gas exchange, the numbers, infections, asthma, COPD, restrictive diseases.' (bubble)",
  "'Today we are not adding anything new.' (bubble)",
  "'We are going to take everything you know and USE it.' (bubble)",
  "'Before we dive in — give me your best one-liner for the difference between obstructive and restrictive.' (standalone question)",
  "→ Guide to: obstructive = can't get air OUT. Restrictive = can't get air IN.",
  "Affirm. 'Perfect. That is your compass for every scenario today. You ready?' (standalone question)",
  "",
  "================================================================",
  "STEP 1 — THE FRAMEWORK: BUILD IT WITH THEM",
  "================================================================",
  "'Here is how I want you to approach every respiratory patient from here on out.' (bubble)",
  "'Five questions. In order. Every time.' (bubble)",
  "'First: is it obstructive or restrictive?' (bubble)",
  "'Second: is it infectious?' (bubble)",
  "'Third: is it reversible or not?' (bubble)",
  "'Fourth: what are the numbers doing?' (bubble)",
  "'Fifth: what does the patient look like?' (bubble)",
  "'Let us try it. I will give you a patient — you run through the framework. Deal?' (standalone question)",
  "",
  "================================================================",
  "STEP 2 — SCENARIO BLOCK 1: IDENTIFICATION",
  "================================================================",
  "Run these scenarios one at a time. Present scenario as its own bubble. Question as its own bubble.",
  "Wait for the student's answer before moving to the next scenario.",
  "",
  "SCENARIO 1:",
  "'A 68-year-old man. Former smoker. Thin. Pink skin. Pursed-lip breathing. Barrel chest. SpO2 is 92%.' (scenario bubble)",
  "'What disease — and how do you know?' (standalone question)",
  "→ Emphysema / Pink Puffer. Clues: thin, pink, pursed lips, barrel chest, former smoker, SpO2 in the 91-94 range.",
  "Affirm and name 2-3 specific clues they correctly identified.",
  "If they say COPD generally: 'Good — which type of COPD?' Guide to emphysema specifically.",
  "",
  "SCENARIO 2:",
  "'A 54-year-old woman. Overweight. Blue-tinged lips. Chronic cough with thick mucus. Has had the cough for over 2 years. Swollen ankles.' (scenario bubble)",
  "'What are you thinking?' (standalone question)",
  "→ Chronic bronchitis / Blue Bloater. Clues: cyanosis (blue lips), productive cough >2 years, edema (swollen ankles), overweight.",
  "If they miss polycythemia connection: 'Why does chronic bronchitis cause swollen ankles?' Guide to: low O2 → polycythemia → thick blood → right heart failure → peripheral edema.",
  "",
  "SCENARIO 3:",
  "'A 22-year-old. Has a history of allergies. Comes in wheezing, short of breath, RR is 28. Says she was fine an hour ago after being around a cat.' (scenario bubble)",
  "'Walk me through what is happening.' (standalone question)",
  "→ Asthma, extrinsic pathway. Triggered by allergen (cat). Wheezing = bronchospasm. Reversible.",
  "Push: 'What is the extrinsic pathway — what is driving this response in her body?' Guide to IgE/mast cells/chemical mediators.",
  "",
  "SCENARIO 4:",
  "'A 35-year-old man. 4 days into what started as a cold. Fever is now 102.4°F. Cough is productive, mucus is yellow-green. You listen to his lungs and hear crackles on the right side.' (scenario bubble)",
  "'What happened here, and what do you call it?' (standalone question)",
  "→ Secondary bacterial pneumonia. Cold damaged the mucosa → bacteria moved in. Crackles = fluid. Fever >101 = bacterial. Right-sided = lobar.",
  "Affirm. Ask: 'What is the specific sound you heard and what does it mean?' Guide to crackles = fluid in alveoli.",
  "",
  "SCENARIO 5:",
  "'A patient is post-op. Day 2 after abdominal surgery. Breathing is shallow and painful. Breath sounds are decreased on the left lower lobe.' (scenario bubble)",
  "'What restrictive condition are you watching for?' (standalone question)",
  "→ Atelectasis. Post-op shallow breathing → alveoli collapse. Decreased sounds = no air moving.",
  "'What do you do about it?' Guide to: incentive spirometry, deep breathing, ambulation, straws, balloons.",
  "",
  "================================================================",
  "STEP 3 — SCENARIO BLOCK 2: THE NUMBERS",
  "================================================================",
  "'Ok — now I am going to give you numbers, no patient picture. You tell me what disease fits.' (bubble)",
  "",
  "NUMBER SET 1:",
  "'SpO2 = 89%. PaCO2 = 58 mmHg. pH = 7.31. RR = 10.' (scenario bubble)",
  "'What is happening here — and what disease fits this pattern?' (standalone question)",
  "→ Hypercapnia + hypoxia + acidosis + slow RR = COPD (emphysema or chronic bronchitis). CO2 is chronically retained. Hypoxic drive. Low RR because CO2 is no longer driving breathing.",
  "Push: 'Why is the RR so low if this patient is in trouble?' Guide to hypoxic drive — CO2 receptor is blunted.",
  "Push: 'What SpO2 range do you TARGET in this patient and why?' Guide to 91-94% — do NOT over-oxygenate a COPD patient.",
  "",
  "NUMBER SET 2:",
  "'SpO2 = 94%. RR = 28. The patient is working hard to breathe. Breath sounds: diffuse crackles bilaterally.' (scenario bubble)",
  "'What condition puts diffuse bilateral crackles in both lungs?' (standalone question)",
  "→ ARDS or pulmonary edema. Fluid in alveoli bilaterally. High RR = body compensating for poor gas exchange.",
  "If they say pneumonia: 'Could be — but pneumonia is typically localized. Bilateral diffuse crackles with an acute injury pattern points to what?' Guide to ARDS.",
  "",
  "NUMBER SET 3:",
  "'SpO2 = 97%. RR = 32. Wheezing audible without stethoscope. The attack started 45 minutes ago and has not responded to the first two bronchodilator treatments.' (scenario bubble)",
  "'What is this called — and why is it serious?' (standalone question)",
  "→ Status asthmaticus. >30 minutes. Not responding to treatment. Medical emergency. Air trapping → CO2 building → risk of respiratory failure.",
  "",
  "================================================================",
  "STEP 4 — CONTRAST CHALLENGE",
  "================================================================",
  "'Last challenge — I am going to give you two diseases side by side. You tell me the key difference. Quick answers.' (bubble)",
  "",
  "Fire these one at a time:",
  "1. 'Emphysema vs Chronic Bronchitis — patient appearance?' → Pink Puffer (thin, pink, pursed lips, barrel chest) vs Blue Bloater (cyanotic, overweight, edema)",
  "2. 'Asthma vs Emphysema — reversible or not?' → Asthma = reversible. Emphysema = IRREVERSIBLE.",
  "3. 'Pulmonary Edema vs Pleural Effusion — where is the fluid?' → Pulmonary edema = INSIDE the alveoli. Pleural effusion = OUTSIDE the lung in the pleural space.",
  "4. 'Viral pneumonia vs bacterial pneumonia — what drives the treatment difference?' → Viral = rest and fluids, no antibiotics. Bacterial = antibiotics.",
  "5. 'Nosocomial vs community-acquired pneumonia — why does it matter?' → Nosocomial bacteria are often antibiotic-resistant. Harder to treat. Different drugs needed.",
  "6. 'Extrinsic vs intrinsic asthma — trigger source?' → Extrinsic = outside allergen (IgE). Intrinsic = internal triggers (stress, infection, irritants).",
  "7. 'Atelectasis vs ARDS — what is collapsing and why?' → Atelectasis = alveoli collapse from lack of inflation. ARDS = fluid floods in from leaky walls after injury.",
  "",
  "Affirm after each. Scaffold any that miss.",
  "",
  "================================================================",
  "STEP 5 — STUDENT'S CHOICE",
  "================================================================",
  "'We have covered a lot today.' (bubble)",
  "'Is there anything from the past 10 conversations that still feels fuzzy?' (standalone question)",
  "→ Listen to what they say. Address their specific gap using scaffolding ladder.",
  "If they say 'I think I'm good': 'Ok — then say this back to me. What is your 5-step framework for any respiratory patient?' Guide through the 5 questions.",
  "",
  "================================================================",
  "CLOSING",
  "================================================================",
  "'I want you to hear this.' (bubble)",
  "'You started with gas exchange — the basics of how oxygen moves.' (bubble)",
  "'And now you can look at a patient, hear their breath sounds, read their numbers, and know what is wrong.' (bubble)",
  "'That is clinical thinking. And you built it.' (bubble)",
  "'One last question before I let you go.' (bubble)",
  "'A 70-year-old patient is on 6L O2 via nasal cannula. Her SpO2 climbs to 99%. She starts breathing slower — RR drops to 8.' (scenario bubble)",
  "'What is happening and what do you do?' (standalone question)",
  "→ COPD patient on too much O2. Removed the hypoxic drive. Now she is not breathing enough. Reduce O2 to target 91-94%. This is a critical COPD nursing principle.",
  "Affirm warmly. This is the final teachable moment — make it land.",
  "'Go take care of your patients. You are ready.' (bubble)",
];


// Assemble full system prompt
const SYSTEM_PROMPT = BASE_PROMPT + "\n\n" + CONVERSATION_PROMPT;

const INITIAL_MESSAGES = [
  { role: "assistant", content: "Welcome to the last one.", groupId: "init" },
  { role: "assistant", content: "You have put in the work — gas exchange, the numbers, infections, asthma, COPD, restrictive diseases.", groupId: "init" },
  { role: "assistant", content: "Today we are not adding anything new. Give me your best one-liner — what is the difference between obstructive and restrictive?", groupId: "init" },
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

  const silenceTimerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = true; r.interimResults = true; r.lang = "en-US";
      r.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
        setInput(transcript);
        // Reset silence timer every time we hear something — give student time to think
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          // 4 seconds of silence after last speech — stop listening
          if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
          setIsListening(false);
        }, 4000);
      };
      r.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
      };
      r.onerror = (e) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (e.error === "no-speech" && voiceModeRef.current) {
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
    result = result.replace(/→/g, " leads to ");
    result = result.replace(/←/g, " comes from ");
    result = result.replace(/↑/g, " increases ");
    result = result.replace(/↓/g, " decreases ");
    result = result.replace(/—/g, ", ");
    result = result.replace(/=/g, " equals ");
    result = result.replace(/\+/g, " plus ");
    result = result.replace(/%/g, " percent ");
    result = result.replace(/>/g, " greater than ");
    result = result.replace(/</g, " less than ");
    result = result.replace(/≥/g, " greater than or equal to ");
    result = result.replace(/≤/g, " less than or equal to ");
    result = result.replace(/~/g, " approximately ");
    result = result.replace(/&/g, " and ");
    result = result.replace(/\bmL\b/g, " milliliters ");
    // Check if using ElevenLabs (has API key) — use natural spellings
    // ElevenLabs is good at real words but needs help with medical terms
    // Use hyphenated natural pronunciation guides, NOT spaced-out phonetics
    // Anatomy & general
    result = result.replace(/alveoli/gi, "al-VEE-oh-lye");
    result = result.replace(/alveolar/gi, "al-VEE-oh-ler");
    result = result.replace(/alveolus/gi, "al-VEE-oh-luss");
    result = result.replace(/capillaries/gi, "CAP-ih-lair-eez");
    result = result.replace(/capillary/gi, "CAP-ih-lair-ee");
    result = result.replace(/pharynx/gi, "FAIR-inks");
    result = result.replace(/larynx/gi, "LAIR-inks");
    result = result.replace(/trachea/gi, "TRAY-kee-uh");
    result = result.replace(/bronchi\b/gi, "BRON-kye");
    result = result.replace(/bronchioles/gi, "BRON-kee-olz");
    result = result.replace(/diaphragm/gi, "DYE-uh-fram");
    result = result.replace(/atelectasis/gi, "at-uh-LEK-tuh-sis");
    result = result.replace(/surfactant/gi, "sur-FAK-tant");
    result = result.replace(/chemoreceptors/gi, "KEE-mo-ree-SEP-tors");
    result = result.replace(/orthopnea/gi, "or-THOP-nee-uh");
    result = result.replace(/dyspnea/gi, "DISP-nee-uh");
    result = result.replace(/rhonchi/gi, "RON-kye");
    result = result.replace(/rales/gi, "RAWLZ");
    result = result.replace(/hypercapnia/gi, "HY-per-CAP-nee-uh");
    result = result.replace(/hypocapnia/gi, "HY-po-CAP-nee-uh");
    result = result.replace(/rhinitis/gi, "rye-NYE-tis");
    result = result.replace(/hemoptysis/gi, "heh-MOP-tih-sis");
    result = result.replace(/polycythemia/gi, "poly-sigh-THEE-mee-uh");
    result = result.replace(/cyanosis/gi, "sigh-uh-NO-sis");
    result = result.replace(/emphysema/gi, "em-fih-SEE-muh");
    result = result.replace(/bronchiectasis/gi, "bron-kee-EK-tuh-sis");
    result = result.replace(/pneumothorax/gi, "NEW-mo-THOR-ax");
    result = result.replace(/thoracentesis/gi, "THOR-uh-sen-TEE-sis");
    result = result.replace(/bronchoscopy/gi, "bron-KOS-kuh-pee");
    result = result.replace(/spirometer/gi, "spy-ROM-uh-ter");
    result = result.replace(/pleurae/gi, "PLUR-ee");
    result = result.replace(/pleural/gi, "PLUR-ul");
    result = result.replace(/perfusion/gi, "per-FEW-zhun");
    result = result.replace(/ventilation/gi, "ven-tih-LAY-shun");
    result = result.replace(/acidosis/gi, "ass-ih-DOE-sis");
    result = result.replace(/alkalosis/gi, "al-kuh-LOE-sis");
    // Lab values & abbreviations
    result = result.replace(/PaO2/g, "P-A-O-2");
    result = result.replace(/PaCO2/g, "P-A-C-O-2");
    result = result.replace(/HCO3/g, "H-C-O-3");
    result = result.replace(/FiO2/g, "F-I-O-2");
    result = result.replace(/SpO2/g, "S-P-O-2");
    result = result.replace(/CO2/g, "C-O-2");
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
  const lastApiCallRef = useRef(0);
  const sessionStartRef = useRef(Date.now());

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
        body: JSON.stringify({ text: prepareForSpeech(text), model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.65, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true } }),
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
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (isListening && recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} setIsListening(false); }
    setInput(""); setError(null);
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setExchangeCount(c => c + 1);
    try {
      // Invisible pacing — ensure minimum 10 seconds between API calls to avoid rate limits
      const now = Date.now();
      const elapsed = now - lastApiCallRef.current;
      const minGap = 10000; // 10 seconds
      if (elapsed < minGap && lastApiCallRef.current > 0) {
        await new Promise(r => setTimeout(r, minGap - elapsed));
      }
      lastApiCallRef.current = Date.now();
      
      const conversationHistory = [...PRIOR_CONTEXT, ...messages, { role: "user", content: text }];
      const apiMessages = [];
      let lastRole = null;
      for (const m of conversationHistory) {
        if (m.role === lastRole && m.role === "assistant") { apiMessages[apiMessages.length - 1].content += " " + m.content; }
        else { apiMessages.push({ role: m.role, content: m.content }); lastRole = m.role; }
      }
      const anthropicKey = (() => { try { return import.meta.env.VITE_ANTHROPIC_API_KEY || ""; } catch(e) { return ""; } })();
      const headers = { "Content-Type": "application/json" };
      if (anthropicKey) { headers["x-api-key"] = anthropicKey; headers["anthropic-version"] = "2023-06-01"; headers["anthropic-dangerous-direct-browser-access"] = "true"; }
      
      // Retry loop for rate limits (429)
      let response;
      for (let attempt = 0; attempt < 3; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
      // Check session time — nudge toward scenarios if approaching 8 minutes
      const sessionMinutes = (Date.now() - sessionStartRef.current) / 60000;
      let systemPrompt = SYSTEM_PROMPT;
      if (sessionMinutes >= 8) {
        systemPrompt += "\n\nTIME CHECK: The student has been in this session for " + Math.round(sessionMinutes) + " minutes. If you have not reached scenarios yet, wrap up the current topic quickly and transition to a scenario NOW. Say something like 'Ok, let us put what we have covered so far to work. Ready to try a scenario?' Keep engagement high — students lose focus after 10 minutes of content without application.";
      }

        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers,
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, system: systemPrompt, messages: apiMessages }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.status === 429 && attempt < 2) {
          // Rate limited — wait and retry
          await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
          continue;
        }
        break;
      }
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        if (response.status === 429) throw new Error("Give me a moment — too many messages too fast. Try again in a few seconds.");
        throw new Error(`API error: ${response.status} ${errBody.slice(0, 200)}`);
      }
      const data = await response.json();
      const fullText = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!fullText.trim()) throw new Error("Empty response — try again.");
      
      // ================================================================
      // POST-PROCESSOR — Force-splits that catch what the AI misses.
      // ================================================================
      const rawChunks = fullText.split("|||").map(c => c.trim()).filter(c => c.length > 0);
      // RECURSIVE SPLITTER — keeps splitting until no more splits are needed
      const splitChunk = (chunk) => {
        // UNIVERSAL SPLIT: Any statement/exclamation followed by a question
        // This catches ALL rapid fire patterns: "Exactly! Normal PaCO2?" / "Right! Target SpO2?"
        if (chunk.length > 15) {
          const stmtQMatch = chunk.match(/^(.+?[.!])\s+(.+\?)\s*$/);
          if (stmtQMatch && stmtQMatch[1].trim().length > 3 && stmtQMatch[2].trim().length > 5) {
            return [...splitChunk(stmtQMatch[1].trim()), ...splitChunk(stmtQMatch[2].trim())];
          }
        }

        // Statement followed by statement+question (multi-sentence then question)
        // "Exactly! 95 to 100. Normal PaO2?" → split after each sentence
        if (chunk.length > 20 && /\?/.test(chunk)) {
          const parts = chunk.match(/[^.!?]+[.!?]+/g);
          if (parts && parts.length >= 2) {
            const lastPart = parts[parts.length - 1].trim();
            if (lastPart.endsWith("?")) {
              const beforeQ = parts.slice(0, -1).join("").trim();
              if (beforeQ.length > 3 && lastPart.length > 5) {
                return [...splitChunk(beforeQ), ...splitChunk(lastPart)];
              }
            }
          }
        }

        // Force-split topic pivots
        if (chunk.length > 60) {
          const pivotMatch = chunk.match(/^(.+?[.!?])\s+((?:Ok,|Ok |Now,|Now |So,|So |Alright,|Next |What about |How about |And (?:what|when|if|absent)|Ready to|Want to|Do you have any|Let us try|Here is|Here's|Picture this)[\s].+)/);
          if (pivotMatch && pivotMatch[1].trim().length > 10 && pivotMatch[2].trim().length > 10) {
            return [...splitChunk(pivotMatch[1].trim()), ...splitChunk(pivotMatch[2].trim())];
          }
        }

        // Force-split "Nice work" etc
        if (chunk.length > 60) {
          const niceWorkMatch = chunk.match(/^(.+?(?:Nice work|Great work|Great job|Solid work|Really solid|Well done|Nailed it)[.!]+)\s+(.+)/i);
          if (niceWorkMatch && niceWorkMatch[2].trim().length > 10) {
            return [...splitChunk(niceWorkMatch[1].trim()), ...splitChunk(niceWorkMatch[2].trim())];
          }
        }

        // Force-split scenario announcements
        if (chunk.length > 60) {
          const scenarioAnnounce = chunk.match(/^(.+?[.!?])\s+((?:Let us try|Let's try|Next scenario|One more|Ok, last one|Ok, next one)[.!]?\s*.+)/i);
          if (scenarioAnnounce && scenarioAnnounce[1].trim().length > 5) {
            return [...splitChunk(scenarioAnnounce[1].trim()), ...splitChunk(scenarioAnnounce[2].trim())];
          }
        }

        // Force-split scenario patient descriptions
        const scenarioMatch = chunk.match(/(.*?[.!]\s*)(A \d{1,3}[\s-]year[\s-]old.+)/i);
        if (scenarioMatch && scenarioMatch[1].trim().length > 0) {
          const parts = [...splitChunk(scenarioMatch[1].trim())];
          const scenarioText = scenarioMatch[2].trim();
          const qMatch = scenarioText.match(/(.*?[.]\s*)((?:What|Which|How|Why|Where|Who|Is|Are|Do|Does|Can|Name|Identify|Pick|Find|Look)\s.+)/i);
          if (qMatch && qMatch[1].trim().length > 10) {
            parts.push(qMatch[1].trim());
            parts.push(qMatch[2].trim());
          } else { parts.push(scenarioText); }
          return parts;
        }

        // Force-split any bubble over 100 chars at sentence boundaries
        if (chunk.length > 100) {
          const sentences = chunk.match(/[^.!?]+[.!?]+/g);
          if (sentences && sentences.length >= 2) {
            const mid = Math.ceil(sentences.length / 2);
            return [...splitChunk(sentences.slice(0, mid).join("").trim()), ...splitChunk(sentences.slice(mid).join("").trim())];
          }
        }

        return [chunk];
      };

      const chunks = [];
      for (const chunk of rawChunks) {
        // MC with options — split preamble off and format options
        if (/[A-E]\)/.test(chunk) && (chunk.match(/[A-E]\)/g) || []).length >= 2) {
          const firstOption = chunk.search(/[A-E]\)/);
          const beforeOptions = chunk.slice(0, firstOption);
          // Find the MC question keyword before the options
          const whichIdx = beforeOptions.search(/(?:Which|What|Select|All of|Name|Identify)/i);
          const mcStart = whichIdx >= 0 ? whichIdx : Math.max(beforeOptions.lastIndexOf(". ") + 2, 0);
          
          if (mcStart > 10) {
            // Split off preamble
            const preamble = chunk.slice(0, mcStart).trim();
            const mcPart = chunk.slice(mcStart).trim();
            chunks.push(...splitChunk(preamble));
            chunks.push(mcPart.replace(/([A-E]\))/g, "\n$1").trim());
          } else {
            // Just format options
            chunks.push(chunk.replace(/([A-E]\))/g, "\n$1").trim());
          }
          continue;
        }
        // MC trigger without options — convert to free response
        const mcTriggers = /which of the following|which are true|which is true|which of these|what are true|what is true|select all that apply|all of the following except|all of the following/i;
        if (mcTriggers.test(chunk) && !/[A-E]\)/.test(chunk)) {
          let fixed = chunk.replace(/which of the following/gi, "what").replace(/select all that apply[.:]?\s*/gi, "").replace(/all of the following .* except/gi, "what does NOT");
          chunks.push(...splitChunk(fixed));
          continue;
        }
        
        // Everything else — run through recursive splitter
        chunks.push(...splitChunk(chunk));
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
      
      // FOURTH PASS: Ensure response ends with something the student can respond to
      if (finalChunks.length > 0) {
        const lastChunk = finalChunks[finalChunks.length - 1].trim();
        const hasSayBack = /say (?:that|it|this) back/i.test(lastChunk);
        const endsWithQuestion = lastChunk.endsWith("?");
        const endsWithPunctuation = /[.!?]$/.test(lastChunk);
        
        // Truncated response (doesn't end with punctuation) — remove broken chunk and add prompt
        if (!endsWithPunctuation && lastChunk.length > 3) {
          finalChunks.pop();
          if (finalChunks.length === 0) {
            finalChunks.push("Sorry, I lost my train of thought. Where were we?");
          } else {
            finalChunks.push("Ready to keep going?");
          }
        }
        // Ends with statement, not question or say-back
        else if (!endsWithQuestion && !hasSayBack) {
          if (/next scenario|one more|last one|let us try|let's try/i.test(lastChunk)) {
            finalChunks.push("Ready?");
          } else {
            finalChunks.push("What do you think?");
          }
        }
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
