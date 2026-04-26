# SkillScout AI - Technical Skill Assessment Agent

SkillScout is a next-generation, AI-powered technical skill assessment platform. It allows users to upload a target Job Description and their current resume. The AI automatically maps the required skills, conducts a dynamic, conversational technical interview, and generates a comprehensive, week-by-week personalised learning roadmap to bridge any identified skill gaps.

## 📸 Screenshots

![SkillScout Dashboard Mockup](/Images/Dashboard.png)
![SkillScout Dashboard Completed](/Images/Dashboard2.png)
![Skill Analysis](/Images/SkillAnalysis.png)
![Assessment Results 1](/Images/AssessmentResults.png)
![Assessment Results 2](/Images/AssessmentResults2.png)

## 🌟 Core Features

- **Smart Document Parsing**: Instantly extracts required skills from Job Descriptions and aligns them with candidate resumes using Azure OpenAI.
- **Dynamic Conversational Assessment**: A live, conversational interview interface that probes for depth and understanding rather than just testing trivia. Uses Server-Sent Events (SSE) for real-time AI streaming.
- **Voice Capabilities**: Native browser Web Speech API integration for **Text-to-Speech (TTS)** and **Speech-to-Text (STT)**, allowing users to practice verbal interviews.
- **Objective Scoring & Gap Analysis**: Scores demonstrated proficiency against job requirements on a 1-10 scale and identifies critical "Skill Gaps".
- **Personalised Learning Plans**: Generates week-by-week actionable roadmaps, curated resources, and quick wins to help candidates reach interview readiness.
- **Premium UI/UX**: A highly polished, modern interface built with Tailwind CSS, Shadcn UI, and smooth micro-interactions.
- **PDF Export**: Downloadable, professional learning plan scorecards generated directly in the browser.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (v4), Shadcn/UI, Zustand (State Management with Persistence), Lucide Icons.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose.
- **Database**: MongoDB (Atlas or Local).
- **AI Layer**: Azure OpenAI (`gpt-4o-mini`) via the `@azure/openai` SDK.

## 📂 Project Structure

```text
skill-assessment-agent/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (Chat, Progress, PDF)
│   │   ├── hooks/          # Custom React hooks (useSSE)
│   │   ├── lib/            # Axios config, utils
│   │   ├── pages/          # Main application views (Dashboard, Assessment, Results)
│   │   └── store/          # Zustand global state (useAuthStore, useAssessmentStore)
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # Route handlers (Auth, Assessment, Chat)
│   │   ├── middlewares/    # JWT Auth, Error handling, Multer upload
│   │   ├── models/         # Mongoose Schemas (User, Assessment)
│   │   ├── routes/         # Express API routers
│   │   └── services/       # Azure OpenAI service logic, Prompts
└── shared/                 # Shared TypeScript interfaces (Types)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally or a MongoDB Atlas URI
- **An active Azure Subscription** with access to Azure OpenAI Service

### 1. Clone & Install
This is a monorepo containing both the `client` and `server` directories. Install dependencies for both:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Configure Azure OpenAI

To run the AI assessment, you must deploy an OpenAI model in Azure:
1. Go to the [Azure Portal](https://portal.azure.com/) and create an **Azure OpenAI** resource.
2. Go to [Azure AI Studio](https://oai.azure.com/) using your new resource.
3. Under **Deployments**, create a new deployment. Select the `gpt-4o-mini` model.
4. Note your **Endpoint**, **API Key**, and exactly what you named your **Deployment**.

### 3. Environment Variables

Create a `.env` file in **both** the `server` and `client` directories. Use the provided `.env.example` file in the server directory as a template.

**`server/.env`**:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Database
MONGODB_URI=mongodb://localhost:27017/skill_assessment

# Authentication
# Generate secure random strings for these (e.g. openssl rand -hex 32)
JWT_SECRET=your_jwt_access_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name  # e.g., gpt-4o-mini
```

**`client/.env`**:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Running the Application

You need to run both the frontend and backend development servers concurrently.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🏗️ Architecture & Data Flow

1. **Phase 1 (Initialization & Parsing)**: The user uploads a Job Description (text) and a Resume (PDF). The `server` uses `multer` and `pdf-parse` to extract text. Azure OpenAI analyzes both documents and identifies a matrix of required technical skills.
2. **Phase 2 (Conversational Assessment)**: The user enters the chat interface. The client connects to `GET /api/chat/:id/message` via Server-Sent Events (`EventSource`). The AI asks technical questions tailored to the user's resume, and responses stream back chunk-by-chunk for a low-latency feel. The AI tracks the conversation state and outputs control tokens (e.g., `[NEXT_SKILL]`) when it has gathered enough signal to move on.
3. **Phase 3 (Scoring)**: Once all skills are assessed, the client triggers the scoring phase. The server passes the entire conversation transcript to Azure OpenAI, which acts as a technical recruiter to assign a 1-10 proficiency score for each skill.
4. **Phase 4 (Plan Generation)**: Based on the generated scores and identified "Skill Gaps", the AI generates a priority-ordered learning plan containing curated resources, week-by-week milestones, and practical project suggestions.
5. **Phase 5 (Results & Export)**: The client displays the roadmap interactively. Users can copy an executive summary or generate an on-the-fly PDF using `@react-pdf/renderer` to share with mentors or recruiters.

## 👨‍💻 Author

**Ritik Kumar**
- [GitHub: @RitikRK96](https://github.com/RitikRK96)
- [LinkedIn: Ritik Kumar](https://www.linkedin.com/in/ritikkumar08/)

## 📝 License
MIT License
