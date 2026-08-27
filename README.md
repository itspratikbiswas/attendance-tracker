# OmniAttend - AI Multi-User Attendance & Schedule Regulator

OmniAttend is a modern, responsive multi-user attendance tracking and academic regulator web application. It features dynamic Day-Wise vs. Hour-Wise attendance calculations, AI-powered routine ingestion using Google Gemini, interactive timetables, and audit logging.

## ✨ Key Features

- **Multi-User Authentication & Data Isolation**: Support for sign-up, sign-in, session management, and isolated local storage per User ID (`attend_tracker_user_${uid}_data`).
- **Variable Attendance Modes**:
  - **Day-Wise Mode**: Daily presence checks per active calendar date.
  - **Hour-Wise Mode**: Duration-weighted attendance accounting for lecture & lab lengths (e.g. 1.5h, 2.0h).
- **Adaptive Attendance Regulator**:
  - Dynamic Minimum Required Attendance % slider (50%–95%).
  - Real-time mathematical calculation of **"Safe to Skip"** vs. **"Must Attend"** sessions.
- **Universal Multimodal Routine Ingestion**:
  - Drag-and-drop support for `.pdf`, `.png`, `.jpg`, `.csv`, `.xlsx`, and `.docx`.
  - Ingestion powered by Google Gemini 1.5 Flash API with built-in client-side fallback parsers (SheetJS, PDF.js, Mammoth).
- **Interactive UI**:
  - Today's Classes quick check-in widget.
  - Weekly 6-day interactive Timetable Grid.
  - Chronological Attendance Audit Log with filters.
  - Chart.js Analytics (bar and doughnut charts).
  - JSON Data Backup Export & Import.

## 🚀 Quick Start

1. Clone or download this repository.
2. Open `index.html` directly in your browser, or run a local HTTP server:
   ```bash
   # Using Python:
   python -m http.server 3000

   # Or using Node:
   npx serve
   ```
3. Open `http://localhost:3000` in your web browser.
4. Click **"Instant 1-Click Demo Login"** or create a new account to start tracking!

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+), CSS3 (Glassmorphism design system)
- **Styling**: Tailwind CSS CDN
- **Libraries**:
  - [Lucide Icons](https://lucide.dev/)
  - [Chart.js](https://www.chartjs.org/)
  - [SheetJS (xlsx)](https://sheetjs.com/)
  - [PDF.js](https://mozilla.github.io/pdf.js/)
  - [Mammoth.js](https://github.com/mwilliamson/mammoth.js)
  - [Canvas Confetti](https://www.kirilv.com/canvas-confetti/)
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`)
