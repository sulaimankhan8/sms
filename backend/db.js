const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'student_management.db');
const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      hod TEXT NOT NULL,
      intake INTEGER DEFAULT 60,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
      semester INTEGER NOT NULL,
      credits INTEGER NOT NULL DEFAULT 3,
      type TEXT NOT NULL DEFAULT 'Core',
      instructor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roll_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      blood_group TEXT,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
      semester INTEGER NOT NULL DEFAULT 1,
      batch TEXT NOT NULL,
      program TEXT NOT NULL DEFAULT 'B.Tech',
      admission_date TEXT NOT NULL,
      address TEXT,
      guardian_name TEXT,
      guardian_phone TEXT,
      avatar_url TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'faculty', 'student')),
      name TEXT NOT NULL,
      student_id INTEGER REFERENCES students(id) ON DELETE SET NULL,
      faculty_id INTEGER,
      is_onboarded INTEGER DEFAULT 0,
      avatar_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Late', 'Excused')),
      remarks TEXT,
      UNIQUE(student_id, course_id, date)
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      exam_type TEXT NOT NULL,
      semester INTEGER NOT NULL,
      max_marks REAL NOT NULL DEFAULT 100,
      marks_obtained REAL NOT NULL,
      grade_letter TEXT NOT NULL,
      grade_points REAL NOT NULL,
      remarks TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      fee_type TEXT NOT NULL,
      semester INTEGER NOT NULL,
      academic_year TEXT NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fee_id INTEGER NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      receipt_no TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_ref TEXT,
      payment_date TEXT NOT NULL,
      remarks TEXT
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      posted_by TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'All',
      date TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Normal'
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      logo_url TEXT,
      currency TEXT DEFAULT 'USD',
      timezone TEXT DEFAULT 'UTC',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      user_id INTEGER,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alert_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER DEFAULT 1,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
      alert_type TEXT NOT NULL,
      recipient_email TEXT,
      recipient_phone TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'IN_APP',
      status TEXT NOT NULL DEFAULT 'DELIVERED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function calculateGrade(marks, maxMarks = 100) {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return { letter: 'A+', points: 10 };
  if (percentage >= 80) return { letter: 'A', points: 9 };
  if (percentage >= 70) return { letter: 'B+', points: 8 };
  if (percentage >= 60) return { letter: 'B', points: 7 };
  if (percentage >= 50) return { letter: 'C', points: 6 };
  if (percentage >= 40) return { letter: 'D', points: 4 };
  return { letter: 'F', points: 0 };
}

