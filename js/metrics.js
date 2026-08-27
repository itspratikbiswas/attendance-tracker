/**
 * Attendance Regulator & Adaptive Metrics Engine
 * Dynamically switches calculations based on Day-Wise vs. Hour-Wise modes.
 * Calculates dynamic 'Safe to skip' and 'Must attend' thresholds with mathematical precision.
 */

class MetricsEngine {
  /**
   * Calculate overall and subject-wise metrics based on user records and settings
   * @param {Object} userData - Complete isolated user dataset
   * @param {String} overrideMode - Optional override for tracking mode ('hour' | 'day')
   * @param {Number} overrideTarget - Optional override for target percent (e.g. 75)
   */
  static computeAllMetrics(userData, overrideMode = null, overrideTarget = null) {
    if (!userData) {
      return this.getEmptyMetrics();
    }

    const mode = overrideMode || userData.settings?.trackingMode || 'hour';
    const targetPercent = Number(overrideTarget ?? userData.settings?.minAttendanceTarget ?? 75);
    const targetRatio = targetPercent / 100;

    const subjects = userData.subjects || [];
    const records = userData.attendanceRecords || [];

    // Map subjects by ID for fast lookup
    const subjectMap = {};
    subjects.forEach(sub => {
      subjectMap[sub.id] = {
        ...sub,
        mode: mode,
        targetPercent: targetPercent,
        presentCount: 0,
        absentCount: 0,
        cancelledCount: 0,
        totalClasses: 0,
        presentHours: 0,
        absentHours: 0,
        cancelledHours: 0,
        totalHours: 0,
        // Computed metrics
        attendedUnits: 0,
        conductedUnits: 0,
        percentage: 0,
        status: 'neutral', // 'safe', 'warning', 'critical', 'neutral'
        safeToSkip: 0,
        mustAttend: 0,
        unitLabel: mode === 'hour' ? 'hrs' : 'classes'
      };
    });

    // Aggregate records
    records.forEach(rec => {
      let subMetric = subjectMap[rec.subjectId];
      if (!subMetric) {
        // Fallback for untracked subject
        subMetric = {
          id: rec.subjectId,
          name: rec.subjectName || 'Other',
          code: '',
          color: '#6b7280',
          mode: mode,
          targetPercent: targetPercent,
          presentCount: 0,
          absentCount: 0,
          cancelledCount: 0,
          totalClasses: 0,
          presentHours: 0,
          absentHours: 0,
          cancelledHours: 0,
          totalHours: 0,
          attendedUnits: 0,
          conductedUnits: 0,
          percentage: 0,
          status: 'neutral',
          safeToSkip: 0,
          mustAttend: 0,
          unitLabel: mode === 'hour' ? 'hrs' : 'classes'
        };
        subjectMap[rec.subjectId] = subMetric;
      }

      const hrs = Number(rec.durationHours) || 1.0;

      if (rec.status === 'present') {
        subMetric.presentCount += 1;
        subMetric.presentHours += hrs;
        subMetric.totalClasses += 1;
        subMetric.totalHours += hrs;
      } else if (rec.status === 'absent') {
        subMetric.absentCount += 1;
        subMetric.absentHours += hrs;
        subMetric.totalClasses += 1;
        subMetric.totalHours += hrs;
      } else if (rec.status === 'cancelled') {
        subMetric.cancelledCount += 1;
        subMetric.cancelledHours += hrs;
        // Note: Cancelled classes do not count toward total conducted (denominator)
      }
    });

    // Calculate individual subject metrics
    const subjectMetricsList = Object.values(subjectMap).map(sub => {
      return this.finalizeSubjectMetric(sub, mode, targetRatio, targetPercent);
    });

    // Global overall calculations
    let globalAttendedUnits = 0;
    let globalConductedUnits = 0;
    let globalCancelledUnits = 0;
    let globalPresentCount = 0;
    let globalAbsentCount = 0;
    let globalCancelledCount = 0;
    let globalPresentHours = 0;
    let globalAbsentHours = 0;
    let globalCancelledHours = 0;

    subjectMetricsList.forEach(sm => {
      globalPresentCount += sm.presentCount;
      globalAbsentCount += sm.absentCount;
      globalCancelledCount += sm.cancelledCount;
      globalPresentHours += sm.presentHours;
      globalAbsentHours += sm.absentHours;
      globalCancelledHours += sm.cancelledHours;

      globalAttendedUnits += sm.attendedUnits;
      globalConductedUnits += sm.conductedUnits;
      globalCancelledUnits += (mode === 'hour' ? sm.cancelledHours : sm.cancelledCount);
    });

    let globalPercentage = 100;
    if (globalConductedUnits > 0) {
      globalPercentage = Math.round((globalAttendedUnits / globalConductedUnits) * 1000) / 10;
    }

    let globalSafeToSkip = 0;
    let globalMustAttend = 0;
    let globalStatus = 'neutral';

    if (globalConductedUnits > 0) {
      if (globalPercentage >= targetPercent) {
        // Safe to skip formula: (Attended - Target * Conducted) / Target
        const rawSkip = (globalAttendedUnits - (targetRatio * globalConductedUnits)) / targetRatio;
        globalSafeToSkip = mode === 'hour' ? Math.floor(rawSkip * 10) / 10 : Math.floor(rawSkip);
        if (globalSafeToSkip < 0) globalSafeToSkip = 0;
        
        globalStatus = (globalPercentage >= targetPercent + 5) ? 'safe' : 'warning';
      } else {
        // Must attend formula: (Target * Conducted - Attended) / (1 - Target)
        const rawMust = ((targetRatio * globalConductedUnits) - globalAttendedUnits) / (1 - targetRatio);
        globalMustAttend = mode === 'hour' ? Math.ceil(rawMust * 10) / 10 : Math.ceil(rawMust);
        if (globalMustAttend < 0) globalMustAttend = 0;
        
        globalStatus = 'critical';
      }
    } else {
      globalPercentage = 100;
      globalStatus = 'safe';
    }

    return {
      mode: mode,
      targetPercent: targetPercent,
      overall: {
        percentage: globalPercentage,
        status: globalStatus,
        safeToSkip: globalSafeToSkip,
        mustAttend: globalMustAttend,
        attendedUnits: Math.round(globalAttendedUnits * 10) / 10,
        conductedUnits: Math.round(globalConductedUnits * 10) / 10,
        cancelledUnits: Math.round(globalCancelledUnits * 10) / 10,
        presentCount: globalPresentCount,
        absentCount: globalAbsentCount,
        cancelledCount: globalCancelledCount,
        presentHours: Math.round(globalPresentHours * 10) / 10,
        absentHours: Math.round(globalAbsentHours * 10) / 10,
        cancelledHours: Math.round(globalCancelledHours * 10) / 10,
        unitLabel: mode === 'hour' ? 'Hours' : 'Days / Classes'
      },
      subjects: subjectMetricsList
    };
  }

