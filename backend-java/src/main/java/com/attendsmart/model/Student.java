package com.attendsmart.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student {
    private String id;
    private String name;
    private String rollNumber;
    private String email;
    private String phone;
    private String parentName;
    private String parentPhone;
    private String parentEmail;
    private String course;
    private String semester;
    private String section;
    private Integer totalClasses;
    private Integer attendedClasses;
    private Double attendanceRate; // e.g. 71.4
    private String status; // "good", "warning", "critical"
    private String lastAlertSentAt;
    private String createdAt;
    private String updatedAt;

    public boolean isBelowThreshold(double threshold) {
        return this.attendanceRate != null && this.attendanceRate < threshold;
    }
}
