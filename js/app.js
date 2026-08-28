/**
 * Main Application Controller
 * Handles UI interactions, reactive views, auth states, timetable, attendance logs, and analytics.
 */

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AttendanceApp();
});

class AttendanceApp {
  constructor() {
    this.storage = window.storage;
    this.ingestionService = new window.RoutineIngestionService();
    this.currentTab = 'dashboard';
    this.attendanceChart = null;
    this.distributionChart = null;
    this.extractedRoutineCache = [];

    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuthState();
  }

  checkAuthState() {
    const user = this.storage.getCurrentUser();
    const authOverlay = document.getElementById('auth-landing');
    const mainApp = document.getElementById('main-app-container');

    if (!user) {
      authOverlay.classList.remove('hidden');
      mainApp.classList.add('hidden');
      const loginId = document.getElementById('login-identifier');
      const loginPass = document.getElementById('login-password');
      if (loginId) loginId.value = '';
      if (loginPass) loginPass.value = '';
    } else {
      authOverlay.classList.add('hidden');
      mainApp.classList.remove('hidden');
      this.renderUserProfile();
      this.syncControlsWithSettings();
      this.renderAllViews();
    }
  }

  syncControlsWithSettings() {
    const settings = this.storage.getSettings();

    // Mode buttons
    const mode = settings.trackingMode || 'hour';
    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('active', 'bg-indigo-600', 'text-white');
        btn.classList.remove('text-gray-400');
      } else {
        btn.classList.remove('active', 'bg-indigo-600', 'text-white');
        btn.classList.add('text-gray-400');
      }
    });

    // Slider
    const slider = document.getElementById('target-attendance-slider');
    const sliderVal = document.getElementById('target-slider-display');
    const target = settings.minAttendanceTarget ?? 75;
    if (slider) slider.value = target;
    if (sliderVal) sliderVal.textContent = `${target}%`;

    // API Key in settings modal
    const apiKeyInput = document.getElementById('setting-gemini-api-key');
    if (apiKeyInput) apiKeyInput.value = settings.geminiApiKey || '';

    // Supabase inputs in settings modal
    const supaUrlInput = document.getElementById('setting-supabase-url');
    if (supaUrlInput) supaUrlInput.value = settings.supabaseUrl || '';
    const supaKeyInput = document.getElementById('setting-supabase-key');
    if (supaKeyInput) supaKeyInput.value = settings.supabaseAnonKey || '';
  }

  renderUserProfile() {
    const user = this.storage.getCurrentUser();
    if (!user) return;

    const nameEl = document.getElementById('user-display-name');
    const roleEl = document.getElementById('user-display-role');
    const avatarEl = document.getElementById('user-avatar-img');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role || 'Student';
    if (avatarEl) avatarEl.src = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`;
  }

  showLogin() {
    document.getElementById('auth-signup-box')?.classList.add('hidden');
    document.getElementById('auth-forgot-box')?.classList.add('hidden');
    document.getElementById('auth-login-box')?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  showSignUp() {
    document.getElementById('auth-login-box')?.classList.add('hidden');
    document.getElementById('auth-forgot-box')?.classList.add('hidden');
    document.getElementById('auth-signup-box')?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  showForgotPassword() {
    document.getElementById('auth-login-box')?.classList.add('hidden');
    document.getElementById('auth-signup-box')?.classList.add('hidden');
    document.getElementById('auth-forgot-box')?.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  renderAllViews() {
    this.renderDashboard();
    this.renderTodaySchedule();
    this.renderWeeklyTimetable();
    this.renderHistoryLog();
    this.renderAnalytics();
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- TAB NAVIGATION ---
  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      if (panel.id === `tab-panel-${tabId}`) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });

    if (tabId === 'analytics') {
      setTimeout(() => this.renderAnalytics(), 50);
    } else if (tabId === 'timetable') {
      this.renderWeeklyTimetable();
    }
  }

  // --- DASHBOARD RENDERING ---
  renderDashboard() {
    const userData = this.storage.getUserData();
    if (!userData) return;

    const metrics = window.MetricsEngine.computeAllMetrics(userData);
    const overall = metrics.overall;
    const advice = window.MetricsEngine.getAdvice({ ...overall, targetPercent: metrics.targetPercent });

    // Update Overall Percentage & Stats Banner
    const overallPctEl = document.getElementById('metric-overall-percentage');
    const overallTargetEl = document.getElementById('metric-target-reference');
    const overallProgressCircle = document.getElementById('overall-progress-circle');
    const overallStatusBadge = document.getElementById('metric-status-badge');
    const overallAdviceText = document.getElementById('metric-advice-description');

    if (overallPctEl) overallPctEl.textContent = `${overall.percentage}%`;
    if (overallTargetEl) overallTargetEl.textContent = `Target: ${metrics.targetPercent}%`;

    // Circular progress stroke
    if (overallProgressCircle) {
      const radius = 64;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (overall.percentage / 100) * circumference;
      overallProgressCircle.style.strokeDashoffset = Math.max(0, offset);

      if (overall.percentage >= metrics.targetPercent) {
        overallProgressCircle.style.stroke = '#10b981'; // Emerald
      } else if (overall.percentage >= metrics.targetPercent - 5) {
        overallProgressCircle.style.stroke = '#f59e0b'; // Amber
      } else {
        overallProgressCircle.style.stroke = '#f43f5e'; // Rose
      }
    }

    if (overallStatusBadge) {
      overallStatusBadge.textContent = advice.badge;
      overallStatusBadge.className = `px-3 py-1 text-xs font-semibold rounded-full border ${advice.bg} ${advice.color} ${advice.border}`;
    }

    if (overallAdviceText) {
      overallAdviceText.textContent = advice.message;
    }

    // Quick Stats Summary
    const totalAttendedEl = document.getElementById('metric-total-attended');
    const totalConductedEl = document.getElementById('metric-total-conducted');
    const totalCancelledEl = document.getElementById('metric-total-cancelled');
    const unitLabelEls = document.querySelectorAll('.metric-unit-label');

    if (totalAttendedEl) totalAttendedEl.textContent = overall.attendedUnits;
    if (totalConductedEl) totalConductedEl.textContent = overall.conductedUnits;
    if (totalCancelledEl) totalCancelledEl.textContent = overall.cancelledUnits;
    unitLabelEls.forEach(el => el.textContent = overall.unitLabel.toLowerCase());

    // Render Subject Cards Grid
    this.renderSubjectCards(metrics);
  }

  renderSubjectCards(metrics) {
    const container = document.getElementById('subject-cards-container');
    if (!container) return;

    if (!metrics.subjects || metrics.subjects.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 glass-panel border border-dashed border-gray-700 p-8 rounded-2xl">
          <i data-lucide="book-open" class="w-12 h-12 text-gray-500 mx-auto mb-3"></i>
          <h3 class="text-lg font-semibold text-gray-200">No subjects added yet</h3>
          <p class="text-sm text-gray-400 mt-1 max-w-md mx-auto">Upload your routine with AI or manually add your semester subjects to start tracking.</p>
          <div class="mt-4 flex justify-center gap-3">
            <button onclick="app.openRoutineModal()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-500/20 flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4"></i> Ingest Routine with AI
            </button>
            <button onclick="app.openAddSubjectModal()" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-sm font-medium transition border border-gray-700">
              + Add Subject Manually
            </button>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = metrics.subjects.map(sub => {
      const advice = window.MetricsEngine.getAdvice(sub);
      const isHour = metrics.mode === 'hour';

      return `
        <div class="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 transition">
          <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${sub.color || '#6366f1'}"></div>
          
          <div>
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">${sub.code || 'COURSE'}</span>
                <h4 class="text-base font-semibold text-white mt-1 leading-snug group-hover:text-indigo-300 transition">${sub.name}</h4>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold ${sub.percentage >= sub.targetPercent ? 'text-emerald-400' : 'text-rose-400'}">
                  ${sub.percentage}%
                </div>
                <div class="text-[11px] text-gray-400">Target: ${sub.targetPercent}%</div>
              </div>
            </div>

            <!-- Subject Progress Bar -->
            <div class="w-full bg-gray-800/80 rounded-full h-2 mt-3 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500 ${sub.percentage >= sub.targetPercent ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'}" 
                   style="width: ${Math.min(100, sub.percentage)}%"></div>
            </div>

            <!-- Subject Stats Summary -->
            <div class="grid grid-cols-3 gap-2 mt-3 py-2 px-3 bg-gray-900/60 rounded-xl text-center border border-gray-800/60">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-gray-400 block">Attended</span>
                <span class="text-sm font-semibold text-emerald-400">${sub.attendedUnits} ${isHour ? 'h' : ''}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase tracking-wider text-gray-400 block">Conducted</span>
                <span class="text-sm font-semibold text-gray-200">${sub.conductedUnits} ${isHour ? 'h' : ''}</span>
              </div>
              <div>
                <span class="text-[10px] uppercase tracking-wider text-gray-400 block">Absent</span>
                <span class="text-sm font-semibold text-rose-400">${isHour ? sub.absentHours : sub.absentCount} ${isHour ? 'h' : ''}</span>
              </div>
            </div>

            <!-- Dynamic Adaptive Status Badge -->
            <div class="mt-3">
              <div class="p-2.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${advice.bg} ${advice.color} ${advice.border}">
                <i data-lucide="${sub.percentage >= sub.targetPercent ? 'check-circle' : 'alert-triangle'}" class="w-4 h-4 shrink-0 mt-0.5"></i>
                <div>
                  <span class="font-semibold block">${advice.badge}</span>
                  <span class="text-[11px] opacity-90 block mt-0.5">${advice.message}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick 1-Click Action Buttons -->
          <div class="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between gap-2">
            <span class="text-xs text-gray-400">Quick Log:</span>
            <div class="flex items-center gap-1.5">
              <button onclick="app.quickMark('${sub.id}', 'present', ${isHour ? 1.5 : 1})" 
                      title="Mark Present (+${isHour ? '1.5h' : '1 class'})"
                      class="btn-interactive px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1">
                <i data-lucide="check" class="w-3.5 h-3.5"></i> Present
              </button>
              <button onclick="app.quickMark('${sub.id}', 'absent', ${isHour ? 1.5 : 1})" 
                      title="Mark Absent (-${isHour ? '1.5h' : '1 class'})"
                      class="btn-interactive px-2.5 py-1 bg-rose-950/60 hover:bg-rose-800 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1">
                <i data-lucide="x" class="w-3.5 h-3.5"></i> Absent
              </button>
              <button onclick="app.quickMark('${sub.id}', 'cancelled', ${isHour ? 1.5 : 1})" 
                      title="Mark Class Cancelled / Holiday"
                      class="btn-interactive px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 rounded-lg text-xs font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- TODAY'S SCHEDULE & QUICK CHECK-IN ---
  renderTodaySchedule() {
    const container = document.getElementById('today-classes-list');
    if (!container) return;

    const userData = this.storage.getUserData();
    if (!userData) return;

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];
    const todayDateStr = new Date().toISOString().split('T')[0];

    const timetable = userData.timetable || [];
    const todaySlots = timetable.filter(t => t.day.toLowerCase() === todayName.toLowerCase());

    const recordsToday = (userData.attendanceRecords || []).filter(r => r.date === todayDateStr);

    document.getElementById('today-day-name').textContent = `${todayName}, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    if (todaySlots.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400 bg-gray-900/40 rounded-xl border border-gray-800 p-6">
          <i data-lucide="sun" class="w-8 h-8 mx-auto text-amber-400 mb-2"></i>
          <p class="font-medium text-gray-300">No scheduled classes for ${todayName}!</p>
          <p class="text-xs text-gray-500 mt-1">Enjoy your free time or review past lectures.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = todaySlots.map(slot => {
      const subject = (userData.subjects || []).find(s => s.id === slot.subjectId) || { name: 'Class Slot', code: 'COURSE', color: '#6366f1' };
      const record = recordsToday.find(r => r.subjectId === slot.subjectId);

      let statusBadge = `<span class="px-2.5 py-1 text-[11px] font-medium bg-gray-800 text-gray-400 rounded-lg border border-gray-700">Pending Check-in</span>`;
      if (record) {
        if (record.status === 'present') {
          statusBadge = `<span class="px-2.5 py-1 text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 rounded-lg border border-emerald-500/40 flex items-center gap-1"><i data-lucide="check" class="w-3 h-3"></i> Marked Present</span>`;
        } else if (record.status === 'absent') {
          statusBadge = `<span class="px-2.5 py-1 text-[11px] font-semibold bg-rose-950/80 text-rose-400 rounded-lg border border-rose-500/40 flex items-center gap-1"><i data-lucide="x" class="w-3 h-3"></i> Marked Absent</span>`;
        } else if (record.status === 'cancelled') {
          statusBadge = `<span class="px-2.5 py-1 text-[11px] font-medium bg-gray-800 text-gray-300 rounded-lg border border-gray-600">Class Cancelled</span>`;
        }
      }

      return `
        <div class="p-4 rounded-xl glass-panel border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-2.5 self-stretch rounded-full" style="background-color: ${subject.color || '#6366f1'}"></div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono text-gray-400">${slot.startTime} - ${slot.endTime} (${slot.durationHours} hrs)</span>
                <span class="text-xs text-gray-500">•</span>
                <span class="text-xs text-indigo-400 font-medium">${slot.room || 'Room 101'}</span>
              </div>
              h5 class="text-base font-semibold text-white mt-0.5">${subject.name}</h5>
              <div class="text-xs text-gray-400 mt-0.5">Instructor: ${slot.instructor || 'Faculty'}</div>
            </div>
          </div>

          <div class="flex items-center gap-3 justify-between md:justify-end">
            ${statusBadge}
            <div class="flex items-center gap-1">
              <button onclick="app.quickMark('${slot.subjectId}', 'present', ${slot.durationHours}, '${todayDateStr}')" 
                      title="Present"
                      class="btn-interactive p-2 bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/30 transition">
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
              <button onclick="app.quickMark('${slot.subjectId}', 'absent', ${slot.durationHours}, '${todayDateStr}')" 
                      title="Absent"
                      class="btn-interactive p-2 bg-rose-950/40 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/30 transition">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
              <button onclick="app.quickMark('${slot.subjectId}', 'cancelled', ${slot.durationHours}, '${todayDateStr}')" 
                      title="Cancel"
                      class="btn-interactive p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- WEEKLY TIMETABLE GRID ---
  renderWeeklyTimetable() {
    const container = document.getElementById('timetable-grid-container');
    if (!container) return;

    const userData = this.storage.getUserData();
    if (!userData) return;

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const timetable = userData.timetable || [];
    const subjects = userData.subjects || [];

    container.innerHTML = days.map(day => {
      const daySlots = timetable
        .filter(t => t.day.toLowerCase() === day.toLowerCase())
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return `
        <div class="glass-panel p-4 rounded-xl border border-gray-800">
          <div class="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
            <h4 class="font-semibold text-white text-sm flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-indigo-500"></span> ${day}
            </h4>
            <button onclick="app.openAddSlotModal('${day}')" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Add Slot
            </button>
          </div>

          <div class="space-y-2.5">
            ${daySlots.length === 0 ? `
              <div class="py-6 text-center text-xs text-gray-500 italic">No classes scheduled</div>
            ` : daySlots.map(slot => {
        const sub = subjects.find(s => s.id === slot.subjectId) || { name: 'Subject', color: '#6366f1' };
        return `
                <div class="timetable-cell p-3 rounded-lg bg-gray-900/70 border border-gray-800/80 hover:border-indigo-500/40 relative group">
                  <div class="flex items-start justify-between">
                    <div>
                      <span class="text-[11px] font-mono text-indigo-400 font-medium">${slot.startTime} - ${slot.endTime} (${slot.durationHours}h)</span>
                      <h5 class="text-sm font-semibold text-gray-200 leading-tight mt-0.5">${sub.name}</h5>
                    </div>
                    <button onclick="app.deleteSlot('${slot.id}')" title="Delete slot" class="text-gray-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition p-1">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-gray-400 mt-2">
                    <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${slot.room || 'Hall'}</span>
                    <span class="truncate max-w-[110px]">${slot.instructor || 'Faculty'}</span>
                  </div>
                </div>
              `;
      }).join('')}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- ATTENDANCE HISTORY LOG ---
  renderHistoryLog() {
    const container = document.getElementById('history-log-table-body');
    if (!container) return;

    const userData = this.storage.getUserData();
    if (!userData) return;

    const records = userData.attendanceRecords || [];
    const subjects = userData.subjects || [];

    // Filter controls
    const subjectFilter = document.getElementById('history-filter-subject')?.value || 'all';
    const statusFilter = document.getElementById('history-filter-status')?.value || 'all';

    // Populate subject filter dropdown if needed
    const subSelect = document.getElementById('history-filter-subject');
    if (subSelect && subSelect.options.length <= 1) {
      subjects.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        subSelect.appendChild(opt);
      });
    }

    const filtered = records.filter(r => {
      if (subjectFilter !== 'all' && r.subjectId !== subjectFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-10 text-gray-500 text-sm">
            No attendance logs found matching the filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = filtered.map(rec => {
      const sub = subjects.find(s => s.id === rec.subjectId) || { name: rec.subjectName, color: '#6366f1' };

      let badge = '';
      if (rec.status === 'present') {
        badge = `<span class="px-2.5 py-0.5 text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded-full">Present</span>`;
      } else if (rec.status === 'absent') {
        badge = `<span class="px-2.5 py-0.5 text-xs font-semibold bg-rose-950 text-rose-400 border border-rose-500/30 rounded-full">Absent</span>`;
      } else {
        badge = `<span class="px-2.5 py-0.5 text-xs font-medium bg-gray-800 text-gray-300 border border-gray-600 rounded-full">Cancelled</span>`;
      }

      return `
        <tr class="border-b border-gray-800/60 hover:bg-gray-800/30 transition text-sm">
          <td class="py-3 px-4 text-gray-300 font-mono text-xs">${rec.date}</td>
          <td class="py-3 px-4 font-medium text-white flex items-center gap-2">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: ${sub.color || '#6366f1'}"></span>
            ${sub.name}
          </td>
          <td class="py-3 px-4 text-gray-400">${rec.durationHours} hrs</td>
          <td class="py-3 px-4">${badge}</td>
          <td class="py-3 px-4 text-gray-400 text-xs truncate max-w-xs">${rec.note || '-'}</td>
          <td class="py-3 px-4 text-right">
            <button onclick="app.deleteAttendanceRecord('${rec.id}')" title="Delete record" class="text-gray-500 hover:text-rose-400 p-1 transition">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- ANALYTICS & CHARTS ---
  renderAnalytics() {
    const userData = this.storage.getUserData();
    if (!userData) return;

    const metrics = window.MetricsEngine.computeAllMetrics(userData);
    const canvasTrend = document.getElementById('chart-attendance-trend');
    const canvasDist = document.getElementById('chart-subject-distribution');

    if (!canvasTrend || !canvasDist || typeof Chart === 'undefined') return;

    if (this.attendanceChart) this.attendanceChart.destroy();
    if (this.distributionChart) this.distributionChart.destroy();

    const labels = metrics.subjects.map(s => s.name.length > 18 ? s.name.substring(0, 18) + '...' : s.name);
    const percentages = metrics.subjects.map(s => s.percentage);
    const bgColors = metrics.subjects.map(s => s.percentage >= metrics.targetPercent ? 'rgba(16, 185, 129, 0.7)' : 'rgba(244, 63, 94, 0.7)');

    this.attendanceChart = new Chart(canvasTrend, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Current Attendance %',
          data: percentages,
          backgroundColor: bgColors,
          borderColor: bgColors.map(c => c.replace('0.7', '1')),
          borderWidth: 1.5,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` Attendance: ${context.raw}% (Target: ${metrics.targetPercent}%)`
            }
          }
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#9ca3af', callback: v => `${v}%` },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            ticks: { color: '#9ca3af' },
            grid: { display: false }
          }
        }
      }
    });

    const overall = metrics.overall;
    this.distributionChart = new Chart(canvasDist, {
      type: 'doughnut',
      data: {
        labels: ['Attended Units', 'Absent Units', 'Cancelled Units'],
        datasets: [{
          data: [overall.attendedUnits, (metrics.mode === 'hour' ? overall.absentHours : overall.absentCount), overall.cancelledUnits],
          backgroundColor: ['#10b981', '#f43f5e', '#6b7280'],
          borderColor: '#111827',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e5e7eb', padding: 15, font: { size: 12 } }
          }
        },
        cutout: '70%'
      }
    });
  }

  // --- ACTIONS & MUTATIONS ---
  quickMark(subjectId, status, durationHours = 1.0, dateStr = null) {
    this.storage.markAttendance(subjectId, status, durationHours, dateStr);

    const metrics = window.MetricsEngine.computeAllMetrics(this.storage.getUserData());
    if (metrics.overall.percentage >= metrics.targetPercent && status === 'present') {
      if (typeof confetti === 'function') {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      }
    }

    this.showToast(`Logged ${status.toUpperCase()} (${durationHours} hrs)`, 'success');
    this.renderAllViews();
  }

  deleteAttendanceRecord(recordId) {
    if (confirm('Are you sure you want to remove this attendance entry?')) {
      this.storage.deleteAttendanceRecord(recordId);
      this.showToast('Attendance entry deleted', 'info');
      this.renderAllViews();
    }
  }

  deleteSlot(slotId) {
    if (confirm('Remove this class slot from your timetable?')) {
      this.storage.deleteTimetableSlot(slotId);
      this.showToast('Timetable slot removed', 'info');
      this.renderAllViews();
    }
  }

  setTrackingMode(mode) {
    this.storage.updateSettings({ trackingMode: mode });
    this.syncControlsWithSettings();
    this.showToast(`Tracking Mode switched to ${mode === 'hour' ? 'Hour-Wise' : 'Day-Wise'}`, 'info');
    this.renderAllViews();
  }

  setTargetAttendance(target) {
    const num = parseInt(target, 10);
    this.storage.updateSettings({ minAttendanceTarget: num });
    document.getElementById('target-slider-display').textContent = `${num}%`;
    this.renderDashboard();
    this.renderAnalytics();
  }

  // --- MODALS & ROUTINE INGESTION ENGINE ---
  openRoutineModal() {
    document.getElementById('routine-modal').classList.remove('hidden');
    this.extractedRoutineCache = [];
    document.getElementById('routine-preview-container').classList.add('hidden');
    document.getElementById('routine-upload-zone').classList.remove('hidden');
    document.getElementById('routine-file-input').value = '';
    document.getElementById('btn-apply-routine').classList.add('hidden');
  }

  closeRoutineModal() {
    document.getElementById('routine-modal').classList.add('hidden');
  }

  async loadProvidedTimetable(e) {
    if (e) e.stopPropagation();
    try {
      this.showToast('Loading timetable (IMG-20260827-WA0001.jpg)...', 'info');
      const response = await fetch('./IMG-20260827-WA0001.jpg');
      if (!response.ok) throw new Error('Could not load IMG-20260827-WA0001.jpg');
      const blob = await response.blob();
      const file = new File([blob], 'IMG-20260827-WA0001.jpg', { type: 'image/jpeg' });
      await this.handleRoutineFileUpload([file]);
    } catch (err) {
      console.error(err);
      this.showToast('Error loading timetable file: ' + err.message, 'error');
    }
  }

  async handleRoutineFileUpload(files) {
    if (!files || files.length === 0) return;
    const file = files[0];

    const loader = document.getElementById('routine-parsing-loader');
    const uploadZone = document.getElementById('routine-upload-zone');
    const settings = this.storage.getSettings();

    if (loader) loader.classList.remove('hidden');
    if (uploadZone) uploadZone.classList.add('opacity-50', 'pointer-events-none');

    try {
      const result = await this.ingestionService.processRoutineFile(
        file,
        settings.geminiApiKey || '',
        settings.trackingMode || 'hour'
      );

      this.extractedRoutineCache = result.routine;
      this.renderExtractedRoutinePreview(result);
      this.showToast(`Routine successfully ingested via ${result.source || 'Schedule Engine'}!`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast(`Parsing error: ${err.message}`, 'error');
    } finally {
      if (loader) loader.classList.add('hidden');
      if (uploadZone) uploadZone.classList.remove('opacity-50', 'pointer-events-none');
    }
  }

  renderExtractedRoutinePreview(result) {
    const previewContainer = document.getElementById('routine-preview-container');
    const tableBody = document.getElementById('routine-preview-table-body');
    const sourceBadge = document.getElementById('routine-parsed-source-badge');
    const applyBtn = document.getElementById('btn-apply-routine');

    sourceBadge.textContent = `Extracted via: ${result.source}`;
    previewContainer.classList.remove('hidden');
    applyBtn.classList.remove('hidden');

    if (result.notice) {
      document.getElementById('routine-preview-notice').textContent = result.notice;
      document.getElementById('routine-preview-notice').classList.remove('hidden');
    } else {
      document.getElementById('routine-preview-notice').classList.add('hidden');
    }

    tableBody.innerHTML = result.routine.map((slot, index) => `
      <tr class="border-b border-gray-800 text-xs">
        <td class="py-2.5 px-3 font-medium text-white">${slot.day}</td>
        <td class="py-2.5 px-3 font-semibold text-indigo-300">${slot.subjectName}</td>
        <td class="py-2.5 px-3 text-gray-400">${slot.startTime} - ${slot.endTime}</td>
        <td class="py-2.5 px-3 font-mono text-emerald-400 font-semibold">${slot.durationHours} hrs</td>
        <td class="py-2.5 px-3 text-gray-400">${slot.room || 'N/A'}</td>
        <td class="py-2.5 px-3 text-right">
          <button onclick="app.removeExtractedSlot(${index})" class="text-rose-400 hover:text-rose-300">
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  removeExtractedSlot(index) {
    this.extractedRoutineCache.splice(index, 1);
    this.renderExtractedRoutinePreview({
      source: 'Modified Preview',
      routine: this.extractedRoutineCache
    });
  }

  applyExtractedRoutine() {
    if (!this.extractedRoutineCache || this.extractedRoutineCache.length === 0) {
      this.showToast('No routine slots to apply', 'error');
      return;
    }

    const userData = this.storage.getUserData();
    const existingSubjects = userData.subjects || [];
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

    const newTimetable = [];
    this.extractedRoutineCache.forEach(slot => {
      let sub = existingSubjects.find(s => s.name.toLowerCase() === slot.subjectName.toLowerCase());
      if (!sub) {
        sub = {
          id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: slot.subjectName,
          code: slot.subjectCode || 'COURSE',
          color: colors[existingSubjects.length % colors.length],
          icon: 'book'
        };
        existingSubjects.push(sub);
      }

      newTimetable.push({
        id: `tt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        subjectId: sub.id,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationHours: slot.durationHours,
        room: slot.room || 'Room 101',
        instructor: slot.instructor || 'Faculty'
      });
    });

    userData.subjects = existingSubjects;
    userData.timetable = newTimetable;
    this.storage.saveUserData(userData);

    this.closeRoutineModal();
    this.showToast(`Imported ${newTimetable.length} class slots successfully!`, 'success');
    this.renderAllViews();
  }

  // --- MANUAL SLOT MODAL ---
  openAddSlotModal(prefilledDay = 'Monday') {
    const modal = document.getElementById('add-slot-modal');
    modal.classList.remove('hidden');

    const daySelect = document.getElementById('slot-input-day');
    if (daySelect) daySelect.value = prefilledDay;

    const subSelect = document.getElementById('slot-input-subject');
    const subjects = this.storage.getSubjects();
    subSelect.innerHTML = subjects.map(s => `<option value="${s.id}">${s.name} (${s.code || ''})</option>`).join('');
  }

  closeAddSlotModal() {
    document.getElementById('add-slot-modal').classList.add('hidden');
  }

  saveManualSlot() {
    const subjectId = document.getElementById('slot-input-subject').value;
    const day = document.getElementById('slot-input-day').value;
    const startTime = document.getElementById('slot-input-start').value;
    const endTime = document.getElementById('slot-input-end').value;
    const room = document.getElementById('slot-input-room').value;
    const instructor = document.getElementById('slot-input-instructor').value;

    if (!subjectId || !startTime || !endTime) {
      this.showToast('Please fill out all required time fields', 'error');
      return;
    }

    const duration = this.ingestionService.calculateHoursDiff(startTime, endTime);

    this.storage.addTimetableSlot({
      subjectId,
      day,
      startTime,
      endTime,
      durationHours: duration,
      room: room || 'Room 101',
      instructor: instructor || 'Faculty'
    });

    this.closeAddSlotModal();
    this.showToast('Timetable slot added!', 'success');
    this.renderAllViews();
  }

  // --- ADD SUBJECT MODAL ---
  openAddSubjectModal() {
    document.getElementById('add-subject-modal').classList.remove('hidden');
  }

  closeAddSubjectModal() {
    document.getElementById('add-subject-modal').classList.add('hidden');
  }

  saveManualSubject() {
    const name = document.getElementById('subject-input-name').value;
    const code = document.getElementById('subject-input-code').value;
    const color = document.getElementById('subject-input-color').value || '#6366f1';

    if (!name.trim()) {
      this.showToast('Please enter subject title', 'error');
      return;
    }

    this.storage.addSubject(name, code, color);
    this.closeAddSubjectModal();
    this.showToast(`Subject "${name}" created!`, 'success');
    document.getElementById('subject-input-name').value = '';
    document.getElementById('subject-input-code').value = '';
    this.renderAllViews();
  }

  // --- SETTINGS MODAL ---
  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.remove('hidden');
    this.syncControlsWithSettings();
    this.renderSettingsSubjectsList();
  }

  closeSettingsModal() {
    document.getElementById('settings-modal').classList.add('hidden');
  }

  // =========================================================================
  // INTEGRATIONS GATEWAY FUNCTIONS (GEMINI OCR & SUPABASE SYNC)
  // =========================================================================

  saveSettingsForm() {
    const apiKey = document.getElementById('setting-gemini-api-key').value.trim();
    const supaUrl = document.getElementById('setting-supabase-url').value.trim();
    const supaKey = document.getElementById('setting-supabase-key').value.trim();

    this.storage.updateSettings({
      geminiApiKey: apiKey,
      supabaseUrl: supaUrl,
      supabaseAnonKey: supaKey
    });

    this.closeSettingsModal();
    this.showToast('Settings & Cloud config saved!', 'success');
  }

     // =========================================================================
  // INTEGRATIONS GATEWAY FUNCTIONS (GEMINI DIRECT FETCH OCR ENGINE)
  // =========================================================================

    // =========================================================================
  // REDESIGNED INTEGRATIONS GATEWAY (CORS-BYPASS REST PROXY ENGINE)
  // =========================================================================

  async testGeminiKey() {
    const apiKey = document.getElementById('setting-gemini-api-key').value.trim();
    const statusBox = document.getElementById('gemini-test-status');

    if (!apiKey || apiKey.length < 10) {
      if (statusBox) {
        statusBox.className = 'mt-2 text-xs p-2.5 rounded-xl border bg-rose-950/60 text-rose-300 border-rose-500/40 block';
        statusBox.innerHTML = '<span class="font-semibold">⚠️ Please enter an API key first</span>';
      }
      this.showToast('Please enter an API key to test.', 'error');
      return;
    }

    if (statusBox) {
      statusBox.className = 'mt-2 text-xs p-2.5 rounded-xl border bg-indigo-950/60 text-indigo-300 border-indigo-500/40 block';
      statusBox.innerHTML = '<span class="inline-block animate-spin mr-1.5">⏳</span> Testing connection to Google Gemini API...';
    }
    this.showToast('Testing API key with Google Gemini...', 'info');

    try {
      const result = await this.ingestionService.testApiKey(apiKey);

      if (statusBox) {
        statusBox.className = 'mt-2 text-xs p-2.5 rounded-xl border bg-emerald-950/60 text-emerald-300 border-emerald-500/40 block';
        statusBox.innerHTML = `✅ <b>Connected successfully!</b> Active Model: <span class="font-mono text-white">${result.model}</span> (${result.version}). Ready for routine parsing!`;
      }
      this.showToast('Gemini API key is valid & working perfectly!', 'success');
      
      // Auto-save setting if valid
      this.storage.updateSettings({ geminiApiKey: apiKey });
    } catch (err) {
      console.error("Gemini Connection Error:", err);
      if (statusBox) {
        statusBox.className = 'mt-2 text-xs p-2.5 rounded-xl border bg-rose-950/60 text-rose-300 border-rose-500/40 block';
        statusBox.innerHTML = `❌ <b>Connection Failed:</b> ${err.message}`;
      }
      this.showToast('API Key Error: ' + err.message, 'error');
    }
  }


  async pushToCloud() {
    try {
      const supaUrl = document.getElementById('setting-supabase-url').value.trim();
      const supaKey = document.getElementById('setting-supabase-key').value.trim();
      if (supaUrl || supaKey) {
        this.storage.updateSettings({ supabaseUrl: supaUrl, supabaseAnonKey: supaKey });
      }

      this.showToast('Syncing data to Supabase cloud...', 'info');
      await this.storage.syncToSupabaseCloud();
      this.showToast('Data successfully synced to Cloud!', 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Cloud Push: ' + err.message, 'error');
    }
  }

  async pullFromCloud() {
    try {
      const supaUrl = document.getElementById('setting-supabase-url').value.trim();
      const supaKey = document.getElementById('setting-supabase-key').value.trim();
      if (supaUrl || supaKey) {
        this.storage.updateSettings({ supabaseUrl: supaUrl, supabaseAnonKey: supaKey });
      }

      this.showToast('Pulling data from Supabase cloud...', 'info');
      const data = await this.storage.syncFromSupabaseCloud();
      if (data) {
        this.showToast('Cloud data loaded successfully!', 'success');
        this.renderAllViews();
      } else {
        this.showToast('No cloud records found for this user.', 'info');
      }
    } catch (err) {
      console.error(err);
      this.showToast('Cloud Pull: ' + err.message, 'error');
    }
  }

  renderSettingsSubjectsList() {
    const container = document.getElementById('settings-subjects-list');
    if (!container) return;
    const subjects = this.storage.getSubjects();

    container.innerHTML = subjects.map(s => `
      <div class="flex items-center justify-between p-2.5 bg-gray-900/60 rounded-xl border border-gray-800 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full" style="background-color: ${s.color}"></span>
          <span class="font-semibold text-gray-200">${s.name}</span>
          <span class="text-gray-500 font-mono">(${s.code})</span>
        </div>
        <button onclick="app.deleteSubject('${s.id}')" class="text-rose-400 hover:text-rose-300 p-1">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  deleteSubject(subjectId) {
    if (confirm('Delete this subject and all associated logs?')) {
      this.storage.deleteSubject(subjectId);
      this.renderSettingsSubjectsList();
      this.renderAllViews();
      this.showToast('Subject deleted', 'info');
    }
  }

  // --- AUTH METHODS ---
  handleLogin(e) {
    e.preventDefault();
    const id = document.getElementById('login-identifier').value;
    const pass = document.getElementById('login-password').value;

    try {
      this.storage.login(id, pass);
      this.showToast('Welcome back!', 'success');
      this.checkAuthState();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;

    try {
      this.storage.register(name, email, username, password, role);
      this.showToast('Account created successfully!', 'success');
      this.checkAuthState();
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  handleForgotPassword(e) {
    e.preventDefault();
    const identifier = document.getElementById('forgot-identifier').value;
    const newPass = document.getElementById('forgot-new-password').value;
    const confirmPass = document.getElementById('forgot-confirm-password').value;

    if (newPass !== confirmPass) {
      this.showToast('Passwords do not match.', 'error');
      return;
    }

    if (newPass.length < 4) {
      this.showToast('Password must be at least 4 characters long.', 'error');
      return;
    }

    try {
      this.storage.resetPassword(identifier, newPass);
      this.showToast('Password updated successfully! Please sign in.', 'success');

      document.getElementById('auth-forgot-box').classList.add('hidden');
      document.getElementById('auth-login-box').classList.remove('hidden');

      const loginId = document.getElementById('login-identifier');
      if (loginId) loginId.value = identifier;
    } catch (err) {
      this.showToast(err.message, 'error');
    }
  }

  loginDemoUser(userId = 'usr_demo_101') {
    const users = this.storage.getUsers();
    const user = users.find(u => u.id === userId) || users[0];
    if (user) {
      this.storage.setSession(user);
      this.showToast(`Logged in as demo user: ${user.name}`, 'success');
      this.checkAuthState();
    }
  }

  logout() {
    this.storage.logout();
    this.showToast('Logged out successfully', 'info');
    this.checkAuthState();
  }

  resetDemo() {
    if (confirm('Reset your profile and restore sample semester schedule?')) {
      this.storage.resetCurrentUserData();
      this.showToast('Profile reset to demo state', 'success');
      this.renderAllViews();
    }
  }

  // --- DATA BACKUP EXPORT / IMPORT ---
  exportBackup() {
    const json = this.storage.exportUserDataJSON();
    if (!json) return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Backup JSON exported!', 'success');
  }

  importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this.storage.importUserDataJSON(e.target.result);
        this.showToast('Data successfully imported!', 'success');
        this.renderAllViews();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  // --- TOAST ALERTS ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
      error: 'bg-rose-950/90 text-rose-300 border-rose-500/50',
      info: 'bg-indigo-950/90 text-indigo-300 border-indigo-500/50'
    };

    toast.className = `px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl text-xs font-medium flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info')}" class="w-4 h-4 shrink-0"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- EVENT BINDINGS ---
  bindEvents() {
    document.getElementById('form-login')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('form-register')?.addEventListener('submit', (e) => this.handleRegister(e));
    document.getElementById('form-forgot')?.addEventListener('submit', (e) => this.handleForgotPassword(e));

    document.getElementById('btn-show-signup')?.addEventListener('click', () => {
      document.getElementById('auth-login-box').classList.add('hidden');
      document.getElementById('auth-forgot-box').classList.add('hidden');
      document.getElementById('auth-signup-box').classList.remove('hidden');
    });
    document.getElementById('btn-show-login')?.addEventListener('click', () => {
      document.getElementById('auth-signup-box').classList.add('hidden');
      document.getElementById('auth-forgot-box').classList.add('hidden');
      document.getElementById('auth-login-box').classList.remove('hidden');
    });
    document.getElementById('btn-show-forgot')?.addEventListener('click', () => {
      document.getElementById('auth-login-box').classList.add('hidden');
      document.getElementById('auth-signup-box').classList.add('hidden');
      document.getElementById('auth-forgot-box').classList.remove('hidden');
    });
    document.getElementById('btn-forgot-back-login')?.addEventListener('click', () => {
      document.getElementById('auth-forgot-box').classList.add('hidden');
      document.getElementById('auth-signup-box').classList.add('hidden');
      document.getElementById('auth-login-box').classList.remove('hidden');
    });

    document.querySelectorAll('.mode-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setTrackingMode(btn.dataset.mode));
    });

    const slider = document.getElementById('target-attendance-slider');
    slider?.addEventListener('input', (e) => this.setTargetAttendance(e.target.value));

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    const dropzone = document.getElementById('routine-upload-zone');
    const fileInput = document.getElementById('routine-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) this.handleRoutineFileUpload(files);
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) this.handleRoutineFileUpload(e.target.files);
      });
    }

    document.getElementById('history-filter-subject')?.addEventListener('change', () => this.renderHistoryLog());
    document.getElementById('history-filter-status')?.addEventListener('change', () => this.renderHistoryLog());
  }
}