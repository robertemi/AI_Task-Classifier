# 🚀 MVP System Overview

A high-level overview of the MVP architecture, database design, and main workflows.

---

## 🧩 User Story – AI Task Classifier

**As a** Project Manager,  
**I want** to create, update, and manage my projects and tasks in a smart platform that automatically enriches task information using AI,  
**so that** I can focus more on planning and coordination instead of writing long descriptions or manual estimations.

<p align="center">
<img width="2384" height="1025" alt="AI_Task_Classifier_UseCaseDiagram_FINAL" src="https://github.com/user-attachments/assets/3c04e00a-d23e-4708-aa31-67a8fb759067" />
</p>

### 💡 Acceptance Criteria

- I can register, log in, and access my list of projects and tasks.  
- I can create, edit, delete, or update the status of any project or task.  
- When I add or modify a task, the system automatically enhances it — using AI — with a clear description and estimated story points.  
- The platform keeps all project information organized and easy to review.  
- I can optionally generate a concise AI-based project summary to get an overview of progress.

---

## 🧩 Component Architecture

The following diagram illustrates the **planned system architecture**, including the frontend, backend, AI components, and database layer.

<p align="center">
  <img width="90%" alt="Component Diagram" src="https://github.com/user-attachments/assets/16a370d5-08c1-4a87-83e2-fdd4fde252a9" />
</p>

> 💡 **Key Insight:**  
> The architecture is modular — separating the AI enrichment logic from core CRUD operations, while maintaining clear communication channels between the frontend, backend, and databases.

---

## 🗄️ Database Schema (Planned)

The database schema defines the relational structure for **users (PMs)**, **projects**, and **tasks**, supporting AI-enriched fields and RAG integration.

<p align="center">
  <img width="70%" alt="Database Schema Diagram" src="https://github.com/user-attachments/assets/73cf0814-936c-4268-8cc3-57d06afccc58" />
</p>

> 🧠 **Tech Stack:**  
> - **Supabase** — Relational DB for structured data  
> - **ChromaDB** — Vector store for embeddings and RAG context  

---

## ⚙️ Core Workflows

### 🧾 Project Creation Flow

This diagram shows how a **Project Manager (PM)** creates a new project via the frontend, which is then processed and stored by the backend.

<p align="center">
  <img width="75%" alt="Project Creation Workflow" src="https://github.com/user-attachments/assets/a3e3e1f2-8c61-4825-ab8b-9d2aa186b21f" />
</p>

---

### 🪄 Task Creation Flow

> ⚠️ **Important:**  
> A project **must exist** before creating tasks under it.

Once a task is created, it’s asynchronously enriched by the AI model (e.g., story points, details), then stored in the database.

<p align="center">
  <img width="85%" alt="Task Creation Workflow" src="https://github.com/user-attachments/assets/6359e25d-b60a-4fe8-9733-6c3ed9cbeb8f" />
</p>

---

## 🧱 System Summary

| Layer | Description | Tech |
|-------|--------------|------|
| **Frontend** | Handles user interactions (login, project/task creation) | React + Tailwind CSS |
| **Backend** | API layer managing async operations, AI calls, and DB sync | FastAPI |
| **AI Components** | Task enrichment and story point estimation | Custom model + RAG |
| **Databases** | Relational + Vector storage | Supabase & ChromaDB |

---

## 🧩 Design Highlights

- 🔐 **Authentication:** Managed via Supabase Auth  
- ⚡ **Async Operations:** Background AI enrichment handled via async tasks  
- 🧠 **AI Integration:** Context retrieval + enrichment using RAG pipeline  
- 🗃️ **Storage Split:** Relational data in Supabase, embeddings in ChromaDB  
- 🧰 **Scalability:** Modular and easily extendable architecture

---

## 🪅 Mockup

<p align="center">
  <img width="90%"" alt="mockup1" src="https://github.com/user-attachments/assets/de75a1f3-bfb6-4bcb-b635-6235f707681e" />
</p>

---

## Prototype: Supabase email/password login

This repository now contains a small React + TypeScript Vite scaffold with a Supabase email/password login prototype.

Files added:
- `package.json` — frontend deps and scripts
- `index.html`, `vite.config.ts`, `tsconfig.json`
- `src/lib/supabaseClient.ts` — initializes Supabase client using env
- `src/context/AuthProvider.tsx` — manages session and user state
- `src/components/Login.tsx` — simple email/password sign-in & sign-up UI
- `src/App.tsx`, `src/main.tsx`, `src/styles.css`
- `.env.example` — example env variables for Supabase

How to run (PowerShell):

```powershell
npm install
cp .env.example .env
# Edit .env and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open http://localhost:5173 and try sign up / sign in with email + password.

Note: This prototype uses Supabase JS client only for auth. For production you'll want to implement server-side JWT validation and session handling for API requests.


<p align="center">
  <img width="90%"" alt="MockUp2" src="https://github.com/user-attachments/assets/ad433910-2402-46e1-8599-d852db35fbb2" />
</p>
