# Raqeb Food — Frontend Dashboard

## Project Overview

**Raqeb Food** is an IoT-based food delivery monitoring system for school meal transportation.

The system monitors delivery conditions such as temperature, humidity, tilt and GPS position during transport. It also manages the workflow between schools, administrators and drivers, and includes an AI-assisted driver recommendation feature.

The name **Raqeb** comes from the Arabic word **راقب**, meaning “to monitor” or “to watch”.

This repository contains the **frontend dashboard application** developed with React.

---

## Whole Project Description

The complete Raqeb Food system is composed of:

- A **Raspberry Pi backend** that reads sensor data, manages the database, handles authentication and exposes REST API endpoints.
- A **React frontend dashboard** used by admin, school and driver users.
- An **IoT monitoring layer** using temperature, humidity, tilt and GPS data.
- An **AI recommendation module** that helps the admin choose the most suitable available driver for each delivery request.

The main goal of the project is to improve the monitoring and management of school food deliveries by combining IoT sensing, GPS tracking, delivery workflow management and AI-based decision support.

---

## Component Repositories

- Backend / IoT / AI repository:  
  https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part1-YassineBH26

- Frontend dashboard repository:  
  https://github.com/UniSalento-IDALab-IoTCourse-2024-2025/wot-project-part2-YassineBH26

- GitHub Page showcase repository:  
  To be added

---

## Frontend Component Description

This repository contains the React dashboard used to interact with the Raqeb Food system.

The frontend provides role-based interfaces for:

- Admin users
- School users
- Driver users

The frontend communicates with the Flask backend through REST API calls.

---

## Technologies Used

- React
- React Router
- JavaScript
- CSS
- Fetch API
- Browser Geolocation API
- REST API communication with Flask backend

---

## System Architecture

The frontend is part of the following architecture:

```txt
School User / Admin User / Driver User
              ↓
      React Frontend Dashboard
              ↓
          REST API Calls
              ↓
  Flask Backend on Raspberry Pi
              ↓
 SQLite Database + IoT Sensors + AI Module
```

The frontend is responsible for displaying the user interfaces, sending user actions to the backend, and showing live monitoring information returned by the backend.

---

## User Roles

### Admin

The admin can:

- View school delivery requests.
- Assign drivers to requests.
- Use the AI driver recommendation panel.
- View and create operational accounts.
- Monitor active deliveries.
- View delivery information and reports.

### School

The school user can:

- Create a new delivery request.
- Enter food items and quantities.
- Add the requested delivery time.
- Add special notes.
- View submitted requests.

### Driver

The driver user can:

- View assigned deliveries.
- Start a delivery.
- Send GPS coordinates from the phone browser.
- View live delivery monitoring data.
- Complete a delivery.
- View completed deliveries.

---

## Main Frontend Pages

The frontend includes the following main pages:

- Login page
- Admin Control Center
- User Management page
- School Panel
- Driver Panel
- Delivery Report page

---

## Admin Control Center

The Admin Control Center allows the administrator to manage delivery requests.

Main features:

- View all school requests.
- Filter requests by status.
- Assign available drivers.
- Ask the AI module for a driver recommendation.
- View the AI recommendation panel.
- See the predicted risk, recommendation score and explanation reasons.

The AI recommendation is requested through the backend endpoint:

```txt
/recommend-driver
```

The admin remains responsible for the final assignment decision.

---

## User Management

The User Management page allows the admin to create and view operational accounts.

Supported account roles:

- Admin
- School
- Driver

For security and usability, the password input field is displayed using hidden characters instead of plain text.

---

## School Panel

The School Panel allows school users to create food delivery requests.

A school request can include:

- Food items
- Quantity
- Requested delivery time
- Special notes

The request is then visible to the admin in the Admin Control Center.

---

## Driver Panel

The Driver Panel allows a driver to manage assigned deliveries.

The driver can:

1. View assigned deliveries.
2. Start a delivery.
3. Activate monitoring.
4. Send GPS coordinates from the phone browser.
5. View live temperature, humidity, tilt and GPS values.
6. Complete the active delivery.
7. View completed deliveries.

