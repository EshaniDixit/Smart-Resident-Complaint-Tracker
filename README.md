# Society Tracker (with Smart AI Triage)

A modern, full-stack housing society complaint tracking system where residents can submit complaints, and admins can track and resolve them efficiently.

## What I Built & Why

I built a complete Next.js (App Router) web application featuring a Role-Based Access Control (RBAC) system for Residents and Admins. 

**The real problem:** Admins in housing societies often receive an unorganized flood of complaints—"water is leaking", "the lift is broken", "someone parked in my spot"—which requires manual reading and categorization before they can be assigned to the right team (plumbers, electricians, security). Residents, on the other hand, usually just get a generic "Submitted" message and feel unheard.

## The AI Feature: Smart Complaint Triage

To solve this, I integrated **Smart Complaint Triage** directly into the Resident's submission form.

1. **What it does:** As a resident types their complaint, an AI model analyzes the text in real-time. It automatically classifies the **Category** (e.g., Plumbing, Electrical, Security) and the **Urgency** (High, Medium, Low). It then generates a polite, contextual Auto-Response tailored to their specific problem and its urgency.
2. **Which Model I Used:** I used **Xenova/mobilebert-uncased-mnli** via **Transformers.js**. 
3. **Why I chose it:** Since we wanted an AI feature *without* relying on paid external APIs (like OpenAI or Gemini) or requiring API keys, I utilized Transformers.js to run a zero-shot text classification model **entirely locally in the user's browser via a Web Worker**. This means 100% privacy, zero API costs, no API keys to configure, and immediate real-time feedback without server latency! The MobileBERT model is small enough (~100MB) to load quickly on the client while still providing excellent zero-shot classification accuracy.

## Tech Stack
- **Framework:** Next.js (React)
- **Database:** Prisma ORM with SQLite (Local)
- **AI:** Transformers.js (In-browser ML)
- **Auth:** Custom JWT Cookie-based Auth
- **Styling:** Vanilla CSS Modules with a premium, responsive UI

## How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm

### Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize the Database**
   This project uses SQLite for easy local development.
   ```bash
   npx prisma db push
   ```
   *(This will create a `dev.db` file in the `prisma` folder)*

3. **Start the Development Server**
   ```bash
   npm run dev
   ```

4. **Test the App**
   - Open `http://localhost:3000`
   - Register a new account as an **ADMIN** (e.g., admin / password).
   - Register another account as a **RESIDENT** (e.g., resident / password).
   - Log in as the resident, start typing a complaint (e.g., "The water pipe in my bathroom burst and is flooding the floor!"). Watch the AI instantly categorize it as "Plumbing", mark it as "High Urgency", and generate an auto-response.
   - Submit it, then log in as the Admin to see the complaint prioritized on your dashboard.

## Deployment to Vercel

To deploy this live:
1. Push this repository to GitHub.
2. Import the project in Vercel.
3. **Database Setup:** Vercel does not support SQLite because it uses a Serverless filesystem. You must provision a Postgres database. In the Vercel dashboard, go to the "Storage" tab, create a Vercel Postgres database, and link it to your project.
4. **Prisma Update:** Change the provider in `prisma/schema.prisma` from `"sqlite"` to `"postgresql"`. 
5. Run `npx prisma db push` against your new Postgres database, and Vercel will automatically deploy the working app.

## What I'd Improve with More Time
- **Server-Side AI Fallback:** While running the AI in the browser is free and fast, downloading a 100MB model on slow mobile connections isn't ideal. I would move the Transformers.js inference to a dedicated backend service (like a small Python FastAPI server) or use a quantization strategy to make the client model even smaller.
- **Push Notifications:** Alert admins immediately via email/SMS when a High Urgency complaint is detected.
- **Image Uploads:** Allow residents to attach photos of the issue, and use a multimodal AI model (like Florence-2) to analyze the image severity.