function seedDatabase(force = false) {
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (usersCount && usersCount.count > 0 && !force) {
    console.log('Database already populated with users and records.');
    return;
  }

  console.log('Seeding database with fresh mock dataset and authentic RBAC users...');
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(`
    DELETE FROM fee_payments;
    DELETE FROM fees;
    DELETE FROM grades;
    DELETE FROM attendance;
    DELETE FROM users;
    DELETE FROM students;
    DELETE FROM courses;
    DELETE FROM departments;
    DELETE FROM notices;
  `);
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Departments
  const insertDept = db.prepare(`
    INSERT INTO departments (code, name, hod, intake, description) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertDept.run('CSE', 'Computer Science & Engineering', 'Dr. Aris Thorne', 120, 'Software systems, Artificial Intelligence, and Cloud Computing.');
  insertDept.run('ECE', 'Electronics & Communication', 'Dr. Elena Rostova', 90, 'VLSI design, Signal Processing, and IoT Hardware.');
  insertDept.run('IT', 'Information Technology', 'Prof. Kenneth Wright', 60, 'Network infrastructure, Cybersecurity, and Web Technologies.');
  insertDept.run('ME', 'Mechanical Engineering', 'Dr. Samuel Vance', 60, 'Robotics, Thermodynamics, and Advanced Manufacturing.');
  insertDept.run('BBA', 'Management & Business Admin', 'Dr. Patricia Sterling', 80, 'Business analytics, Corporate finance, and Entrepreneurship.');

  const depts = db.prepare('SELECT * FROM departments').all();
  const cseId = depts.find(d => d.code === 'CSE').id;
  const eceId = depts.find(d => d.code === 'ECE').id;
  const itId = depts.find(d => d.code === 'IT').id;
  const meId = depts.find(d => d.code === 'ME').id;
  const bbaId = depts.find(d => d.code === 'BBA').id;

  // 2. Courses
  const insertCourse = db.prepare(`
    INSERT INTO courses (code, name, department_id, semester, credits, type, instructor)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertCourse.run('CS101', 'Data Structures & Algorithms', cseId, 3, 4, 'Core', 'Dr. Alan Turing');
  insertCourse.run('CS102', 'Database Management Systems', cseId, 3, 4, 'Core', 'Prof. Barbara Liskov');
  insertCourse.run('CS103', 'Operating Systems & Kernels', cseId, 4, 4, 'Core', 'Dr. Ken Thompson');
  insertCourse.run('CS104', 'Artificial Intelligence & ML', cseId, 5, 4, 'Core', 'Dr. Geoffrey Hinton');
  insertCourse.run('CS105', 'Web & Cloud Application Dev', cseId, 3, 3, 'Lab', 'Prof. Tim Berners');

  insertCourse.run('EC201', 'Digital Signal Processing', eceId, 3, 4, 'Core', 'Dr. Claude Shannon');
  insertCourse.run('EC202', 'Microprocessors & Microcontrollers', eceId, 4, 4, 'Core', 'Prof. Lynn Conway');
  insertCourse.run('EC203', 'Embedded Systems & IoT Lab', eceId, 3, 2, 'Lab', 'Dr. Robert Noyce');

  insertCourse.run('IT301', 'Network Security & Cryptography', itId, 5, 4, 'Core', 'Prof. Adi Shamir');
  insertCourse.run('IT302', 'Cloud Computing Architecture', itId, 5, 3, 'Elective', 'Dr. Werner Vogels');

  insertCourse.run('ME401', 'Computer Aided Design (CAD)', meId, 3, 3, 'Lab', 'Prof. James Watt');
  insertCourse.run('BA501', 'Financial Accounting & Analytics', bbaId, 3, 4, 'Core', 'Prof. Warren Buffett');

  const allCourses = db.prepare('SELECT * FROM courses').all();

  // 3. Students
  const insertStudent = db.prepare(`
    INSERT INTO students (
      roll_number, first_name, last_name, email, phone, dob, gender, blood_group,
      department_id, semester, batch, program, admission_date, address,
      guardian_name, guardian_phone, avatar_url, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const mockStudents = [
    { roll: '2023CS101', first: 'Aarav', last: 'Sharma', email: 'student@apex.edu', phone: '+91 98765 43210', dob: '2004-03-15', gender: 'Male', bg: 'O+', dept: cseId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-01', addr: 'Flat 402, Skyline Towers, Tech Hub', gName: 'Rajesh Sharma', gPhone: '+91 98765 00001', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023CS102', first: 'Ananya', last: 'Iyer', email: 'ananya.iyer@apex.edu', phone: '+91 98765 43211', dob: '2004-07-22', gender: 'Female', bg: 'A+', dept: cseId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-01', addr: '12 Temple Street, Green Garden', gName: 'Sundar Iyer', gPhone: '+91 98765 00002', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023CS103', first: 'Devansh', last: 'Verma', email: 'devansh.verma@apex.edu', phone: '+91 98765 43212', dob: '2003-11-09', gender: 'Male', bg: 'B+', dept: cseId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-01', addr: '88 Cyber Heights, Silicon Valley', gName: 'Alok Verma', gPhone: '+91 98765 00003', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023CS104', first: 'Diya', last: 'Patel', email: 'diya.patel@apex.edu', phone: '+91 98765 43213', dob: '2004-01-30', gender: 'Female', bg: 'AB+', dept: cseId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-01', addr: '45 Lotus Residency, Lake City', gName: 'Mukesh Patel', gPhone: '+91 98765 00004', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023EC201', first: 'Rohan', last: 'Kulkarni', email: 'rohan.k@apex.edu', phone: '+91 98765 43214', dob: '2004-05-18', gender: 'Male', bg: 'O-', dept: eceId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-02', addr: 'B-10, Shivam Enclave, Metro Road', gName: 'Vikas Kulkarni', gPhone: '+91 98765 00005', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023EC202', first: 'Pooja', last: 'Reddy', email: 'pooja.reddy@apex.edu', phone: '+91 98765 43215', dob: '2003-09-12', gender: 'Female', bg: 'A-', dept: eceId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-02', addr: '23 Hillview Avenue, Banjara Hills', gName: 'Krishna Reddy', gPhone: '+91 98765 00006', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2022CS301', first: 'Kabir', last: 'Mehta', email: 'kabir.mehta@apex.edu', phone: '+91 98765 43216', dob: '2003-02-14', gender: 'Male', bg: 'B+', dept: cseId, sem: 5, batch: '2022-2026', prog: 'B.Tech', adm: '2022-08-01', addr: '74 Sunrise Villa, Palm Beach', gName: 'Sanjay Mehta', gPhone: '+91 98765 00007', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2022CS302', first: 'Sara', last: 'Fernandes', email: 'sara.f@apex.edu', phone: '+91 98765 43217', dob: '2003-06-25', gender: 'Female', bg: 'O+', dept: cseId, sem: 5, batch: '2022-2026', prog: 'B.Tech', adm: '2022-08-01', addr: '19 Sea Breeze Colony, Coastal Rd', gName: 'David Fernandes', gPhone: '+91 98765 00008', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2022IT301', first: 'Vikram', last: 'Singhania', email: 'vikram.s@apex.edu', phone: '+91 98765 43218', dob: '2003-04-10', gender: 'Male', bg: 'A+', dept: itId, sem: 5, batch: '2022-2026', prog: 'B.Tech', adm: '2022-08-03', addr: '33 Windsor Park, Cantonment', gName: 'Raghav Singhania', gPhone: '+91 98765 00009', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023ME401', first: 'Arjun', last: 'Nair', email: 'arjun.nair@apex.edu', phone: '+91 98765 43219', dob: '2004-08-05', gender: 'Male', bg: 'B-', dept: meId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-04', addr: '55 Olive Greens, Greenfield Extn', gName: 'Mohan Nair', gPhone: '+91 98765 00010', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023BA501', first: 'Meera', last: 'Kapoor', email: 'meera.k@apex.edu', phone: '+91 98765 43220', dob: '2004-12-01', gender: 'Female', bg: 'O+', dept: bbaId, sem: 3, batch: '2023-2026', prog: 'BBA', adm: '2023-08-05', addr: '102 Royal Palm, Boulevard Ave', gName: 'Ashok Kapoor', gPhone: '+91 98765 00011', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces', status: 'Active' },
    { roll: '2023CS105', first: 'Nikhil', last: 'Chopra', email: 'nikhil.c@apex.edu', phone: '+91 98765 43221', dob: '2004-02-18', gender: 'Male', bg: 'AB-', dept: cseId, sem: 3, batch: '2023-2027', prog: 'B.Tech', adm: '2023-08-01', addr: '7 Central Lane, Downtown', gName: 'Vivek Chopra', gPhone: '+91 98765 00012', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces', status: 'Active' }
  ];

  for (const s of mockStudents) {
    insertStudent.run(
      s.roll, s.first, s.last, s.email, s.phone, s.dob, s.gender, s.bg,
      s.dept, s.sem, s.batch, s.prog, s.adm, s.addr, s.gName, s.gPhone, s.avatar, s.status
    );
  }

  const allStudents = db.prepare('SELECT * FROM students').all();

  // 4. Create RBAC User Accounts with bcrypt
  const salt = bcrypt.genSaltSync(10);
  const insertUser = db.prepare(`
    INSERT INTO users (email, password, role, name, student_id, faculty_id, is_onboarded, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Admin Account
  insertUser.run(
    'admin@apex.edu',
    bcrypt.hashSync('Admin@123', salt),
    'admin',
    'Dr. Aris Thorne',
    null,
    null,
    1,
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces'
  );

  // Faculty Account (Dr. Alan Turing)
  insertUser.run(
    'faculty@apex.edu',
    bcrypt.hashSync('Faculty@123', salt),
    'faculty',
    'Dr. Alan Turing',
    null,
    1, // Faculty in charge of CS101
    1,
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
  );

  // Onboarded Student Account (Aarav Sharma)
  const aarav = allStudents.find(s => s.roll_number === '2023CS101');
  if (aarav) {
    insertUser.run(
      'student@apex.edu',
      bcrypt.hashSync('Student@123', salt),
      'student',
      'Aarav Sharma',
      aarav.id,
      null,
      1,
      aarav.avatar_url
    );
  }

  // Fresh Student Account (NOT YET ONBOARDED - to test onboarding wizard flow!)
  insertUser.run(
    'fresh@apex.edu',
    bcrypt.hashSync('Fresh@123', salt),
    'student',
    'Priya Nair',
    null,
    null,
    0, // Needs onboarding!
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
  );

  // 5. Attendance Generation
  const insertAtt = db.prepare(`
    INSERT OR REPLACE INTO attendance (student_id, course_id, date, status, remarks)
    VALUES (?, ?, ?, ?, ?)
  `);

  const dates = [
    '2026-09-01', '2026-09-03', '2026-09-05', '2026-09-08', '2026-09-10',
    '2026-09-12', '2026-09-15', '2026-09-17', '2026-09-19', '2026-09-22',
    '2026-09-24', '2026-09-26', '2026-09-29', '2026-10-02', '2026-10-06',
    '2026-10-08', '2026-10-10', '2026-10-13'
  ];

  const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late'];

  for (const student of allStudents) {
    const studentCourses = allCourses.filter(c => c.department_id === student.department_id && c.semester === student.semester);
    for (const course of studentCourses) {
      for (const d of dates) {
        let status = 'Present';
        const rand = Math.random();
        if (student.first_name === 'Devansh') {
          status = rand > 0.65 ? (rand > 0.9 ? 'Late' : 'Absent') : 'Present';
        } else if (student.first_name === 'Ananya') {
          status = 'Present';
        } else {
          status = statuses[Math.floor(Math.random() * statuses.length)];
        }
        insertAtt.run(student.id, course.id, d, status, status === 'Late' ? 'Arrived 15m late' : null);
      }
    }
  }

  // 6. Grades
  const insertGrade = db.prepare(`
    INSERT INTO grades (student_id, course_id, exam_type, semester, max_marks, marks_obtained, grade_letter, grade_points, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const student of allStudents) {
    const studentCourses = allCourses.filter(c => c.department_id === student.department_id && c.semester === student.semester);
    for (const course of studentCourses) {
      let marks1 = 65 + Math.floor(Math.random() * 32);
      if (student.first_name === 'Ananya') marks1 = 96;
      if (student.first_name === 'Devansh') marks1 = 72;
      const g1 = calculateGrade(marks1, 100);
      insertGrade.run(student.id, course.id, 'Midterm Exam', student.semester, 100, marks1, g1.letter, g1.points, marks1 >= 90 ? 'Outstanding grasp of topics' : 'Good performance');

      let marks2 = 70 + Math.floor(Math.random() * 28);
      if (student.first_name === 'Ananya') marks2 = 98;
      const g2 = calculateGrade(marks2, 100);
      insertGrade.run(student.id, course.id, 'Internal Assessment', student.semester, 100, marks2, g2.letter, g2.points, 'Assignments and lab quizzes');
    }
  }

  // 7. Fees
  const insertFee = db.prepare(`
    INSERT INTO fees (student_id, fee_type, semester, academic_year, total_amount, paid_amount, due_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPayment = db.prepare(`
    INSERT INTO fee_payments (fee_id, student_id, receipt_no, amount, payment_method, transaction_ref, payment_date, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let receiptCounter = 1001;

  for (const student of allStudents) {
    const tuitionTotal = 45000;
    let paidAmount = 45000;
    let feeStatus = 'Paid';
    let dueDate = '2026-08-31';

    if (student.first_name === 'Devansh') {
      paidAmount = 20000;
      feeStatus = 'Partial';
      dueDate = '2026-10-30';
    } else if (student.first_name === 'Nikhil') {
      paidAmount = 0;
      feeStatus = 'Overdue';
      dueDate = '2026-09-15';
    }

    const feeResult = insertFee.run(
      student.id, 'Semester Tuition Fee', student.semester, '2026-2027',
      tuitionTotal, paidAmount, dueDate, feeStatus
    );
    const feeId = feeResult.lastInsertRowid;

    if (paidAmount > 0) {
      insertPayment.run(
        feeId, student.id, `RCP-2026-${receiptCounter++}`, paidAmount,
        'UPI', `TXN_UPI_${Date.now()}_${Math.floor(Math.random()*9000+1000)}`,
        '2026-08-15', 'Full/Advance Tuition payment for Term'
      );
    }

    const labFee = insertFee.run(
      student.id, 'Digital Library & Laboratory Fee', student.semester, '2026-2027',
      5000, 5000, '2026-08-31', 'Paid'
    );
    insertPayment.run(
      labFee.lastInsertRowid, student.id, `RCP-2026-${receiptCounter++}`, 5000,
      'Net Banking', `TXN_NB_${Date.now()}_${Math.floor(Math.random()*9000+1000)}`,
      '2026-08-16', 'Institutional amenities access fee'
    );
  }

  // 8. Notices
  const insertNotice = db.prepare(`
    INSERT INTO notices (title, category, content, posted_by, target_role, date, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotice.run(
    'Mid-Semester Examination Schedule Announced',
    'Exam',
    'The timetable for the upcoming Mid-Semester Examinations (Fall 2026) has been published on the portal. Please ensure your hall tickets and clearances are finalized.',
    'Office of the Controller of Examinations',
    'All',
    '2026-10-10',
    'High'
  );

  insertNotice.run(
    'Annual Inter-College Hackathon & Robotics Expo',
    'Event',
    'Registration for the 48-hour Campus Hackathon "HackSphere 2026" is now live. Cash prizes up to $5,000 for top 3 teams. Students can form cross-departmental teams of 4.',
    'Department of CSE & Student Council',
    'Students',
    '2026-10-12',
    'Normal'
  );

  insertNotice.run(
    'Last Date for Tuition Fee Installment Clearance',
    'Academic',
    'Students with partial fee balances for the current semester must clear outstanding amounts before October 31st to avoid late fee penalties and examination holds.',
    'Finance & Accounts Department',
    'Students',
    '2026-10-08',
    'High'
  );

  insertNotice.run(
    'Faculty Workshop on Generative AI & Curriculum Redesign',
    'Academic',
    'All faculty members are invited to the special seminar on integrating modern AI frameworks into laboratory syllabi on Saturday 2:00 PM in Auditorium B.',
    'Dean of Academic Affairs',
    'Faculty',
    '2026-10-05',
    'Normal'
  );

  // 10. Seed Default Institutional Tenant
  const tenantExists = db.prepare('SELECT id FROM tenants WHERE subdomain = ?').get('apex');
  if (!tenantExists) {
    db.prepare(`
      INSERT INTO tenants (id, name, subdomain, code, logo_url, currency, timezone)
      VALUES (1, 'Apex Institute of Technology & Management', 'apex', 'APEX-CAMPUS', 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&h=128&fit=crop', 'USD', 'America/New_York')
    `).run();
  }

  // 11. Initial Audit Log
  const logCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  if (logCount === 0) {
    db.prepare(`
      INSERT INTO audit_logs (tenant_id, user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (1, 1, 'admin@apex.edu', 'SYSTEM_INITIALIZATION', 'SYSTEM', '1', 'Enterprise security and multi-tenant schema initialized successfully', '127.0.0.1')
    `).run();
  }

  console.log('Seeding completed successfully with authentic RBAC users!');
}

function logAudit({ tenant_id = 1, user_id = null, user_email = 'system@apex.edu', action, entity_type, entity_id = null, details = '', ip_address = '127.0.0.1' }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (tenant_id, user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(tenant_id, user_id, user_email, action, entity_type, String(entity_id || ''), String(details), ip_address);
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

function dispatchAlert({ tenant_id = 1, student_id = null, course_id = null, alert_type, recipient_email = null, recipient_phone = null, title, message, channel = 'IN_APP', status = 'DELIVERED' }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO alert_notifications (tenant_id, student_id, course_id, alert_type, recipient_email, recipient_phone, title, message, channel, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(tenant_id, student_id, course_id, alert_type, recipient_email, recipient_phone, title, message, channel, status);
  } catch (err) {
    console.error('Alert dispatch error:', err.message);
  }
}

function ensureEnterpriseDefaults() {
  try {
    const tenantExists = db.prepare('SELECT id FROM tenants WHERE id = 1').get();
    if (!tenantExists) {
      db.prepare(`
        INSERT INTO tenants (id, name, subdomain, code, logo_url, currency, timezone)
        VALUES (1, 'Apex Institute of Technology & Management', 'apex', 'APEX-CAMPUS', 'https://images.unsplash.com/photo-1562774053-701939374585?w=128&h=128&fit=crop', 'USD', 'America/New_York')
      `).run();
    }

    const logExists = db.prepare('SELECT id FROM audit_logs WHERE id = 1').get();
    if (!logExists) {
      db.prepare(`
        INSERT INTO audit_logs (tenant_id, user_id, user_email, action, entity_type, entity_id, details, ip_address)
        VALUES (1, 1, 'admin@apex.edu', 'SYSTEM_INITIALIZATION', 'SYSTEM', '1', 'Enterprise security, rate-limiting, and multi-tenant schema initialized successfully', '127.0.0.1')
      `).run();
    }

    const alertExists = db.prepare('SELECT id FROM alert_notifications WHERE id = 1').get();
    if (!alertExists) {
      db.prepare(`
        INSERT INTO alert_notifications (tenant_id, student_id, course_id, alert_type, recipient_email, recipient_phone, title, message, channel, status)
        VALUES (1, NULL, NULL, 'SYSTEM_NOTIFICATION', 'registrar@apex.edu', '+1 (555) 019-2834', 'System Security Upgrade Live', 'Apex Campus Enterprise v2.0 is live with multi-tenancy, rate limiting, and automated payment reconciliation.', 'IN_APP', 'DELIVERED')
      `).run();
    }
  } catch (err) {
    console.error('Error ensuring enterprise defaults:', err.message);
  }
}

initSchema();
ensureEnterpriseDefaults();
seedDatabase(false);

module.exports = {
  db,
  initSchema,
  seedDatabase,
  calculateGrade,
  logAudit,
  dispatchAlert
};


