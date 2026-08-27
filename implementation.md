Build a multi-user, responsive Attendance Tracking Web Application using HTML, CSS (Tailwind via CDN), and modern JavaScript. 

Integrate a cloud backend platform (such as Supabase or Firebase Auth/Firestore) to manage user data securely. Implement the following core modules:

1. MULTI-USER LOGIN & AUTHENTICATION:
- Create a clean Authentication landing page supporting User Registration (Sign Up) and Login ID / Password authentication.
- Structure user data isolation so that each logged-in user can only see, modify, and upload data belonging to their unique User ID.
- Provide a clear "Log Out" button that clears the active session.

2. VARIABLE ATTENDANCE MODAL SETTING (Hour-Wise vs. Day-Wise):
- Implement a global setting toggle in the dashboard: "Tracking Mode: [Day-Wise / Hour-Wise]".
- Day-Wise Mode: Every unique calendar date has a single, flat attendance check (Present, Absent, Cancelled) representing the entire day.
- Hour-Wise Mode: Attendance calculation is driven by duration. Each class block tracks its specific duration (e.g., a 2-hour lecture counts as 2 units toward the denominator; being present gives 2 units toward the numerator). 

3. UNIVERSAL MULTIMODAL ROUTINE INGESTION:
- Build a drag-and-drop file upload zone accepting .pdf, .jpg, .png, .csv, .xlsx, and .docx.
- Use the Gemini API ('gemini-1.5-flash') to parse the schedule into a structured array. If Hour-Wise mode is active, ensure the AI prompt strictly extracts precise start and end times to calculate the hourly weights.

4. ATTENDANCE REGULATOR & METRICS (Adaptive Math):
- Add a configuration slider for "Minimum Required Attendance %".
- The metrics engine must dynamically switch calculations based on the variable tracker setting:
  * In Day-Wise mode, math checks total active days.
  * In Hour-Wise mode, math calculates cumulative hours.
- Display "Safe to skip" vs "Must attend" indicators that adjust dynamically to hourly weights.

Once written, execute a local development server in the terminal, launch the workspace browser preview, and simulate user sign-up and layout generation loops to verify the data schemas.
