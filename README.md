# Unihub – University Event Platform  

## Project Overview  
Unihub is a microservice‑based web application that centralises university events in a single, easy‑to‑access hub. Students can browse, filter, and RSVP for events, while organisers can create, edit, and manage their own listings. The project was built as a collaborative team effort, with each member responsible for a distinct microservice, mirroring real‑world software‑engineering practices.

## Table of Contents  
- [Project Overview](#project-overview)  
- [Features](#features)  
  - [Student Features](#student-features)  
  - [Organiser Features](#organiser-features)  
- [Microservice Architecture](#microservice-architecture)  
- [Tech Stack](#tech-stack)  
- [API Overview](#api-overview)  
- [Future Vision](#future-vision)  
- [Contributors](#contributors)  

## Features  

### Student Features  
- View upcoming events (default view shows the next five days).  
- Filter events by category (Tech, Education, Parties, Workshops, Rallies, Conferences).  
- Expand event cards to see full description, reviews, images, and an RSVP button.  
- RSVP for events directly from the platform.  

### Organiser Features  
- Log in via the shared authentication service with role‑based access control.  
- Create new events, specifying image, description, time, location, date, capacity, and entrance fee.  
- Edit or delete existing events.  
- View feedback and reviews for past events.  

## Microservice Architecture  
Each team member built a dedicated microservice using their preferred language and tools. All services are loosely coupled and communicate via HTTP API calls.

| Service               | Language / Framework | Database      | Responsibilities                                 |
|-----------------------|----------------------|---------------|---------------------------------------------------|
| **Event Service**     | Node.js + Express    | MongoDB Atlas | Create, edit, delete, search, filter, RSVP       |
| **Authentication Service** | PHP                  | MongoDB Atlas | Register, login, role management (student/organiser) |
| **Feedback Service**  | Node.js              | MySQL         | Collect and display anonymous event feedback      |
| **Notification Service** | .NET Core            | SQLite        | Send reminders and updates for upcoming events   |

## Tech Stack  

- **Frontend:** HTML, CSS, JavaScript  
- **Backend:** Node.js/Express, PHP, .NET Core  
- **Databases:** MongoDB Atlas, MySQL, SQLite  
- **Authentication:** JWT (JSON Web Tokens)  
- **Architecture:** Microservices  
- **Tools:** GitHub, Kanban boards, Docker (planned for deployment)  

## API Overview  

### Event Service  
- `GET /events` – Retrieve a list of events.  
- `POST /event` – Create a new event.  
- `PUT /event/:id` – Update an existing event.  
- `DELETE /event/:id` – Remove an event.  
- `PUT /event/rsvp/:id` – RSVP to an event.  

### Authentication Service  
- `POST /register` – Register a new user.  
- `POST /login` – Authenticate and receive a JWT containing the user role.  

### Feedback Service  
- `POST /feedback/:eventId` – Submit anonymous feedback for an event.  
- `GET /feedback/:eventId` – Retrieve feedback for an event.  

### Notification Service  
- Scheduled daily reminder jobs.  
- On‑demand notification endpoints (implementation details TBD).  

## Future Vision  

1. **Official University App** – Partner with the university to adopt Unihub as the primary event hub, improving student engagement and providing a showcase project for the team.  
2. **Startup Expansion** – Scale the platform to serve multiple universities across Hamburg, monetising through event promotion, partnership deals, and curated event hosting.  

## Contributors  

| Contributor | Service               | Technology                               |
|-------------|-----------------------|------------------------------------------|
| **Event Service** | Node.js + MongoDB | Event CRUD, filtering, RSVP |
| **Auth Service**   | PHP + MongoDB    | Registration, login, JWT issuance |
| **Feedback Service** | Node.js + MySQL | Anonymous feedback collection |
| **Notification Service** | .NET Core + SQLite | Reminder and update notifications |

---

*This project demonstrates teamwork, cross‑technology learning, and practical problem‑solving within a realistic microservice environment.*
