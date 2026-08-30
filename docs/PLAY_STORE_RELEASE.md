# Google Play release checklist

## Current status

- [x] Permanent Android application ID: `com.victor.familyexpensetracker`
- [x] Android 16 / API 36 target
- [x] Capacitor Android project
- [x] Bundled production web assets
- [x] Production API configuration for Android builds
- [x] HTTPS-only Android traffic
- [x] Android notification scheduling
- [x] Microphone permission declared for voice messages
- [x] Public Privacy, Terms and Account Deletion routes
- [x] Password-confirmed in-app account deletion
- [ ] Real public support email configured as `VITE_SUPPORT_EMAIL`
- [ ] Legal text and developer identity reviewed
- [ ] Final app icon and splash assets approved
- [ ] Signed Android App Bundle generated
- [ ] Physical-device permission and workflow tests completed
- [ ] Play Console listing and Data Safety form completed
- [ ] Closed testing requirement completed

## Data Safety working inventory

The Play Console answers must match production behavior at submission time.

| Data category | Examples in this app | Purpose | User-controlled deletion |
| --- | --- | --- | --- |
| Personal information | Name, email address | Account management and authentication | Yes |
| Financial information | Expenses, budgets, categories and notes | Core expense-tracking features | Yes |
| App activity | Shopping items, reminders and family membership | Core app functionality | Yes |
| Messages | Family chat text | Family collaboration | Yes |
| Audio | Voice messages | User-requested family communication | Yes |
| Photos and files | User-selected chat attachments | User-requested family communication | Yes |
| Authentication data | Password hash and rotating session-token hashes | Account and service security | Yes |
| Diagnostics | Server request/error logs, if enabled by the host | Reliability, fraud prevention and security | Confirm provider retention |

## Permissions

| Permission | Reason | Required behavior |
| --- | --- | --- |
| Internet | Connect to the Family Expense Tracker API | Required for synchronized features |
| Notifications | Deliver reminders chosen by the user | Request only when the user enables reminders/notifications |
| Microphone | Record a voice message | Request only when the user starts recording |
| Photo/file picker | Attach a file selected by the user | Use the Android system picker; avoid broad storage access |

Direct camera capture is intentionally outside the first Android release unless it passes physical-device testing.

## Before producing the release bundle

1. Set a real `VITE_SUPPORT_EMAIL` in web and Android production environments.
2. Confirm developer legal name, country and applicable minimum user age.
3. Verify the production API and database provider retention policies.
4. Run registration, login, deletion, Family, Single, expenses, chat, uploads and reminders on physical Android devices.
5. Replace generated launcher and splash artwork with approved brand assets.
6. Generate and securely store the upload signing key, or enroll through Play App Signing.
7. Build the `.aab`, upload it to Internal testing and review Google Play's pre-launch report.
