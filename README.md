# 🎓 Apex Campus — Comprehensive Student Management & Academic Information System

> **A modern, full-stack, production-grade university management system built for college academic administration, faculty grading, and student self-service.**

---

## 🌟 Executive Highlights

- **⚡ Modern Full-Stack Architecture**: React + Vite on the frontend with custom CSS design system; Node.js & Express with SQLite (`node:sqlite`) on the backend.
- **🛡️ Zero-Config Local SQLite Database**: Self-contained, zero external database servers (no MongoDB/PostgreSQL installation required). Pre-seeded with 12+ student profiles, courses across 5 departments, attendance records, exam marks, and fee payments.
- **👥 Multi-Role Portal Simulation**:
  - **👑 Administrator Portal (Dean/Registrar)**: Full student admission/enrollment, fee collection ledger, department/course catalog, institutional KPI analytics, and instant database reset for live demos.
  - **👨‍🏫 Faculty Portal (Professors)**: Course rosters, interactive daily attendance sheet with shortcuts (Mark All Present), continuous assessment and examination grade submission.
  - **🎓 Student Portal**: Personalized student dashboard, attendance shortage warning tracker (<75%), semester marksheet & transcript download, and printable student ID badge.
- **🪪 3D Physical Student ID Card Generator**: Realistic front/back identity card preview with college emblem, student photograph, barcode, emergency contacts, and high-resolution QR verification code.
- **📜 University Grade Sheet / Marksheet Generation**: Automated SGPA & CGPA calculation based on a 10-point academic grading scale, official seal, course-wise credit points, Dean/Controller signatures, and instant print/PDF export with celebration confetti.
- **💳 Financial & Fee Management**: Semester fee structures, payment recording with automatic receipt generation (`RCP-2026-XXXXX`), overdue dues alerts, and printable official University Fee Receipts.
- **⚡ Digital Payments & Webhook Auto-Reconciliation**: Integrated checkout session creator (`/api/fees/:feeId/checkout-session`) and cryptographic payment webhook receiver (`/api/webhooks/payment`) supporting Stripe, Razorpay, and auto-issuance of online receipts (`RCP-2026-ONLINE-XXXXX`).
- **⚠️ Automated Attendance Defaulter Alerts**: Automatic evaluation of lecture turnout. When a student's attendance drops below the 75% examination threshold, an institutional alert is instantly generated across in-app and communication channels.
- **🏢 Multi-Tenant Architecture**: Institutional isolation with `tenants` catalog, subdomain routing, and `X-Tenant-ID` header resolution.
- **🛡️ Enterprise Security & Rate Limiting**: Hardened with `helmet` security headers, strict IP rate limiting on authentication routes (preventing brute-force attempts), and RBAC (`admin`, `faculty`, `student`).
- **🔍 Immutable Audit Trail**: Comprehensive logging (`audit_logs`) tracking administrative actions, fee settlements, and grade entries.
- **📊 Real-Time Analytics Dashboard**: Total enrollment KPI counters, attendance turnout timeline bar graphs, department distribution, honor roll (top GPA performers), and live campus notices.
- **📥 CSV Data Export**: One-click student directory and billing ledger export to CSV.

---

## 🏗️ Project Architecture

```
student-management-system/
├── backend/
│   ├── data/
│   │   └── student_management.db    # SQLite database (auto-created)
│   ├── uploads/                     # Student avatars & uploaded files
│   ├── db.js                        # Schema DDL, relationships, audit & alert dispatchers
│   ├── server.js                    # Express REST API (RBAC, Rate Limits, Webhooks, Tenants)
│   ├── test_enterprise_suite.js     # Automated E2E integration test runner
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddGradeModal.jsx     # Grade submission & live GPA calculator
│   │   │   ├── AddStudentModal.jsx   # Student enrollment form with avatar picker
│   │   │   ├── AttendanceSheet.jsx   # Interactive daily attendance tracker
│   │   │   ├── AuthScreen.jsx        # JWT Authentication with 1-click evaluator demo logins
│   │   │   ├── FeeReceiptModal.jsx   # Printable university payment receipt
│   │   │   ├── OnboardingWizard.jsx  # Student matriculation onboarding stepper
│   │   │   ├── RecordPaymentModal.jsx# Fee payment modal with 1-click Stripe webhook simulation
│   │   │   ├── ReportCardModal.jsx   # Official university transcript / marksheet
│   │   │   ├── StudentDetailModal.jsx# Full dossier with 5 tabs (Profile, Courses, Att, Grades, Fees)
│   │   │   └── StudentIdCard.jsx     # 3D flippable PVC identity card (Front & Back)
│   │   ├── App.jsx                   # Main layout, role switcher, navigation & dashboard
│   │   ├── index.css                 # Custom responsive design system (Dark/Light + Print rules)
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js               # Vite proxy to backend port 5050
│   └── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher; v22 recommended)
- npm (v9 or higher)

### 1. Start Backend Server & Run Tests
```bash
cd backend
npm install
npm test          # Runs automated 14-test end-to-end integration suite
node server.js    # Starts the REST API on port 5050
```
*The backend server will start on port `5050` and automatically create/seed `student_management.db`.*

### 2. Start Frontend Application
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will launch at `http://localhost:3000/` with proxy configured to the backend.*

