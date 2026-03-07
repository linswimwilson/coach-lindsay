# Coach Lindsay — Pulmonary Pathophysiology Tutor

Interactive AI-powered study sessions for BSN nursing students.

## For Lindsay — How to Update Content

### Quick Edit (browser only)
1. Go to github.com and open this repository
2. Navigate to `src/conversations/` and click the file you want to edit (e.g., `conv1.jsx`)
3. Click the pencil icon (Edit)
4. Make your changes
5. Click "Commit changes" at the bottom
6. Vercel auto-deploys in ~30 seconds. Students see the update at the same URL.

### What's in each file
- **`src/conversations/conv1.jsx`** — Gas Exchange Foundations
- **`src/conversations/conv2.jsx`** — Compliance, Surfactant & Ventilation
- **`src/conversations/conv3.jsx`** — The Numbers
- **`src/conversations/conv7.jsx`** — Emphysema — Pink Puffer
- **`src/conversations/conv8.jsx`** — Chronic Bronchitis — Blue Bloater
- **`src/conversations/conv9.jsx`** — Restrictive Diseases
- **`src/Hub.jsx`** — The landing page students see first

### What you can safely change in conversation files
- **CONVERSATION_PROMPT** — teaching flow, learning objectives, clinical content
- **INITIAL_MESSAGES** — what the student sees first
- **BASE_PROMPT** — behavioral rules (change in ONE file, then copy to others)

### Student URLs
- Landing page: `yoursite.vercel.app`
- Direct links: `yoursite.vercel.app/conv1`, `/conv2`, `/conv3`, etc.
