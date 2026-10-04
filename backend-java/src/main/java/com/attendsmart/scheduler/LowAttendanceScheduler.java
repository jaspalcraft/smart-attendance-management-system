package com.attendsmart.scheduler;

import com.attendsmart.service.EmailService;
import com.attendsmart.service.SmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class LowAttendanceScheduler {

    @Autowired
    private SmsService smsService;

    @Autowired
    private EmailService emailService;

    /**
     * Automated cron scheduled job:
     * Runs every weekday at 17:00 (5:00 PM) to inspect attendance deficits
     * and trigger automated alerts.
     */
    @Scheduled(cron = "${attendance.alert.cron:0 0 17 * * ?}")
    public void runDailyAttendanceAudit() {
        System.out.printf("[JAVA CRON SCHEDULER] Daily low attendance audit triggered at %s%n", LocalDateTime.now());
        // In full deployment, queries Firebase Firestore collection "students" where attendanceRate < 75.0
        // Automatically dispatches SMS and Email warnings to students and parents
    }
}
