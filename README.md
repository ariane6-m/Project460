# Project460 - Network Monitoring System

## Description
A comprehensive network monitoring system with a web dashboard and a backend API. This application allows for device scanning, metrics visualization, alert management, and event timeline tracking. Now backed by a **PostgreSQL** database for real-time data persistence and historical analysis.

## Features
*   **User Authentication**: Enhanced registration with Full Name, Email, and JWT-based secure login.
*   **Database Persistence**: PostgreSQL backend stores users, discovered devices, scan history, and alerts.
*   **Network Scanning**: Robust Nmap-powered scanning with support for large buffers and XML parsing.
*   **Real-time Metrics**: Live system stats (CPU, Memory, Network) pulled directly from the host machine using `systeminformation`.
*   **Device History**: Interactive charts showing device availability and port count history.
*   **Automatic Alerts**: Real-time alert generation when new or unauthorized devices are detected.
*   **Admin Panel**: Manage users and roles (Admin/Viewer) via a dedicated administrative interface.
*   **Dockerized Deployment**: Fully containerized environment for easy setup and cloud deployment.

## Technologies Used
*   **Backend (API)**: Node.js, Express.js, Sequelize ORM, PostgreSQL, JWT, bcryptjs, Nmap, systeminformation.
*   **Frontend (Dashboard)**: React.js, React Router DOM, Chart.js, Axios.
*   **Infrastructure**: Docker, Docker Compose, Google Cloud Platform (GCP).
*   **CI/CD**: GitHub Actions with Security Scanning (CodeQL, npm audit).

## Getting Started

### Prerequisites
*   Docker and Docker Compose installed.
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
    *   Navigate to: `http://localhost:3000`
    *   **Default Admin Credentials**:
        *   **Username**: `admin`
        *   **Password**: `password`

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
    Update `REACT_APP_API_URL` in `docker-compose.yml` to your VM's external IP.
    ```bash
    docker compose build --build-arg REACT_APP_API_URL=http://YOUR_EXTERNAL_IP:8080 dashboard
    docker compose up -d
    ```

---

## Project Structure
```
Project460/
├── api/                  # Backend API service
│   ├── src/
│   │   ├── models/       # Database schemas (PostgreSQL/Sequelize)
│   │   ├── middleware/   # RBAC and Auth logic
│   │   └── services/     # Audit logging
│   └── index.js          # API entry point
├── dashboard/            # React Frontend
│   ├── src/
│   │   ├── components/   # UI Modules (Scanning, History, Metrics)
│   │   └── api.js        # Configured Axios client
├── docker-compose.yml    # Multi-container orchestration
└── README.md             # Documentation
```

## Continuous Integration (CI)
Automated workflows via GitHub Actions handle:
*   **Dependency Auditing**: `npm audit` for vulnerability detection.
*   **Security Scanning**: `CodeQL` analysis for code-level vulnerabilities.
*   **Containerization**: Automated builds and pushes to GitHub Container Registry.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
