# Housing Society Complaint Tracker

A full-stack housing society complaint management system that helps residents submit and track complaints while giving administrators a structured dashboard to review, prioritize, and resolve them.

## 🔗 Live Demo

**Live Application:** [https://smart-resident-complaint-tracker-994rgw6n0-eshanidixit.vercel.app/login](https://smart-resident-complaint-tracker-994rgw6n0-eshanidixit.vercel.app/login)

**GitHub Repository:** [https://github.com/EshaniDixit/Smart-Resident-Complaint-Tracker](https://github.com/EshaniDixit/Smart-Resident-Complaint-Tracker)

---

## What I Built & Why

The application provides separate experiences for **Residents** and **Admins** with role-based access control.

### Residents can

- Register and log in
- Submit complaints
- See automatically detected category and urgency
- Receive a concise complaint summary and contextual response
- Get warned when their complaint may be a duplicate
- View their complaint history and current status

### Admins can

- Log in through an admin account
- View all resident complaints
- Review category and urgency information
- Update complaints between **Open, In Progress, and Resolved**

### The problem it solves

Housing societies can receive many unstructured complaints such as water leaks, electrical problems, cleanliness issues, or security concerns. Administrators normally have to read and categorize these complaints manually before deciding how to prioritize them.

This application automates part of that initial triage while giving residents better visibility into what is happening with their complaints.

---

## AI/NLP Feature: Smart Complaint Triage

The main intelligent feature is **automatic complaint analysis**.

When a resident enters a complaint, the system analyzes the description and determines:

- **Category:** Plumbing, Electrical, Security, Cleanliness, or General Maintenance
- **Urgency:** High, Medium, or Low
- **Concise summary**
- **Contextual response**

For example:

> "The water pipe in my bathroom burst and is flooding the floor!"

can be classified as **Plumbing** with **High urgency**, helping the administrator identify issues that may require faster attention.

### Duplicate Complaint Detection

The application also checks whether a newly entered complaint is similar to existing complaints.

The system:

 - Extracts meaningful words from the complaint.

 -  Removes common stopwords.
 -  Calculates Jaccard similarity.
 -  Uses word containment to identify closely related descriptions.
 -  Shows the most similar existing complaints when the similarity exceeds a defined threshold.

The resident can still choose **Submit Anyway** if the complaint is genuinely different.

---

I built a lightweight custom **NLP** pipeline in `src/lib/classify.ts` using:

- Keyword-based category classification
- Urgency keyword scoring
- Content-word extraction
- Sentence scoring for summaries
- Jaccard and containment-based similarity for duplicate detection
- Rule-based contextual responses

### Why this approach?

I chose this approach because housing society complaints are a relatively constrained problem with a small number of categories and recognizable urgency indicators.

It provides:

- **Zero external **API** costs**
- **No **API** keys required**
- **Fast and predictable results**
- **No complaint text sent to a third-party AI provider**
- **Simple and maintainable implementation**

The main trade-off is that this approach does not understand semantic meaning as well as modern embedding models or LLMs. A semantic model would be a natural improvement for a future version.

---

## Tech Stack

- **Frontend & Backend:** Next.js (App Router), React, TypeScript
- **Database:** PostgreSQL
- ****ORM**:** Prisma
- **Authentication:** **JWT** cookies + bcrypt
- **AI/**NLP**:** Custom lightweight **NLP** pipeline
- **Styling:** Vanilla **CSS**
- **Deployment:** Vercel

---

## Main API Routes

| Method | Endpoint                          | Purpose                      |
| ------ | --------------------------------- | ---------------------------- |
| POST   | `/api/auth/register`              | Register a resident or admin |
| POST   | `/api/auth/login`                 | Authenticate a user          |
| POST   | `/api/auth/logout`                | Log out                      |
| GET    | `/api/complaints`                 | Retrieve complaints          |
| POST   | `/api/complaints`                 | Create a complaint           |
| PATCH  | `/api/complaints/:id`             | Update complaint status      |
| POST   | `/api/complaints/check-duplicate` | Check for similar complaints |

Complaint classification is performed server-side when the complaint is created, making the server the authoritative source for the stored category and urgency.

---

## Database

The application uses PostgreSQL with Prisma.

### User

Stores:

- Username
- Password hash
- Role
- Resident complaints

### Complaint

Stores:

- Description
- Summary
- Category
- Urgency
- Status
- AI/**NLP** response
- Resident
- Creation date

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL

### 1. Clone the repository

```bash git clone [https://github.com/EshaniDixit/Smart-Resident-Complaint-Tracker.git](https://github.com/EshaniDixit/Smart-Resident-Complaint-Tracker.git) cd Smart-Resident-Complaint-Tracker ```

### 2. Install dependencies

```bash npm install ```

### 3. Create a `.env` file

```env DATABASE_URL=*your-postgresql-connection-string* JWT_SECRET=*your-jwt-secret* ADMIN_INVITE_CODE=*your-admin-invite-code* ```

The admin invite code is required when registering an administrator.

### 4. Generate Prisma Client

```bash npx prisma generate ```

### 5. Initialize the database

```bash npx prisma db push ```

### 6. Start the development server

```bash npm run dev ```

Open `[http://localhost:**3000**`.](http://localhost:**3000**`.)

### Test the application

## Register a Resident account.

- Register an Admin account using the configured admin invite code.
- Log in as the Resident. ## Submit a complaint such as: `"The water pipe in my bathroom burst and is flooding the floor!"`
- Check the detected category and urgency.
- Submit the complaint.
- Log in as Admin and review the complaint.
- Update its status.
- Submit a similar complaint to test duplicate detection.

---

## Deployment

The application is deployed on **Vercel** with a **PostgreSQL** database.

The production environment requires:

```text DATABASE_URL JWT_SECRET & ADMIN_INVITE_CODE ```

The frontend and backend **API** routes are deployed together through Next.js.

---

## Security

- Passwords are hashed using bcrypt.
- Authentication uses **JWT**-based sessions.
- Admin registration requires an invite code.
- Secrets are stored in environment variables.
- Protected **API** routes verify authentication.
- Complaint classification is performed server-side.

---

## What I'd Improve With More Time

### 1. Better semantic understanding

Use embeddings or a lightweight pretrained model for more accurate categorization and duplicate detection.

### 2. Notifications

Send email, **SMS**, or push notifications for high-urgency complaints and status changes.

### 3. Image support

Allow residents to upload photos and use a multimodal model to assist with issue analysis.

### 4. Admin analytics

Add dashboards for recurring complaints, resolution times, category trends, and high-priority issues.

### 5. Automated testing

Add comprehensive unit and integration tests for authentication, APIs, classification, and duplicate detection.

### 6. Smarter prioritization

Rank complaints using urgency, complaint age, number of affected residents, and category.

---

## Conclusion

The project provides an end-to-end complaint workflow from **resident submission → automated triage → admin review → status resolution**.

The AI/**NLP** functionality was intentionally designed to be lightweight, explainable, privacy-friendly, and suitable for the constrained housing-society domain, while leaving a clear path toward more advanced semantic AI in future versions.
