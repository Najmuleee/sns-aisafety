# PFIP - Privacy-Focused Image Publishing Framework

A novel, image-based multi-party facial authentication system that enforces explicit consent from all recognized individuals before image publication. The system automatically detects faces, identifies individuals using embeddings, and conditionally blurs faces based on consent status.

## Overview

PFIP addresses a critical privacy gap in social media sharing by implementing pre-publication consent enforcement. Rather than relying on post-hoc moderation, the system prevents unauthorized publication by:

1. **Automatic Face Detection**: Detects all faces in uploaded images using RetinaFace
2. **Identity Recognition**: Matches detected faces against registered user embeddings using InsightFace (ArcFace)
3. **Multi-Party Consent**: Generates consent requests for all recognized individuals (excluding the uploader)
4. **Conditional Rendering**: Automatically blurs faces of users who haven't approved publication
5. **Modular Publishing**: Supports platform-agnostic sharing through SNS connectors

## Key Features

- **User Registration**: Users upload 5-10 face images to generate and store embeddings
- **Face Processing Pipeline**: Automatic detection, embedding generation, and vector similarity search
- **Consent Orchestration**: Multi-party approval workflow with expiration logic
- **Rendering Engine**: Gaussian blur or pixelation applied conditionally
- **SNS Connectors**: Modular architecture supporting multiple platforms
- **LLM Integration**: Enhanced face matching with edge case handling
- **Audit Logging**: Complete event trail for compliance
- **Owner Notifications**: Real-time alerts for critical events

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PFIP System Architecture                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   tRPC API   │  │   Database   │      │
│  │   (React)    │──│   (Express)  │──│  (MySQL)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            │                                │
│        ┌───────────────────┼───────────────────┐            │
│        │                   │                   │            │
│        ▼                   ▼                   ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Face      │  │   Consent    │  │  Rendering   │      │
│  │  Processor   │  │   Engine     │  │   Engine     │      │
│  │  (Python)    │  │  (TypeScript)│  │  (Python)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│        │                   │                   │            │
│        ▼                   ▼                   ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Vector     │  │   Audit      │  │     SNS      │      │
│  │   Database   │  │   Logs       │  │  Connectors  │      │
│  │   (FAISS)    │  │  (Database)  │  │  (Modular)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Framework**: Express.js with tRPC
- **Database**: MySQL with Drizzle ORM
- **Face Detection**: RetinaFace (ONNX)
- **Face Recognition**: InsightFace (ArcFace embeddings)
- **Vector Database**: FAISS for similarity search
- **Authentication**: JWT-based with Manus OAuth
- **Image Processing**: OpenCV, Sharp, scikit-image

### Frontend
- **Framework**: React 19 with Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: tRPC hooks with React Query
- **Routing**: Wouter

### DevOps
- **Containerization**: Docker & Docker Compose
- **Storage**: S3-compatible (MinIO or AWS S3)
- **Notifications**: Built-in owner notification system

## Installation

### Prerequisites
- Node.js 22+
- Python 3.11+
- MySQL 8.0+
- Git

### Setup

1. **Clone and install dependencies**:
```bash
cd pfip
pnpm install
```

