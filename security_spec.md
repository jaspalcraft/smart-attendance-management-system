# Security Specification: Smart Attendance Management System

## 1. Data Invariants
1. Only authenticated users with verified email or system administrators can read and write operational attendance records.
2. The bootstrapped admin email `yjassi93@gmail.com` has full administrative oversight.
3. Students and parent contact info (phone, email) are protected from unauthorized modification; only authenticated instructors/admins can register or update student data.
4. Attendance rates are clamped between 0 and 100%. Total classes must be greater than or equal to attended classes.
5. All document IDs must conform to alphanumeric characters and dashes (`^[a-zA-Z0-9_-]+$`) and be within 128 characters to prevent ID poisoning and Denial of Wallet attacks.
6. Timestamp fields (`createdAt`, `updatedAt`, `sentAt`) must be verified server timestamps or valid ISO strings within bounds.
7. Notification records can only be created by authenticated instructors/admins or automated triggers, with immutable records to prevent audit trail tampering.
8. Settings can only be modified by administrators.

## 2. The "Dirty Dozen" Malicious Payloads
1. **Payload 1 (Shadow Field Injection on Student)**: Attacker injects `{ name: "Alice", isSuperAdmin: true, rollNumber: "CS-101" }`. Must be blocked by strict schema / allowed keys.
2. **Payload 2 (ID Poisoning Attack)**: Attacker tries writing to `/students/` with an ID containing `../../malicious_path` or a 50KB string. Blocked by `isValidId()`.
3. **Payload 3 (Negative / Excessive Attendance Rate)**: Attacker sets `attendanceRate: -25` or `attendanceRate: 99999`. Must be blocked by numeric bounds.
4. **Payload 4 (Tampering Attendance Summary Record)**: Attacker alters attendance record date or markedBy field after submission. Must be rejected.
5. **Payload 5 (Unauthenticated Alert Log Insertion)**: Anonymous or spoofed client posts fake SMS delivery records to `/notifications/`. Blocked by `isSignedIn()`.
6. **Payload 6 (Admin Privilege Escalation via User Profile)**: Non-admin modifies own `role` field from `student` to `admin`. Blocked by RBAC update rule.
7. **Payload 7 (Denial of Wallet Huge Payload)**: Attacker submits a 5MB JSON string in the `message` or `studentRecords` property. Blocked by string `.size() <= 50000` bounds.
8. **Payload 8 (Email Spoofing Attack)**: Attacker with unverified token impersonates `yjassi93@gmail.com`. Blocked by checking `request.auth.token.email_verified == true`.
9. **Payload 9 (Notification Audit Tampering)**: Attacker tries deleting or modifying a previously delivered SMS/email notification log. Blocked by immutable logs rule.
10. **Payload 10 (Settings Override by Regular User)**: Non-admin updates alert thresholds in `/settings/global` to disable all low-attendance warnings. Blocked by `isAdmin()` check.
11. **Payload 11 (Blanket Collection Scraping Attack)**: Unauthenticated user issues a collection query on `/students` to harvest parent emails and phone numbers. Blocked by `isSignedIn()`.
12. **Payload 12 (Orphan Attendance Record)**: Attacker submits attendance record with an invalid or non-existent classId. Blocked by schema validation and class existence check.

## 3. Test Runner Specification
The test suite in `firestore.rules.test.ts` validates that each of the Dirty Dozen payloads triggers `PERMISSION_DENIED`.
