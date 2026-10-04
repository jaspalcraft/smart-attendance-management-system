# Smart Attendance Management System - Java Spring Boot Backend

Production-ready Java backend featuring automated SMS and email low attendance notification engine, Spring `@Scheduled` background worker, and Firebase Cloud Firestore integration.

## Architecture
- **Framework**: Spring Boot 3.5.16 (Java 25)
- **Database**: Google Cloud Firestore (via Firebase Admin SDK)
- **SMS Gateway**: Twilio Java SDK
- **Email Delivery**: Spring JavaMailSender (SendGrid / SMTP relay)
- **Scheduler**: Spring `@EnableScheduling` & `@Scheduled` for automated daily/weekly low-attendance sweep

## Prerequisites
- Java JDK 25
- Apache Maven 3.9+
- Firebase service account JSON (`firebase-service-account.json`)
- Set `CORS_ALLOWED_ORIGINS` to the frontend origin when it is served from a different origin (defaults to `http://localhost:3000`).

## Quickstart Run

```bash
# 1. Navigate to backend directory
cd backend-java

# 2. Build and run with Maven
mvn clean spring-boot:run
```

The Spring Boot backend will start on `http://localhost:8080`.

## REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/alerts/sms` | Dispatches SMS low attendance alert via Twilio route |
| `POST` | `/api/v1/alerts/email` | Dispatches formal academic warning email |
| `POST` | `/api/v1/alerts/sweep` | Automated batch evaluation and notification dispatch |
| `GET` | `/api/v1/alerts/health` | Gateway connectivity & telemetry health status |
