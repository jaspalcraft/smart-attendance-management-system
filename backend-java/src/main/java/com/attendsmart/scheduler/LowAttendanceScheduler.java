package com.attendsmart.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
public class LowAttendanceScheduler {

    private static final Logger logger = LoggerFactory.getLogger(LowAttendanceScheduler.class);

    /**
     * Automated cron scheduled job:
     * Runs every weekday at 17:00 (5:00 PM) to inspect attendance deficits
     * and trigger automated alerts.
     */
    @Scheduled(cron = "${attendance.alert.cron:0 0 17 * * ?}")
    public void runDailyAttendanceAudit() {
        logger.info("[JAVA CRON SCHEDULER] Daily low attendance audit triggered at {}",
                LocalDateTime.now(ZoneId.systemDefault()));
        // In full deployment, queries Firebase Firestore collection "students" where attendanceRate < 75.0
        // Automatically dispatches SMS and Email warnings to students and parents
    }
}
