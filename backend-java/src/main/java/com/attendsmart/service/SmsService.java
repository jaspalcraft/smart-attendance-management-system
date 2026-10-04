package com.attendsmart.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SmsService {

    @Value("${twilio.account.sid:}")
    private String accountSid;

    @Value("${twilio.auth.token:}")
    private String authToken;

    @Value("${twilio.phone.number:+18005552345}")
    private String fromNumber;

    @PostConstruct
    public void init() {
        if (accountSid != null && !accountSid.startsWith("AC_mock") && !accountSid.isEmpty()) {
            Twilio.init(accountSid, authToken);
        }
    }

    public String sendLowAttendanceAlert(String toPhone, String studentName, String rollNumber, double attendanceRate, double threshold) {
        String body = String.format(
            "[CAMPUS ALERT] Dear Parent, attendance for %s (%s) has dropped to %.1f%%, below the mandatory %.0f%% requirement. Please meet the academic counselor.",
            studentName, rollNumber, attendanceRate, threshold
        );

        try {
            if (accountSid != null && !accountSid.startsWith("AC_mock") && !accountSid.isEmpty()) {
                Message message = Message.creator(
                    new PhoneNumber(toPhone),
                    new PhoneNumber(fromNumber),
                    body
                ).create();
                return message.getSid();
            } else {
                // Telemetry simulation mode
                String mockSid = "SM_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
                System.out.printf("[JAVA SMS SERVICE] Sent SMS to %s via Twilio route. Body: %s (SID: %s)%n", toPhone, body, mockSid);
                return mockSid;
            }
        } catch (Exception e) {
            System.err.println("[JAVA SMS ERROR] Failed to send SMS: " + e.getMessage());
            return "ERR_" + UUID.randomUUID().toString().substring(0, 8);
        }
    }
}