  static finalizeSubjectMetric(sub, mode, targetRatio, targetPercent) {
    if (mode === 'hour') {
      sub.attendedUnits = Math.round(sub.presentHours * 10) / 10;
      sub.conductedUnits = Math.round(sub.totalHours * 10) / 10;
    } else {
      sub.attendedUnits = sub.presentCount;
      sub.conductedUnits = sub.totalClasses;
    }

    if (sub.conductedUnits > 0) {
      sub.percentage = Math.round((sub.attendedUnits / sub.conductedUnits) * 1000) / 10;
      
      if (sub.percentage >= targetPercent) {
        const rawSkip = (sub.attendedUnits - (targetRatio * sub.conductedUnits)) / targetRatio;
        sub.safeToSkip = mode === 'hour' ? Math.floor(rawSkip * 10) / 10 : Math.floor(rawSkip);
        if (sub.safeToSkip < 0) sub.safeToSkip = 0;
        sub.mustAttend = 0;
        sub.status = (sub.percentage >= targetPercent + 5) ? 'safe' : 'warning';
      } else {
        const rawMust = ((targetRatio * sub.conductedUnits) - sub.attendedUnits) / (1 - targetRatio);
        sub.mustAttend = mode === 'hour' ? Math.ceil(rawMust * 10) / 10 : Math.ceil(rawMust);
        if (sub.mustAttend < 0) sub.mustAttend = 0;
        sub.safeToSkip = 0;
        sub.status = 'critical';
      }
    } else {
      sub.percentage = 100;
      sub.status = 'neutral';
      sub.safeToSkip = 0;
      sub.mustAttend = 0;
    }

    return sub;
  }

  static getEmptyMetrics() {
    return {
      mode: 'hour',
      targetPercent: 75,
      overall: {
        percentage: 100,
        status: 'neutral',
        safeToSkip: 0,
        mustAttend: 0,
        attendedUnits: 0,
        conductedUnits: 0,
        unitLabel: 'Hours'
      },
      subjects: []
    };
  }

  /**
   * Helper to format human-readable attendance advice
   */
  static getAdvice(metric) {
    if (metric.conductedUnits === 0) {
      return {
        badge: 'No classes yet',
        color: 'text-gray-400',
        bg: 'bg-gray-800/60',
        border: 'border-gray-700',
        message: 'No attendance records logged yet for this academic term.'
      };
    }

    if (metric.percentage >= metric.targetPercent) {
      if (metric.safeToSkip > 0) {
        return {
          badge: `Safe to skip ${metric.safeToSkip} ${metric.unitLabel}`,
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-500/30',
          message: `You are above target (${metric.percentage}%). You can safely miss up to ${metric.safeToSkip} ${metric.unitLabel} and stay above ${metric.targetPercent}%.`
        };
      } else {
        return {
          badge: 'On the edge (0 safe skips)',
          color: 'text-amber-400',
          bg: 'bg-amber-950/40',
          border: 'border-amber-500/30',
          message: `Currently meeting target (${metric.percentage}%), but skipping the next session will drop you below ${metric.targetPercent}%.`
        };
      }
    } else {
      return {
        badge: `Must attend next ${metric.mustAttend} ${metric.unitLabel}`,
        color: 'text-rose-400',
        bg: 'bg-rose-950/40',
        border: 'border-rose-500/30',
        message: `Attendance is critical (${metric.percentage}%). You must attend the next ${metric.mustAttend} consecutive ${metric.unitLabel} to recover to ${metric.targetPercent}%.`
      };
    }
  }
}

window.MetricsEngine = MetricsEngine;
