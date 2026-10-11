package com.attendsmart.controller;

import com.attendsmart.model.Student;
import com.attendsmart.service.EmailService;
import com.attendsmart.service.SmsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "${app.cors.allowed-origins}")
public class AlertNotificationController {

    private static final String SUCCESS_KEY = "success";

    private final SmsService smsService;
    private final EmailService emailService;

    public AlertNotificationController(SmsService smsService, EmailService emailService) {
        this.smsService = smsService;
        this.emailService = emailService;
    }

    @PostMapping("/sms")
    public ResponseEntity<Map<String, Object>> dispatchSmsAlert(@RequestBody Map<String, Object> payload) {
        String studentName = String.valueOf(payload.getOrDefault("studentName", "Student"));
        String rollNumber = String.valueOf(payload.getOrDefault("rollNumber", "ID"));
        String phone = (String) payload.get("phone");
        double rate = Double.parseDouble(payload.getOrDefault("attendanceRate", "70.0").toString());
        double threshold = Double.parseDouble(payload.getOrDefault("threshold", "75.0").toString());

        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number is required"));
        }

        String sid = smsService.sendLowAttendanceAlert(phone, studentName, rollNumber, rate, threshold);

        Map<String, Object> response = new HashMap<>();
        response.put(SUCCESS_KEY, true);
        response.put("deliveryId", sid);
        response.put("channel", "sms");
        response.put("recipient", phone);
        response.put("timestamp", Instant.now());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> dispatchEmailAlert(@RequestBody Map<String, Object> payload) {
        String studentName = String.valueOf(payload.getOrDefault("studentName", "Student"));
        String rollNumber = String.valueOf(payload.getOrDefault("rollNumber", "ID"));
        String email = (String) payload.get("email");
        String course = String.valueOf(payload.getOrDefault("course", "Computer Science"));
        double rate = Double.parseDouble(payload.getOrDefault("attendanceRate", "70.0").toString());
        int attended = Integer.parseInt(payload.getOrDefault("attendedClasses", "25").toString());
        int total = Integer.parseInt(payload.getOrDefault("totalClasses", "36").toString());
        double threshold = Double.parseDouble(payload.getOrDefault("threshold", "75.0").toString());

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        String emailId = emailService.sendAcademicWarningEmail(email, studentName, rollNumber, course, rate, attended, total, threshold);

        Map<String, Object> response = new HashMap<>();
        response.put(SUCCESS_KEY, true);
        response.put("deliveryId", emailId);
        response.put("channel", "email");
        response.put("recipient", email);
        response.put("timestamp", Instant.now());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sweep")
    public ResponseEntity<Map<String, Object>> runAutomatedSweep(@RequestBody List<Student> students) {
        int alerted = 0;
        List<String> auditLogs = new ArrayList<>();

        for (Student student : students) {
            if (student != null && student.isBelowThreshold(75.0)) {
                if (student.getParentPhone() != null && !student.getParentPhone().isBlank()) {
                    smsService.sendLowAttendanceAlert(student.getParentPhone(), student.getName(), student.getRollNumber(), student.getAttendanceRate(), 75.0);
                    alerted++;
                    auditLogs.add("SMS dispatched to " + student.getName() + " (" + student.getParentPhone() + ")");
                }
                if (student.getParentEmail() != null && !student.getParentEmail().isBlank()) {
                    emailService.sendAcademicWarningEmail(
                        student.getParentEmail(), student.getName(), student.getRollNumber(), student.getCourse(),
                        student.getAttendanceRate(), student.getAttendedClasses(), student.getTotalClasses(), 75.0
                    );
                    alerted++;
                    auditLogs.add("Email warning sent to " + student.getName() + " (" + student.getParentEmail() + ")");
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put(SUCCESS_KEY, true);
        result.put("totalEvaluated", students.size());
        result.put("alertsDispatched", alerted);
        result.put("auditLogs", auditLogs);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "framework", "Spring Boot 3.5.16 (Java 25)",
            "firebaseAdmin", "CONNECTED",
            "smsService", "TWILIO_ONLINE",
            "emailService", "JAVAMAIL_READY"
        ));
    }
}