---

## Phone GPS Tracking

The driver phone is used as the GPS source.

When the driver opens the dashboard from a phone browser and clicks **Start Delivery**:

1. The browser requests location permission.
2. The frontend uses the Browser Geolocation API.
3. The phone reads its current latitude and longitude.
4. The frontend sends the coordinates to the backend.
5. The backend updates the live GPS position.
6. The coordinates are displayed in the live monitoring section.

This replaces the previous shortcut-based GPS testing method.

The frontend uses:

```txt
navigator.geolocation.watchPosition()
```

Mobile browsers require HTTPS to allow GPS access.  
For local prototype testing, a Cloudflare Tunnel can be used to expose the React app through HTTPS:

```bash
cloudflared tunnel --url http://localhost:3000
```

In a real deployment, the dashboard should be hosted directly over HTTPS.

---

## AI Recommendation Interface

The frontend includes an AI Recommendation panel in the admin view.

When the admin requests a recommendation, the backend evaluates available drivers and returns:

- Recommended driver name
- Predicted risk label
- Recommendation score
- Explanation reasons
- Other evaluated drivers

The AI predicts **delivery-condition risk**, not driver quality in general.

The predicted risk can be:

```txt
low
medium
high
```

The score represents the driver’s suitability for the specific delivery request. A higher score means a better recommendation.

---

## Backend Connection

The frontend communicates with the Flask backend through REST API calls.

During development, the backend URL can be configured using the `proxy` field in `package.json`, for example:

```json
"proxy": "http://<raspberry-pi-ip>:5000"
```

When changing network, update the Raspberry Pi IP:

```bash
npm pkg set proxy=http://<new-raspberry-pi-ip>:5000
```

The `.env` file is used only for local configuration and is not pushed to GitHub.

---

## Important Frontend Files

```txt
src/services/api.js
```

Contains the API functions used to communicate with the backend.

```txt
src/pages/AdminRequests.jsx
```

Admin dashboard for viewing school requests, assigning drivers and using the AI recommendation feature.

```txt
src/pages/AdminUsers.jsx
```

Admin page for creating and viewing operational user accounts.

```txt
src/pages/Driver.jsx
```

Driver workspace. It handles assigned deliveries, live delivery monitoring, delivery completion and phone GPS tracking.

```txt
src/pages/School.jsx
```

School interface for creating and viewing delivery requests.

```txt
src/pages/DeliveryReport.jsx
```

Displays delivery report information.

---

## Installation

Install the project dependencies:

```bash
npm install
```

---

## Running the Frontend

Start the React development server:

```bash
npm start
```

The app runs locally on:

```txt
http://localhost:3000
```

It can also be opened from another device on the same network using the laptop IP:

```txt
http://<laptop-ip>:3000
```

For phone GPS testing, use an HTTPS tunnel such as Cloudflare Tunnel.

---

## Example Demo Flow

A typical demo scenario is:

1. The school creates a delivery request.
2. The admin opens the Admin Control Center.
3. The admin asks for an AI recommendation.
4. The admin assigns a driver.
5. The driver opens the dashboard on a phone.
6. The driver starts the delivery.
7. Phone GPS tracking becomes active.
8. Live monitoring data is displayed.
9. The driver completes the delivery.
10. The delivery report can be checked.

---

## Prototype Limitations

This is a working academic prototype. Current limitations include:

- The frontend is currently run as a React development server.
- Phone GPS requires HTTPS, so Cloudflare Tunnel is used for local testing.
- Some data is seeded or prototype-generated for demonstration.
- The interface is designed for exam/demo use and is not yet a production deployment.

---

## Future Improvements

Possible future improvements include:

- Deploying the frontend permanently over HTTPS.
- Adding a real-time map view for GPS tracking.
- Improving mobile responsiveness.
- Adding notifications for delivery alerts.
- Adding richer analytics for monitoring history.
- Adding persistent route tracking.
- Improving the UI for production use.