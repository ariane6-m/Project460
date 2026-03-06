# Project460 - Network Monitoring System

## Description
A comprehensive network monitoring system with a web dashboard, backend API, and a local agent. This application allows for device scanning, metrics visualization, alert management, and event timeline tracking. It is backed by a **PostgreSQL** database for real-time data persistence and historical analysis.

## Features
*   **User Authentication**: Secure registration and JWT-based login with role-based access control (RBAC).
*   **Forgot Password**: Secure password reset flow using time-limited tokens.
*   **Database Persistence**: PostgreSQL backend stores users, discovered devices, scan history, and alerts.
*   **Network Scanning**: Robust Nmap-powered scanning with support for both server-side and agent-side reports.
*   **Real-time Metrics**: Live system stats (CPU, RAM, Disk Storage) from the server and connected agents.
*   **Prometheus Monitoring**: Integrated metrics collection with `prom-client` and a dedicated `/metrics` endpoint for performance tracking.
*   **Device History**: Interactive charts showing device availability and port count history.
*   **Automatic Alerts**: Real-time alert generation when new or unauthorized devices are detected.
*   **Admin Panel**: Manage users and roles (Admin/Viewer) and view real-time system audit logs via a dedicated administrative interface.
*   **Local Agent**: A lightweight Python agent (`agent.py`) for monitoring remote networks and reporting back to the central API.
*   **Dockerized Deployment**: Fully containerized environment for easy setup and cloud deployment.
*   **Resilient Logging**: Integrated audit logging with automatic fallback to console if file permissions are restricted.

## Technologies Used
*   **Backend (API)**: Node.js, Express.js, Sequelize ORM, PostgreSQL, JWT, bcryptjs, Nmap, systeminformation, Winston, **prom-client**.
*   **Frontend (Dashboard)**: React.js, React Router DOM, Chart.js, Axios, jwt-decode.
*   **Agent**: Python 3, requests, psutil.
*   **Infrastructure**: Docker, Docker Compose, Google Cloud Platform (GCP), **Prometheus**.
*   **CI/CD**: GitHub Actions with Security Scanning (CodeQL, Snyk, npm audit) and automated deployment testing.

## Getting Started

### Prerequisites
*   Docker and Docker Compose installed.
*   Python 3 (for running the agent).
*   Git installed.

### Local Installation and Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ariane6-m/Project460.git
    cd Project460
    ```

2.  **Start the services**:
    ```bash
    docker-compose up -d --build
    ```
    *This will start the API, Dashboard, and PostgreSQL database.*

3.  **Access the application**:
    *   **Dashboard**: `http://localhost:3000`
    *   **API Metrics**: `http://localhost:8080/metrics` (Requires Admin role)
    *   **Default Admin Credentials**:
        *   **Username**: `admin`
        *   **Password**: `password`

### Running the Local Agent
The agent monitors the machine it's running on and can perform network scans when requested by the dashboard.

1.  **Install dependencies**:
    ```bash
    pip install requests psutil
    ```
2.  **Configure environment (Optional)**:
    ```bash
    export API_URL="http://localhost:8080"
    export AGENT_USERNAME="admin"
    export AGENT_PASSWORD="password"
    ```
3.  **Run the agent**:
    ```bash
    python agent.py
    ```

---

## Configuration

### Admin Panel & RBAC
The application implements Role-Based Access Control (RBAC). 
- **Admin**: Full access to device management, scans, user role modification, and audit logs.
- **Viewer**: Read-only access to devices and metrics; cannot trigger scans or manage users.

To access the **Admin Panel**, log in as an Admin and click the "Admin" link in the sidebar (or navigate to `/admin`).

### Environment Variables

#### API (`api/.env` or Docker)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_HOST` | Database hostname | `db` (Docker) |
| `DB_USER` | Database username | `moto_user` |
| `DB_PASSWORD` | Database password | `moto_password` |
| `DB_NAME` | Database name | `motomoto` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `ENCRYPTION_KEY`| 32-character key for data encryption | (Required for encryption utils) |

#### Dashboard (`dashboard/.env` or Docker)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | URL of the Backend API | `http://localhost:8080` |

#### Agent
| Variable | Description | Default |
| :--- | :--- | :--- |
| `API_URL` | URL of the Backend API | `http://localhost:8080` |
| `AGENT_USERNAME` | Username for agent authentication | `admin` |
| `AGENT_PASSWORD` | Password for agent authentication | `password` |

---

## Cloud Deployment (Google Cloud Platform)

The application is optimized for deployment on a GCP Compute Engine VM (Ubuntu).

### Deployment Steps:
1.  **Prepare the VM**:
    ```bash
    gcloud compute instances create moto-moto-server --machine-type=e2-small --tags=http-server
    gcloud compute firewall-rules create allow-moto --allow tcp:3000,tcp:8080
    ```
2.  **Configure & Build**:
    Update the `args` section in `docker-compose.yml` with your VM's external IP:
    ```yaml
    dashboard:
      build:
        args:
          - REACT_APP_API_URL=http://YOUR_EXTERNAL_IP:8080
    ```
3.  **Deploy**:
    ```bash
    docker compose up -d --build
    ```

---

## Security & Monitoring
*   **JWT Authentication**: All API requests (except login/register/reset-password) require a valid JWT.
*   **Password Security**: Hashing via `bcryptjs` and secure password reset flow using unique, expiring tokens.
*   **Privacy**: Audit logs and timeline events are filtered based on user roles (Admins see all; Viewers see only their own).
*   **Audit Logging**: Every administrative action (who, what, when, IP) is logged for security auditing and visible in the Admin Panel.
*   **Prometheus Metrics**: Tracks traffic (requests total) and system health (CPU, Memory, Event Loop) every 15 seconds.
*   **Security Scanning**: Integrated Snyk and CodeQL scanning in the CI/CD pipeline to identify vulnerabilities.

---

## Project Structure
```
Project460/
├── api/                  # Backend API service
│   ├── src/
│   │   ├── models/       # Database schemas (PostgreSQL/Sequelize)
│   │   ├── middleware/   # RBAC and Auth logic
│   │   ├── services/     # Audit logging (resilient to EACCES)
│   │   └── utils/        # Encryption and helpers
│   └── index.js          # API entry point & Prometheus metrics
├── dashboard/            # React Frontend
│   ├── src/
│   │   ├── components/   # UI Modules (AdminPanel, Scanning, Metrics)
│   │   ├── ProtectedRoute.js # JWT validation & expiration checks
│   │   └── api.js        # Axios client with auto-redirect on 401
├── agent.py              # Python-based remote monitoring agent
├── prometheus/           # Prometheus configuration
├── docker-compose.yml    # Multi-container orchestration
└── README.md             # Documentation
```

## Continuous Integration (CI)
Automated workflows via GitHub Actions handle:
*   **Dependency Auditing**: `npm audit` for vulnerability detection.
*   **Security Scanning**: `CodeQL` analysis for code-level vulnerabilities.
*   **Containerization**: Automated builds and pushes to GitHub Container Registry (GHCR).
*   **Deployment Testing**: Automated `deploy-test` job that spins up the full stack to verify health and connectivity.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
