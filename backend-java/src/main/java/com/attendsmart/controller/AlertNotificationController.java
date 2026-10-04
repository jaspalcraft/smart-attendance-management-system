package com.attendsmart.controller;

import com.attendsmart.model.Student;
import com.attendsmart.service.EmailService;
import com.attendsmart.service.SmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/alerts")
@CrossOrigin(origins = "*")
public class AlertNotificationController {

    @Autowired
    private SmsService smsService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/sms")
    public ResponseEntity<Map<String, Object>> dispatchSmsAlert(@RequestBody Map<String, Object> payload) {
        String studentName = (String) payload.getOrDefault("studentName", "Student");
        String rollNumber = (String) payload.getOrDefault("rollNumber", "ID");
        String phone = (String) payload.get("phone");
        double rate = Double.parseDouble(payload.getOrDefault("attendanceRate", "70.0").toString());
        double threshold = Double.parseDouble(payload.getOrDefault("threshold", "75.0").toString());

        if (phone == null || phone.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Phone number is required"));
        }

        String sid = smsService.sendLowAttendanceAlert(phone, studentName, rollNumber, rate, threshold);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("deliveryId", sid);
        response.put("channel", "sms");
        response.put("recipient", phone);
        response.put("timestamp", new Date());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/email")
    public ResponseEntity<Map<String, Object>> dispatchEmailAlert(@RequestBody Map<String, Object> payload) {
        String studentName = (String) payload.getOrDefault("studentName", "Student");
        String rollNumber = (String) payload.getOrDefault("rollNumber", "ID");
        String email = (String) payload.get("email");
        String course = (String) payload.getOrDefault("course", "Computer Science");
        double rate = Double.parseDouble(payload.getOrDefault("attendanceRate", "70.0").toString());
        int attended = Integer.parseInt(payload.getOrDefault("attendedClasses", "25").toString());
        int total = Integer.parseInt(payload.getOrDefault("totalClasses", "36").toString());
        double threshold = Double.parseDouble(payload.getOrDefault("threshold", "75.0").toString());

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        String emailId = emailService.sendAcademicWarningEmail(email, studentName, rollNumber, course, rate, attended, total, threshold);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("deliveryId", emailId);
        response.put("channel", "email");
        response.put("recipient", email);
        response.put("timestamp", new Date());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sweep")
    public ResponseEntity<Map<String, Object>> runAutomatedSweep(@RequestBody List<Student> students) {
        int alerted = 0;
        List<String> auditLogs = new ArrayList<>();

        for (Student s : students) {
            if (s.isBelowThreshold(75.0)) {
                if (s.getParentPhone() != null) {
                    smsService.sendLowAttendanceAlert(s.getParentPhone(), s.getName(), s.getRollNumber(), s.getAttendanceRate(), 75.0);
                    alerted++;
                    auditLogs.add("SMS dispatched to " + s.getName() + " (" + s.getParentPhone() + ")");
                }
                if (s.getParentEmail() != null) {
                    emailService.sendAcademicWarningEmail(
                        s.getParentEmail(), s.getName(), s.getRollNumber(), s.getCourse(),
                        s.getAttendanceRate(), s.getAttendedClasses(), s.getTotalClasses(), 75.0
                    );
                    alerted++;
                    auditLogs.add("Email warning sent to " + s.getName() + " (" + s.getParentEmail() + ")");
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("totalEvaluated", students.size());
        result.put("alertsDispatched", alerted);
        result.put("auditLogs", auditLogs);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "framework", "Spring Boot 3.2.4 (Java 17)",
            "firebaseAdmin", "CONNECTED",
            "smsService", "TWILIO_ONLINE",
            "emailService", "JAVAMAIL_READY"
        ));
    }
}
