package com.attendsmart.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public String sendAcademicWarningEmail(
        String recipientEmail,
        String studentName,
        String rollNumber,
        String course,
        double attendanceRate,
        int attended,
        int total,
        double threshold
    ) {
        String subject = String.format("URGENT: Low Attendance Academic Warning - %s (%.1f%%)", studentName, attendanceRate);
        
        String htmlContent = String.format("""
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto;">
              <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;">
                <h2 style="color: #dc2626; margin: 0;">OFFICIAL ACADEMIC WARNING NOTICE</h2>
                <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Office of the Registrar &bull; Automated Attendance Bureau</p>
              </div>
              <p>Dear Parent / Guardian,</p>
              <p>This automated notification concerns enrolled student <strong>%s</strong> (Roll ID: <code>%s</code>, Course: %s).</p>
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin: 18px 0; border-radius: 6px;">
                <p style="margin: 0; font-weight: bold; color: #991b1b; font-size: 16px;">Current Attendance Rate: %.1f%%</p>
                <p style="margin: 4px 0 0 0; color: #7f1d1d; font-size: 13px;">Sessions Attended: %d / %d</p>
              </div>
              <p>As per university bylaws, a strict minimum of <strong>%.0f%% attendance</strong> is required to remain eligible for the semester final examinations.</p>
              <p>Continued absences risk formal debarment. Please arrange a conference with the Faculty Advisor within 3 working days.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">Issued automatically by Smart Attendance Management System (Java Spring Boot Edition).</p>
            </div>
            """, studentName, rollNumber, course, attendanceRate, attended, total, threshold);

        try {
            if (mailSender != null) {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setTo(recipientEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);
                helper.setFrom("registrar@campus.edu");
                mailSender.send(message);
            } else {
                System.out.printf("[JAVA EMAIL SERVICE] Warning letter queued for %s. Subject: %s%n", recipientEmail, subject);
            }
            return "EML_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } catch (MessagingException e) {
            System.err.println("[JAVA EMAIL ERROR] Error sending email: " + e.getMessage());
            return "ERR_EMAIL";
        }
    }
}
