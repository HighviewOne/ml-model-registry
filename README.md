# ML Model Registry & Deployment Dashboard

A web application for data scientists and ML engineers to register, version, track, and deploy machine learning models through an intuitive dashboard.

## Problem Description

### The Challenge

Data science teams face significant challenges when managing machine learning models in production:

1. **Model Versioning Chaos** - Models are often stored in scattered locations (local files, cloud storage, shared drives) with inconsistent naming conventions, making it difficult to track which version is deployed where.

2. **Lack of Metadata Tracking** - Critical information about models (training data, hyperparameters, performance metrics, dependencies) is frequently lost or poorly documented.

3. **Deployment Friction** - Moving a model from development to production typically requires manual intervention, custom scripts, and coordination between data scientists and DevOps teams.

4. **No Central Source of Truth** - Teams lack visibility into what models exist, their status, and their deployment history.

### The Solution

The **ML Model Registry & Deployment Dashboard** provides:

- **Centralized Model Repository** - A single place to register and store all ML models with their metadata
- **Version Control** - Track model versions with automatic versioning and comparison capabilities
- **Rich Metadata** - Store and query model information including:
  - Model name, description, and tags
  - Framework (scikit-learn, TensorFlow, PyTorch, etc.)
  - Performance metrics (accuracy, F1, RMSE, etc.)
  - Training dataset information
  - Author and creation timestamps
- **Deployment Management** - Track deployment status and history across environments (staging, production)
- **Simple UI** - Intuitive dashboard for non-technical stakeholders to view model inventory

### Target Users

- **Data Scientists** - Register models, track experiments, compare versions
- **ML Engineers** - Deploy models, monitor deployment status
- **Team Leads** - Get visibility into the ML model inventory and deployment pipeline

## Features

### Core Features (MVP)

- [ ] Register new ML models with metadata
- [ ] Upload model artifacts (pickle files, ONNX, etc.)
- [ ] List and search models
- [ ] View model details and version history
- [ ] Update deployment status (development → staging → production)
- [ ] Dashboard with model statistics

### Future Enhancements

- Model performance comparison charts
- A/B testing support
- Automated deployment to Kubernetes
- Model lineage tracking
- API key authentication
- Webhook notifications

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │Dashboard │  │Model List│  │Model     │  │Register Model   ││
│  │  View    │  │  View    │  │Details   │  │     Form        ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
│                              │                                  │
│                    ┌─────────▼─────────┐                       │
│                    │   API Service     │                       │
│                    │ (Centralized)     │                       │
│                    └─────────┬─────────┘                       │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTP/REST
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    OpenAPI Contract                       │  │
│  │  POST /models     GET /models      GET /models/{id}      │  │
│  │  PUT /models/{id} DELETE /models   GET /models/stats     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌──────────────────────────┼──────────────────────────────┐   │
│  │              Service Layer (Business Logic)              │   │
│  └──────────────────────────┼──────────────────────────────┘   │
│                              │                                  │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │              Repository Layer (Data Access)              │   │
│  └──────────────────────────┬──────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database                                 │
│            SQLite (dev) / PostgreSQL (prod)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + TypeScript | Modern, type-safe UI |
| Styling | Tailwind CSS | Utility-first styling |
| Backend | FastAPI (Python) | High-performance async API |
| Database | SQLite / PostgreSQL | Flexible data persistence |
| ORM | SQLAlchemy | Database abstraction |
| API Docs | OpenAPI 3.0 | Contract-first development |
| Containerization | Docker + Docker Compose | Consistent environments |
| CI/CD | GitHub Actions | Automated testing & deployment |
| Cloud | TBD (Railway/Render/Fly.io) | Production hosting |

## Project Structure

```
ml-model-registry/
├── README.md
├── AGENTS.md                    # AI development documentation
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docs/
│   └── openapi.yaml            # API contract
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   │   └── api.ts          # Centralized API calls
│   │   ├── pages/
│   │   └── App.tsx
│   └── tests/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── database/
│   └── tests/
│       ├── unit/
│       └── integration/
└── scripts/
    └── deploy.sh
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/ml-model-registry.git
cd ml-model-registry

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

See [Development Guide](docs/DEVELOPMENT.md) for detailed setup instructions.

## API Documentation

The API follows a contract-first approach. See the [OpenAPI specification](docs/openapi.yaml) for the complete API contract.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/models | List all models |
| POST | /api/v1/models | Register a new model |
| GET | /api/v1/models/{id} | Get model details |
| PUT | /api/v1/models/{id} | Update model |
| DELETE | /api/v1/models/{id} | Delete model |
| GET | /api/v1/models/{id}/versions | List model versions |
| POST | /api/v1/models/{id}/versions | Create new version |
| GET | /api/v1/stats | Get dashboard statistics |

## Testing

```bash
# Run all tests
docker-compose run --rm backend pytest
docker-compose run --rm frontend npm test

# Run with coverage
docker-compose run --rm backend pytest --cov=app
```

## Deployment

The application is deployed to [TBD] and accessible at: [URL TBD]

See [Deployment Guide](docs/DEPLOYMENT.md) for manual deployment instructions.

## AI-Assisted Development

This project was built with AI assistance. See [AGENTS.md](AGENTS.md) for detailed documentation on:
- AI tools and workflows used
- Prompting strategies
- MCP (Model Context Protocol) integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**AI Dev Tools Zoomcamp 2025 - Project Attempt 1**