2. **Install Python dependencies**:
```bash
sudo pip3 install opencv-python onnxruntime numpy pillow faiss-cpu scikit-image
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize database**:
```bash
pnpm db:push
```

5. **Start development server**:
```bash
pnpm dev
```

## Project Structure

```
pfip/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Dashboard.tsx       # User dashboard
│   │   │   ├── RegisterFaces.tsx   # Face profile registration
│   │   │   └── UploadImage.tsx     # Image upload interface
│   │   ├── components/             # Reusable UI components
│   │   ├── lib/trpc.ts             # tRPC client
│   │   └── App.tsx                 # Router setup
│   └── public/                     # Static assets
│
├── server/                         # Express backend
│   ├── services/
│   │   ├── faceProcessor.py       # Face detection & embeddings (Python)
│   │   ├── vectorDatabase.py      # FAISS vector search (Python)
│   │   ├── renderingEngine.py     # Image blurring logic (Python)
│   │   ├── pythonBridge.ts        # Node.js wrapper for Python
│   │   └── consentEngine.ts       # Consent orchestration
│   ├── connectors/
│   │   └── snsConnector.ts        # SNS connector architecture
│   ├── routers.ts                 # tRPC procedure definitions
│   ├── db.ts                      # Database query helpers
│   └── _core/                     # Framework internals
│
├── drizzle/
│   ├── schema.ts                  # Database schema
│   └── migrations/                # Migration files
│
├── storage/                       # S3 storage helpers
├── shared/                        # Shared types & constants
├── docker-compose.yml             # Container orchestration
└── README.md                      # This file
```

## Database Schema

### Users
- `id`: Primary key
- `openId`: Manus OAuth identifier
- `name`, `email`: User info
- `accountType`: individual or organization
- `role`: user or admin
- `createdAt`, `updatedAt`, `lastSignedIn`: Timestamps

### FaceProfiles
- `id`: Primary key
- `userId`: Foreign key to users
- `embeddingVector`: 512-dim ArcFace embedding (JSON)
- `originalImagePath`: Path to source image
- `createdAt`: Timestamp

### Uploads
- `id`: Primary key
- `uploaderId`: Foreign key to users
- `originalImagePath`: Path to original image
- `finalImagePath`: Path to rendered image (with blur)
- `status`: pending, processing, completed, failed
- `caption`: Optional caption
- `createdAt`, `updatedAt`: Timestamps

### DetectedFaces
- `id`: Primary key
- `uploadId`: Foreign key to uploads
- `boundingBox`: JSON {x, y, width, height}
- `matchedUserId`: Foreign key to users (nullable)
- `similarityScore`: 0.0-1.0
- `embeddingVector`: 512-dim embedding (JSON)
- `createdAt`: Timestamp

### ConsentRequests
- `id`: Primary key
- `uploadId`: Foreign key to uploads
- `requestedUserId`: Foreign key to users
- `status`: pending, approved, rejected
- `createdAt`, `expiresAt`, `respondedAt`: Timestamps

### AuditLogs
- `id`: Primary key
- `eventType`: Event classification
- `userId`: Foreign key to users (nullable)
- `metadata`: Event details (JSON)
- `timestamp`: Event time

## API Endpoints

### Face Management
- `POST /api/trpc/faces.registerProfiles` - Register face profiles
- `GET /api/trpc/faces.getProfiles` - Get user's face profiles

### Image Uploads
- `POST /api/trpc/uploads.uploadImage` - Upload image for processing
- `GET /api/trpc/uploads.getUpload` - Get upload details

### Consent Management
- `GET /api/trpc/consent.getPending` - Get pending consent requests
- `POST /api/trpc/consent.approve` - Approve consent request
- `POST /api/trpc/consent.reject` - Reject consent request

## Face Processing Pipeline

### Step 1: Face Detection
```
Input Image → RetinaFace → Detected Faces with Bounding Boxes
```

### Step 2: Embedding Generation
```
Each Detected Face → InsightFace (ArcFace) → 512-dim Embedding Vector
```

### Step 3: Vector Similarity Search
```
Detected Embeddings → FAISS Search → Matched User IDs with Scores
```

### Step 4: Consent Request Generation
```
Matched Users → Exclude Uploader → Create Consent Requests
```

### Step 5: Conditional Rendering
```
Original Image + Consent Status → Apply Blur to Non-Approved Faces → Final Image
```

## Consent Logic

| Face Category | Rendering |
|---|---|
| Uploader | Always visible |
| Approved | Visible |
| Rejected | Blurred |
| Pending | Blurred |
| Unknown | Blurred |

## SNS Connectors

### Universal Share Connector
- Generates downloadable file
- Provides platform-agnostic share link
- Always available

### Facebook Page Connector
- Uses Meta Graph API
- Requires page access token and page ID
- Publishes to Facebook page

### Instagram Connector
- Uses Instagram Content Publishing API
- Requires business account ID and access token
- Publishes to Instagram feed

### Adding Custom Connectors
```typescript
export class CustomConnector extends SNSConnector {
  name = "custom";
  
  isConfigured(): boolean {
    return !!process.env.CUSTOM_API_KEY;
  }
  
  async publish(imagePath, caption, metadata) {
    // Implementation
  }
}

// Register connector
snsRegistry.register(new CustomConnector());
```

## LLM Integration

The system uses LLM capabilities for:
- Enhanced face matching accuracy with edge case handling
- Intelligent fallback when embedding similarity is ambiguous
- Partial occlusion detection and handling
- Varied lighting condition analysis
- Consent dispute resolution

## Owner Notifications

Critical events trigger notifications to the system owner:
- New user registrations
- Consent disputes or rejections
- System errors or failures
- Unusual activity patterns

## Security Considerations

1. **Embedding Storage**: Embeddings stored securely in database
2. **JWT Authentication**: All endpoints require valid JWT token
3. **Consent Verification**: Consent approval requires authenticated session
4. **Audit Trail**: All operations logged for compliance
5. **Image Privacy**: Original images stored securely, final images with blur
6. **Unauthorized Spoofing Prevention**: Consent requests tied to authenticated users

## Performance Targets

- Face detection: < 1 second per image
- Embedding generation: < 500ms per face
- Vector search: < 100ms for 10k embeddings
- Image rendering: < 500ms per image
- Overall pipeline: < 2 seconds per upload

## Testing

### Run Tests
```bash
pnpm test
```

### Test Coverage
- Face detection accuracy: > 95%
- Embedding matching: > 95% accuracy
- Consent enforcement: 100% correctness
- Image rendering: Visual verification

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Environment Variables
```
DATABASE_URL=mysql://user:pass@localhost:3306/pfip
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

## Troubleshooting

### Face Detection Issues
- Ensure image quality and lighting
- Check face size (minimum 20x20 pixels)
- Verify RetinaFace model is loaded

### Embedding Mismatch
- Verify face profiles registered with clear images
- Check similarity threshold (default: 0.6)
- Consider LLM fallback for edge cases

### Database Connection
- Verify MySQL is running
- Check DATABASE_URL configuration
- Run migrations: `pnpm db:push`

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/name`
4. Submit pull request

## License

MIT License - See LICENSE file for details

## References

- [RetinaFace: Single-stage Dense Face Localisation in the Wild](https://arxiv.org/abs/1905.00641)
- [ArcFace: Additive Angular Margin Loss for Deep Face Recognition](https://arxiv.org/abs/1801.07698)
- [FAISS: A Library for Efficient Similarity Search](https://github.com/facebookresearch/faiss)
- [InsightFace: 2D and 3D Face Analysis Project](https://github.com/deepinsight/insightface)

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the development team.

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Beta
