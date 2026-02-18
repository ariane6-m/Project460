# Project460 - Network Monitoring System

## Description
A comprehensive network monitoring system with a web dashboard and a backend API. This application allows for device scanning, metrics visualization, alert management, and event timeline tracking.

## Features
*   User Authentication (Login/Registration)
*   User Management (Admin Panel for roles and users)
*   Device Scanning (using Nmap via API)
*   Device List and History
*   System Metrics (CPU, Memory, Network Stats)
*   Live Activity Graphs
*   Alerts Panel
*   Event Timeline
*   Role-Based Access Control (Admin/Viewer)
*   Dockerized deployment

## Technologies Used
*   **Backend (API)**: Node.js, Express.js, JSON Web Tokens (JWT), bcryptjs, prom-client (for metrics), xml2js, os-utils, winston
*   **Frontend (Dashboard)**: React.js, Axios, React Router DOM, Chart.js
*   **Containerization**: Docker, Docker Compose
*   **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites
*   Docker Desktop installed and running.
*   Git installed.

### Installation and Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/ariane6-m/Project460.git
    cd Project460
    ```

2.  **Build and run the Docker containers**:
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the `api` and `dashboard` Docker images (using their respective `Dockerfile`s).
    *   Start the `api` and `dashboard` services in detached mode.

3.  **Access the application**:
    *   Once the containers are up and running, open your web browser and navigate to:
        ```
        http://localhost:3000
        ```

## Usage

### Authentication
The application requires login. You can:
*   **Login with default credentials**:
    *   Username: `admin`
    *   Password: `password`
    *   The `admin` user has full privileges, including access to the Admin Panel for user management.
*   **Register a new user**: On the login page, click "Need an account? Register" to create a new user with a default role of "Viewer". Viewers have restricted access.

### Navigation
Use the sidebar to navigate through different sections of the application:
*   Dashboard (Overview)
*   System Metrics
*   Live Activity Graphs
*   Device List
*   Device History
*   Alerts Panel
*   Event Timeline
*   Network Scanning
*   Settings

### Network Scanning
Navigate to the "Network Scanning" tab to perform Nmap scans on target IPs.

## Continuous Integration (CI)

This project uses GitHub Actions for Continuous Integration. The workflow is defined in `.github/workflows/ci.yml`.

**What it does:**
*   **Build & Test:** Automatically builds and tests both the `api` and `dashboard` services on every `push` to `main` and `pull_request` targeting `main`.
*   **Security Scanning:**
    *   **Software Composition Analysis (SCA):** An `npm audit` step runs on both the `api` and `dashboard` to scan for high-severity vulnerabilities in third-party dependencies. The build will fail if such vulnerabilities are found.
    *   **Static Application Security Testing (SAST):** A `CodeQL` analysis job runs to scan the codebase for potential security vulnerabilities, such as injection attacks, and other common weaknesses. The results are displayed in the repository's "Security" tab.
*   **Dockerization:** On a push to `main`, it builds Docker images for both services and pushes them to GitHub Container Registry (`ghcr.io`), tagged with the commit SHA.
*   **Quality Assurance:** Ensures code quality and provides early feedback on changes by integrating testing and security scanning into the development lifecycle.

**How to use it:**
Push your code to GitHub, or create a pull request. Monitor the status of the workflow runs in the "Actions" tab of your GitHub repository. Vulnerability reports from CodeQL can be found in the "Security" tab.

## Project Structure
```
Project460/
├── .github/              # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml        # CI pipeline definition
├── api/                  # Backend API service (Node.js/Express)
│   ├── Dockerfile        # Dockerfile for the API
│   ├── index.js          # API entry point
│   ├── package.json      # API dependencies and scripts
│   └── src/              # API source code (middleware, services, utils)
├── dashboard/            # Frontend Dashboard (React.js)
│   ├── Dockerfile        # Dockerfile for the Dashboard
│   ├── package.json      # Dashboard dependencies and scripts
│   ├── public/           # Static assets
│   └── src/              # Dashboard source code (components, API client, styles)
├── prometheus/           # Prometheus configuration (not actively used in deployment)
│   └── prometheus.yml
├── docker-compose.yml    # Defines multi-container Docker application
└── README.md             # Project documentation (this file)
```

## Contributing
Contributions are welcome! Please fork the repository and submit pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
