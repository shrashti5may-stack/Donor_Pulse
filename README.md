#  Donor Pulse

### Connecting Blood Donors with Hospitals When Every Minute Matters

Donor Pulse is a digital blood-donor coordination platform designed to help hospitals raise urgent blood requests and discover potentially compatible and available donors based on blood group, eligibility, and proximity.
Donor Pulse does not replace blood banks. It complements them by providing a digital donor-network layer when available blood inventory may be insufficient or when additional donors are required.

## Problem Statement
During urgent medical situations, hospitals may require a specific blood group or blood component within a limited time.
Although hospitals and blood banks maintain blood inventories, situations can arise where:

-  The required blood group or component is unavailable or insufficient.
-  Additional donors are needed urgently.
-  Manually contacting donor networks can take valuable time.
-  Hospitals may not have an organized way to identify potentially available nearby donors.
-  Coordination between hospitals and potential donors can become difficult during emergencies.

This creates a **coordination gap between hospitals and potential blood donors.**

## Our Solution
Donor Pulse aims to bridge this coordination gap through a centralized digital platform connecting hospitals with a network of registered blood donors.
When a hospital creates a blood request, the platform can identify potentially compatible donors using information such as:

-  Blood-group compatibility
-  Approximate proximity
-  Donor availability
-  Eligibility status
The platform also provides a request-tracking workflow that represents the progress from raising a request to donor coordination and donation completion.

##  Who Can Use Donor Pulse?

### Hospitals
Hospitals can:

- Register their facility
- Manage hospital information
- Create emergency blood requests
- Specify blood group and blood component
- Specify required units and urgency
- View potential donor matches
- Track the progress of blood requests

### Donors
Donors can:

- Create a donor profile
- Provide blood-group information
- Set their availability status
- View blood requirements
- Respond to donor requests
- View donation history

## 🔄 How Donor Pulse Works

             🏥 Hospital
                  │
                  ▼
        Create Blood Request
                  │
                  ▼
       Blood Group Identified
                  │
                  ▼
       Compatible Donors Found
                  │
          ┌───────┴───────┐
          ▼               ▼
    Availability      Eligibility
          │               │
          └───────┬───────┘
                  ▼
       Nearby Donors Prioritized
                  │
                  ▼
          Donors Notified
                  │
                  ▼
       Hospital–Donor Coordination
                  │
                  ▼
          Donation Completed
---
## Key Features

-  **Blood Compatibility Matching** — Identifies potentially compatible donors based on blood group.
-  **Donor Availability** — Donors can update their availability status.
-  **Blood Request Management** — Hospitals can create and track blood requests.
-  **Proximity-Based Matching** — Helps prioritize potential donors based on available distance data.
-  **Request Tracking** — Shows the progress of a blood request from creation to completion.
-  **Hospital & Donor Dashboards** — Separate interfaces for hospitals and donors.
-  **Local Data Persistence** — Prototype data is stored using browser LocalStorage.
-  **Notification Workflow** — Demonstrates the process of notifying potential donors.
---

##  Application Modules

### Home Page
Introduces Donor Pulse and provides access to the main platform.

### Donor Dashboard
Allows donors to manage their profile, availability, requests and donation history.

###  Hospital Dashboard
Allows hospitals to create blood requests, view potential donor matches and track requests.

###  Registration
Separate registration flows are available for donors and hospitals.


##  Technology Stack

- **HTML5** — Structure
- **CSS3** — Styling and responsive design
- **JavaScript** — Application logic and interactions
- **LocalStorage** — Prototype data persistence
- **Node.js** — Local development server
- **Git & GitHub** — Version control and collaboration

---

## Current Implementation

Donor Pulse is currently a **functional frontend-focused prototype**.

The current version demonstrates:

- Donor and hospital workflows
- Registration
- Blood request creation
- Blood-group compatibility matching
- Donor availability
- Request tracking
- Browser-side data persistence

The prototype uses **mock/demo data and LocalStorage** instead of a production database or real-time healthcare infrastructure.

---

## Security & Authentication
The current project demonstrates the frontend workflow for registration and user access.
A production version would require:

- Secure backend authentication
- Password hashing
- Role-based access control
- Server-side validation
- Secure API communication

These are part of the future development scope.

## Future Scope
- Backend & Database — Store and manage real multi-user data.
- Secure Authentication — Implement proper login and role-based access.
- Location Services — Use authorized location services for accurate distance information.
- Real-Time Notifications — Notify eligible donors about urgent requests.
- Hospital Verification — Add secure hospital verification.
- Blood Bank Integration — Connect with existing blood-bank systems.
- Analytics — Analyze blood requests and donor availability.

##  Vision
Make finding the right donor faster, more organized, and more accessible when time matters.

**Donor Pulse aims to improve coordination between hospitals, donors and existing blood-bank systems during urgent blood requirements.**