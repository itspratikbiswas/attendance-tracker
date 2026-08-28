/**
 * Isolated Multi-User Storage & Authentication Layer
 * Handles user profiles, isolated namespaces per userId, timetable routines, and attendance records.
 */

const STORAGE_KEYS = {
  USERS_LIST: 'attend_tracker_users_v2',
  CURRENT_SESSION: 'attend_tracker_session_v2',
  GLOBAL_CONFIG: 'attend_tracker_config_v2'
};

const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://unnivvoxhgtijjxwgeue.supabase.co',
  anonKey: 'sb_publishable_Fr2_aI_2cBK53lOem-fayA_DMZzpBoj'
};

class StorageService {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Check if session exists
    const session = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (session) {
      try {
        this.currentUser = JSON.parse(session);
      } catch (e) {
        this.currentUser = null;
      }
    }
  }

  // Get all registered users
  getUsers() {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    if (!raw) {
      return this.seedDefaultUsers();
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return this.seedDefaultUsers();
    }
  }

  // Seed realistic demo users
  seedDefaultUsers() {
    const demoUsers = [
      {
        id: 'usr_demo_101',
        name: 'Alex Rivera',
        email: 'alex@student.edu',
        username: 'alex_cs',
        password: 'password123',
        role: 'Computer Science Major',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_demo_102',
        name: 'Elena Rostova',
        email: 'elena@univ.ac.in',
        username: 'elena_eng',
        password: 'password123',
        role: 'Electrical Engineering',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      }
    ];

    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(demoUsers));
    
    // Seed initial realistic data for demo 101
    this.seedDemoUserData('usr_demo_101');
    return demoUsers;
  }

  seedDemoUserData(userId) {
    const initialData = {
      settings: {
        trackingMode: 'hour', // 'hour' | 'day'
        minAttendanceTarget: 75,
        geminiApiKey: '',
        notifyLowAttendance: true,
        academicTerm: 'Fall Semester 2026'
      },
      subjects: [
        { id: 'sub_1', name: 'Data Structures & Algorithms', code: 'CS-301', color: '#6366f1', icon: 'binary' },
        { id: 'sub_2', name: 'Database Management Systems', code: 'CS-304', color: '#06b6d4', icon: 'database' },
        { id: 'sub_3', name: 'Computer Networks', code: 'CS-307', color: '#10b981', icon: 'network' },
        { id: 'sub_4', name: 'Operating Systems & Kernel', code: 'CS-309', color: '#f59e0b', icon: 'cpu' },
        { id: 'sub_5', name: 'Web Engineering & Cloud', code: 'CS-312', color: '#ec4899', icon: 'globe' }
      ],
      timetable: [
        // Monday
        { id: 'tt_1', subjectId: 'sub_1', day: 'Monday', startTime: '09:00', endTime: '10:30', durationHours: 1.5, room: 'Hall A-201', instructor: 'Dr. Sarah Mitchell' },
        { id: 'tt_2', subjectId: 'sub_2', day: 'Monday', startTime: '11:00', endTime: '13:00', durationHours: 2.0, room: 'Lab 4B', instructor: 'Prof. R. Vance' },
        { id: 'tt_3', subjectId: 'sub_3', day: 'Monday', startTime: '14:00', endTime: '15:30', durationHours: 1.5, room: 'Hall B-105', instructor: 'Dr. Kevin Zhao' },
        // Tuesday
        { id: 'tt_4', subjectId: 'sub_4', day: 'Tuesday', startTime: '10:00', endTime: '12:00', durationHours: 2.0, room: 'Hall C-302', instructor: 'Prof. David Lee' },
        { id: 'tt_5', subjectId: 'sub_5', day: 'Tuesday', startTime: '13:30', endTime: '15:00', durationHours: 1.5, room: 'Cloud Lab 1', instructor: 'Dr. Priya Sharma' },
        // Wednesday
        { id: 'tt_6', subjectId: 'sub_1', day: 'Wednesday', startTime: '09:00', endTime: '11:00', durationHours: 2.0, room: 'Hall A-201', instructor: 'Dr. Sarah Mitchell' },
        { id: 'tt_7', subjectId: 'sub_3', day: 'Wednesday', startTime: '11:30', endTime: '13:00', durationHours: 1.5, room: 'Hall B-105', instructor: 'Dr. Kevin Zhao' },
        { id: 'tt_8', subjectId: 'sub_2', day: 'Wednesday', startTime: '14:00', endTime: '16:00', durationHours: 2.0, room: 'Lab 4B', instructor: 'Prof. R. Vance' },
        // Thursday
        { id: 'tt_9', subjectId: 'sub_4', day: 'Thursday', startTime: '09:30', endTime: '11:00', durationHours: 1.5, room: 'Hall C-302', instructor: 'Prof. David Lee' },
        { id: 'tt_10', subjectId: 'sub_5', day: 'Thursday', startTime: '11:30', endTime: '13:30', durationHours: 2.0, room: 'Cloud Lab 1', instructor: 'Dr. Priya Sharma' },
        // Friday
        { id: 'tt_11', subjectId: 'sub_1', day: 'Friday', startTime: '10:00', endTime: '11:30', durationHours: 1.5, room: 'Hall A-201', instructor: 'Dr. Sarah Mitchell' },
        { id: 'tt_12', subjectId: 'sub_2', day: 'Friday', startTime: '13:00', endTime: '14:30', durationHours: 1.5, room: 'Lab 4B', instructor: 'Prof. R. Vance' },
        { id: 'tt_13', subjectId: 'sub_3', day: 'Friday', startTime: '15:00', endTime: '16:30', durationHours: 1.5, room: 'Hall B-105', instructor: 'Dr. Kevin Zhao' }
      ],
      attendanceRecords: this.generateSeedAttendanceLogs()
    };

    localStorage.setItem(this.getUserStorageKey(userId), JSON.stringify(initialData));
  }

  generateSeedAttendanceLogs() {
    const logs = [];
    const today = new Date();
    const subIds = [
      { id: 'sub_1', name: 'Data Structures & Algorithms', hrs: 1.5 },
      { id: 'sub_2', name: 'Database Management Systems', hrs: 2.0 },
      { id: 'sub_3', name: 'Computer Networks', hrs: 1.5 },
      { id: 'sub_4', name: 'Operating Systems & Kernel', hrs: 2.0 },
      { id: 'sub_5', name: 'Web Engineering & Cloud', hrs: 1.5 }
    ];

    // Seed past 20 class sessions with realistic pattern (~80% attendance)
    for (let i = 24; i >= 1; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      
      const dateStr = d.toISOString().split('T')[0];
      const sub = subIds[i % subIds.length];
      
      // Distribution: mostly present, occasional absent/cancelled
      let status = 'present';
      if (i === 4 || i === 11 || i === 18) {
        status = 'absent';
      } else if (i === 8) {
        status = 'cancelled';
      }

      logs.push({
        id: `att_${Date.now()}_${i}`,
        date: dateStr,
        subjectId: sub.id,
        subjectName: sub.name,
        status: status, // 'present' | 'absent' | 'cancelled'
        durationHours: sub.hrs,
        note: status === 'cancelled' ? 'Professor attending conference' : (status === 'absent' ? 'Sick leave' : 'Attended lecture & lab'),
        timestamp: d.toISOString()
      });
    }

    return logs;
  }

  getUserStorageKey(userId) {
    return `attend_tracker_user_${userId}_data`;
  }

  // --- Auth Methods ---

  register(name, email, username, password, role = 'Student') {
    const users = this.getUsers();
    
    // Check if email or username taken
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      throw new Error('An account with this email or username already exists.');
    }

    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: password,
      role: role,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));

    // Initialize blank user dataset with sensible defaults
    const blankData = {
      settings: {
        trackingMode: 'hour',
        minAttendanceTarget: 75,
        geminiApiKey: '',
        notifyLowAttendance: true,
        academicTerm: 'Semester 1'
      },
      subjects: [
        { id: 'sub_1', name: 'Mathematics & Linear Algebra', code: 'MATH-101', color: '#6366f1', icon: 'calculator' },
        { id: 'sub_2', name: 'Physics for Engineers', code: 'PHY-102', color: '#06b6d4', icon: 'atom' },
        { id: 'sub_3', name: 'Programming Fundamentals', code: 'CS-101', color: '#10b981', icon: 'code' }
      ],
      timetable: [
        { id: 'tt_1', subjectId: 'sub_1', day: 'Monday', startTime: '09:00', endTime: '10:30', durationHours: 1.5, room: 'Hall 101', instructor: 'Prof. Gauss' },
        { id: 'tt_2', subjectId: 'sub_2', day: 'Monday', startTime: '11:00', endTime: '12:30', durationHours: 1.5, room: 'Lab 2', instructor: 'Dr. Newton' },
        { id: 'tt_3', subjectId: 'sub_3', day: 'Tuesday', startTime: '10:00', endTime: '12:00', durationHours: 2.0, room: 'Comp Lab', instructor: 'Dr. Turing' },
        { id: 'tt_4', subjectId: 'sub_1', day: 'Wednesday', startTime: '09:00', endTime: '10:30', durationHours: 1.5, room: 'Hall 101', instructor: 'Prof. Gauss' },
        { id: 'tt_5', subjectId: 'sub_3', day: 'Thursday', startTime: '13:00', endTime: '15:00', durationHours: 2.0, room: 'Comp Lab', instructor: 'Dr. Turing' }
      ],
      attendanceRecords: []
    };

    localStorage.setItem(this.getUserStorageKey(newUser.id), JSON.stringify(blankData));
    
    // Auto sync new account to Supabase Cloud
    const client = this.getSupabaseClient();
    if (client) {
      client.from('omniattend_user_sync').upsert([{
        user_id: newUser.id,
        user_email: newUser.email,
        user_name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        user_data: blankData,
        updated_at: new Date().toISOString()
      }], { onConflict: 'user_email' }).then(() => {}).catch(err => console.warn('Cloud register sync error:', err));
    }

    // Auto login
    this.setSession(newUser);
    return newUser;
  }

  async login(identifier, password) {
    const users = this.getUsers();
    const idClean = identifier.trim().toLowerCase();
    
    // 1. Check local device storage
    let user = users.find(u => 
      (u.email.toLowerCase() === idClean || u.username.toLowerCase() === idClean) && 
      u.password === password
    );

    // 2. If not found locally on this device, check Supabase Cloud
    if (!user) {
      const client = this.getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client
            .from('omniattend_user_sync')
            .select('*')
            .or(`user_email.eq.${idClean},username.eq.${idClean}`)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (data && data.password === password) {
            // Reconstruct user account locally on this new device
            user = {
              id: data.user_id,
              name: data.user_name || 'Student',
              email: data.user_email || idClean,
              username: data.username || idClean,
              password: data.password,
              role: 'Student',
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username || idClean}`,
              createdAt: data.updated_at
            };

            // Save user to device local storage
            users.push(user);
            localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));

            // Auto-restore timetable and attendance records
            if (data.user_data) {
              this.saveUserData(data.user_data, user.id);
            }
          }
        } catch (cloudErr) {
          console.warn('Cloud login lookup error:', cloudErr);
        }
      }
    }

    if (!user) {
      throw new Error('Invalid email/username or password. If registered on another device, make sure you configured Cloud Sync.');
    }

    this.setSession(user);
    return user;
  }

  resetPassword(identifier, newPassword) {
    const users = this.getUsers();
    const idClean = identifier.trim().toLowerCase();

    const userIndex = users.findIndex(u => 
      u.email.toLowerCase() === idClean || u.username.toLowerCase() === idClean
    );

    if (userIndex === -1) {
      throw new Error('No registered account found with that email or username.');
    }

    users[userIndex].password = newPassword;
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    return true;
  }

  setSession(user) {
    // Don't store password in session object
    const sessionUser = { ...user };
    delete sessionUser.password;
    
    this.currentUser = sessionUser;
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(sessionUser));
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // --- Isolated User Data Store Accessors ---

  getUserData() {
    if (!this.currentUser) {
      return null;
    }
    const key = this.getUserStorageKey(this.currentUser.id);
    const raw = localStorage.getItem(key);
    if (!raw) {
      this.seedDemoUserData(this.currentUser.id);
      return JSON.parse(localStorage.getItem(key));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return { settings: {}, subjects: [], timetable: [], attendanceRecords: [] };
    }
  }

  saveUserData(data, specificUserId = null) {
    const uid = specificUserId || (this.currentUser ? this.currentUser.id : null);
    if (!uid) return false;
    const key = this.getUserStorageKey(uid);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  }

  // Settings
  updateSettings(newSettings) {
    const data = this.getUserData();
    if (!data) return false;
    data.settings = { ...data.settings, ...newSettings };
    this.saveUserData(data);
    return data.settings;
  }

  getSettings() {
    const data = this.getUserData();
    return data ? data.settings : { trackingMode: 'hour', minAttendanceTarget: 75 };
  }

  // Subjects CRUD
  getSubjects() {
    const data = this.getUserData();
    return data ? data.subjects || [] : [];
  }

  addSubject(name, code, color = '#6366f1', icon = 'book') {
    const data = this.getUserData();
    if (!data) return null;
    const newSubject = {
      id: `sub_${Date.now()}`,
      name: name.trim(),
      code: code ? code.trim().toUpperCase() : '',
      color: color,
      icon: icon
    };
    data.subjects = data.subjects || [];
    data.subjects.push(newSubject);
    this.saveUserData(data);
    return newSubject;
  }

  deleteSubject(subjectId) {
    const data = this.getUserData();
    if (!data) return false;
    data.subjects = (data.subjects || []).filter(s => s.id !== subjectId);
    data.timetable = (data.timetable || []).filter(t => t.subjectId !== subjectId);
    data.attendanceRecords = (data.attendanceRecords || []).filter(a => a.subjectId !== subjectId);
    this.saveUserData(data);
    return true;
  }

  // Timetable CRUD
  getTimetable() {
    const data = this.getUserData();
    return data ? data.timetable || [] : [];
  }

  saveTimetable(newTimetable) {
    const data = this.getUserData();
    if (!data) return false;
    data.timetable = newTimetable;
    this.saveUserData(data);
    return true;
  }

  addTimetableSlot(slot) {
    const data = this.getUserData();
    if (!data) return null;
    const newSlot = {
      id: `tt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      ...slot
    };
    data.timetable = data.timetable || [];
    data.timetable.push(newSlot);
    this.saveUserData(data);
    return newSlot;
  }

  deleteTimetableSlot(slotId) {
    const data = this.getUserData();
    if (!data) return false;
    data.timetable = (data.timetable || []).filter(t => t.id !== slotId);
    this.saveUserData(data);
    return true;
  }

  // Attendance Records CRUD
  getAttendanceRecords() {
    const data = this.getUserData();
    return data ? data.attendanceRecords || [] : [];
  }

  markAttendance(subjectId, status, durationHours = 1.0, dateStr = null, note = '') {
    const data = this.getUserData();
    if (!data) return null;

    const subjects = data.subjects || [];
    const sub = subjects.find(s => s.id === subjectId);
    const subName = sub ? sub.name : 'Unknown Subject';

    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    const newRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: targetDate,
      subjectId: subjectId,
      subjectName: subName,
      status: status, // 'present' | 'absent' | 'cancelled'
      durationHours: Number(durationHours) || 1.0,
      note: note.trim(),
      timestamp: new Date().toISOString()
    };

    data.attendanceRecords = data.attendanceRecords || [];
    data.attendanceRecords.unshift(newRecord); // newest first
    this.saveUserData(data);
    return newRecord;
  }

  deleteAttendanceRecord(recordId) {
    const data = this.getUserData();
    if (!data) return false;
    data.attendanceRecords = (data.attendanceRecords || []).filter(r => r.id !== recordId);
    this.saveUserData(data);
    return true;
  }

  // Export / Import Data
  exportUserDataJSON() {
    const data = this.getUserData();
    if (!data) return null;
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      user: this.currentUser,
      data: data
    }, null, 2);
  }

  importUserDataJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.data || !parsed.data.subjects) {
        throw new Error('Invalid backup schema format');
      }
      this.saveUserData(parsed.data);
      return true;
    } catch (e) {
      throw new Error('Failed to parse and import data: ' + e.message);
    }
  }

  // Reset demo data
  resetCurrentUserData() {
    if (!this.currentUser) return;
    this.seedDemoUserData(this.currentUser.id);
  }

  // --- SUPABASE CLOUD BACKEND INTEGRATION ---
  getSupabaseClient() {
    const settings = this.getSettings();
    const url = settings?.supabaseUrl || DEFAULT_SUPABASE_CONFIG.url;
    const key = settings?.supabaseAnonKey || DEFAULT_SUPABASE_CONFIG.anonKey;

    if (!url || !key) {
      return null;
    }
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      try {
        return window.supabase.createClient(url, key);
      } catch (e) {
        console.error('Supabase initialization failed:', e);
        return null;
      }
    }
    return null;
  }

  async syncToSupabaseCloud() {
    const client = this.getSupabaseClient();
    if (!client || !this.currentUser) {
      throw new Error('Supabase URL and Anon Key must be configured in Settings.');
    }

    const userData = this.getUserData();
    const userEmail = (this.currentUser.email || '').toLowerCase().trim();
    const users = this.getUsers();
    const account = users.find(u => u.id === this.currentUser.id) || {};

    const payload = {
      user_id: this.currentUser.id,
      user_email: userEmail,
      user_name: this.currentUser.name,
      username: (account.username || this.currentUser.username || '').toLowerCase().trim(),
      password: account.password || '',
      user_data: userData,
      updated_at: new Date().toISOString()
    };

    // Upsert into omniattend_user_sync
    const { data, error } = await client
      .from('omniattend_user_sync')
      .upsert([payload], { onConflict: 'user_email' });

    if (error) {
      // Fallback without onConflict constraint if table was created with user_id PK
      const retryRes = await client
        .from('omniattend_user_sync')
        .upsert([payload], { onConflict: 'user_id' });
      if (retryRes.error) {
        throw new Error('Cloud sync failed: ' + retryRes.error.message);
      }
    }
    return true;
  }

  async syncFromSupabaseCloud() {
    const client = this.getSupabaseClient();
    if (!client || !this.currentUser) {
      throw new Error('Supabase URL and Anon Key must be configured in Settings.');
    }

    const userEmail = (this.currentUser.email || '').toLowerCase().trim();
    
    // 1. Try pulling by user_email first (cross-device universal match)
    let { data, error } = await client
      .from('omniattend_user_sync')
      .select('*')
      .eq('user_email', userEmail)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Fallback to user_id match
    if (!data) {
      const idRes = await client
        .from('omniattend_user_sync')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .maybeSingle();
      data = idRes.data;
    }

    if (!data || !data.user_data) {
      throw new Error('No cloud backup found for this account. Make sure you clicked "Push to Cloud" on your first device.');
    }

    this.saveUserData(data.user_data);
    return data.user_data;
  }
}

// Global singleton instance
window.storage = new StorageService();
