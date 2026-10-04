package com.attendsmart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Enables automated daily/weekly low-attendance sweep jobs
public class AttendanceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AttendanceApplication.class, args);
        System.out.println("=================================================");
        System.out.println("  SMART ATTENDANCE MANAGEMENT BACKEND (JAVA)     ");
        System.out.println("  Spring Boot + Firebase Admin + Twilio + Mail   ");
        System.out.println("=================================================");
    }
}