---

## 🗄️ Database Schema & Entities

The SQLite database (`student_management.db`) includes the following relational tables with foreign key enforcement:

| Table | Description | Key Attributes |
| :--- | :--- | :--- |
| `tenants` | Multi-tenant institutions | `id`, `name`, `subdomain`, `code`, `logo_url`, `currency`, `timezone` |
| `departments` | Academic divisions | `id`, `code`, `name`, `hod`, `intake`, `description` |
| `courses` | Subject catalog | `id`, `code`, `name`, `department_id`, `semester`, `credits`, `type`, `instructor` |
| `students` | Student records | `id`, `roll_number`, `first_name`, `last_name`, `email`, `phone`, `dob`, `gender`, `blood_group`, `department_id`, `semester`, `batch`, `program`, `avatar_url`, `status` |
| `users` | RBAC accounts | `id`, `email`, `password`, `role` (admin/faculty/student), `name`, `student_id`, `is_onboarded` |
| `attendance` | Daily lecture logs | `id`, `student_id`, `course_id`, `date`, `status` (Present/Absent/Late/Excused), `remarks` |
| `grades` | Examination scores | `id`, `student_id`, `course_id`, `exam_type`, `semester`, `max_marks`, `marks_obtained`, `grade_letter`, `grade_points`, `remarks` |
| `fees` | Billing structures | `id`, `student_id`, `fee_type`, `semester`, `academic_year`, `total_amount`, `paid_amount`, `due_date`, `status` |
| `fee_payments` | Transaction receipts | `id`, `fee_id`, `student_id`, `receipt_no`, `amount`, `payment_method`, `transaction_ref`, `payment_date` |
| `alert_notifications`| Defaulter notices & alerts | `id`, `tenant_id`, `student_id`, `course_id`, `alert_type`, `title`, `message`, `channel`, `status` |
| `audit_logs` | Immutable audit trail | `id`, `tenant_id`, `user_id`, `user_email`, `action`, `entity_type`, `entity_id`, `details`, `ip_address` |
| `notices` | Campus announcements | `id`, `title`, `category`, `content`, `posted_by`, `target_role`, `date`, `priority` |


---

## 🎯 Grading & Evaluation Scale

The system implements the standard 10-Point UGC/AICTE Grading System:

| Percentage Range | Grade Letter | Grade Points | Qualitative Assessment |
| :--- | :---: | :---: | :--- |
| **≥ 90%** | **A+** | **10.0** | Outstanding |
| **80% – 89%** | **A** | **9.0** | Excellent |
| **70% – 79%** | **B+** | **8.0** | Very Good |
| **60% – 69%** | **B** | **7.0** | Good |
| **50% – 59%** | **C** | **6.0** | Average / Above Average |
| **40% – 49%** | **D** | **4.0** | Pass Minimum |
| **< 40%** | **F** | **0.0** | Fail / Arrear |

- **Semester Grade Point Average (SGPA)**:
  $$\text{SGPA} = \frac{\sum (\text{Course Credits} \times \text{Grade Points})}{\sum \text{Course Credits}}$$
- **Cumulative Grade Point Average (CGPA)**:
  $$\text{CGPA} = \frac{\sum_{\text{all sem}} (\text{Credits} \times \text{Grade Points})}{\sum_{\text{all sem}} \text{Credits}}$$

---

## 🎤 College Presentation & Viva Cheat Sheet

### Q1: Why use SQLite instead of MySQL or MongoDB for this project?
> **Answer**: SQLite is serverless, zero-configuration, and stores the entire relational database in a single portable file (`student_management.db`). This makes the application completely self-contained, guaranteeing that evaluators, external examiners, or professors can run the project on any machine without installing database server daemons.

### Q2: How does the system enforce attendance shortage rules?
> **Answer**: The system aggregates attendance across logged dates per course. If a student's attendance falls below 75%, their attendance indicator highlights in red warning with an examination eligibility restriction notice on their profile.

### Q3: How is data privacy maintained across roles?
> **Answer**: The system simulates three distinct portal perspectives (Admin, Faculty, and Student). Students only view their personalized scores, enrolled subjects, fee receipts, and digital ID card, while faculty can record marks and take class attendance, and administrators maintain institutional oversight.

### Q4: How is report card / ID printing handled?
> **Answer**: Dedicated `@media print` CSS rules automatically strip the sidebar, header, and action buttons during printing, formatting the marksheet, fee voucher, and student ID card with exact millimeter margins for clean PDF and physical paper printing.

---

## 📜 License
Developed for educational evaluation and college submissions. Open source under the MIT License.
#   s m s  
 