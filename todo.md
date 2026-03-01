# PFIP (Privacy-Focused Image Publishing Framework) - Project TODO

## Database & Schema
- [x] Design and implement database schema (users, face_profiles, uploads, detected_faces, consent_requests, audit_logs)
- [x] Create Drizzle ORM schema definitions
- [x] Set up database migrations
- [x] Create database helper functions for queries

## Face Processing Service
- [x] Install RetinaFace for face detection
- [x] Install InsightFace (ArcFace) for face embeddings
- [x] Install FAISS for vector similarity search
- [x] Implement face detection module
- [x] Implement embedding generation module
- [x] Implement vector database initialization and search
- [x] Create face processing pipeline integration

## User Registration & Face Profile
- [ ] Create user registration endpoint
- [ ] Implement face profile upload endpoint
- [ ] Generate embeddings for uploaded face images
- [ ] Store embeddings in FAISS vector database
- [ ] Link embeddings to user ID in database

## Image Upload Pipeline
- [ ] Create image upload endpoint
- [ ] Implement face detection on uploaded image
- [ ] Extract bounding boxes from detected faces
- [ ] Generate embeddings for detected faces
- [ ] Perform vector similarity search against registered users
- [ ] Match detected faces to users (with threshold logic)
- [ ] Exclude uploader from consent requirement
- [ ] Mark unmatched faces as unknown

## Consent Orchestration Engine
- [x] Create consent request generation logic
- [x] Implement consent request storage
- [x] Create consent approval endpoint
- [x] Create consent rejection endpoint
- [x] Implement consent expiration logic
- [x] Create consent status tracking

## Rendering Engine
- [x] Implement Gaussian blur algorithm for face regions
- [x] Create conditional rendering logic based on consent status
- [x] Apply blur to rejected/pending/unknown faces
- [x] Keep approved and uploader faces visible
- [x] Generate final sanitized image
- [x] Implement image storage and retrieval

## SNS Connector Architecture
- [x] Create abstract SNSConnector base class
- [x] Implement UniversalShareConnector (downloadable file + share link)
- [x] Implement FacebookPageConnector (Meta Graph API integration)
- [x] Implement InstagramConnector (Instagram Content Publishing)
- [x] Create modular connector loading system
- [x] Ensure core PFIP doesn't depend on SNS logic

## Authentication & Security
- [ ] Implement JWT-based authentication
- [ ] Create protected API endpoints
- [ ] Implement session management
- [ ] Add security headers and CORS configuration
- [ ] Prevent unauthorized consent spoofing
- [ ] Implement audit logging for all operations

## React Frontend UI
- [x] Create user registration page
- [x] Create face profile upload interface
- [x] Create image upload interface
- [ ] Create face detection visualization
- [ ] Create consent management interface
- [ ] Create final image preview with blur visualization
- [ ] Create SNS publishing options interface
- [ ] Implement demo workflow (3 users, group image, consent flow)
- [x] Add authentication UI (login/logout)
- [x] Create dashboard for user activity
- [x] Create user profile page with image gallery and history

## LLM Integration
- [ ] Integrate LLM for enhanced face matching accuracy
- [ ] Implement edge case handling (partial occlusion, varied lighting)
- [ ] Create intelligent fallback for ambiguous embeddings
- [ ] Add LLM-based consent dispute resolution
- [ ] Implement LLM logging and monitoring

## Owner Notifications
- [ ] Set up notification system for critical events
- [ ] Implement new user registration notifications
- [ ] Implement consent dispute notifications
- [ ] Implement system error notifications
- [ ] Create notification templates
- [ ] Test notification delivery

## Testing & Validation
- [ ] Write unit tests for face processing
- [ ] Write unit tests for consent logic
- [ ] Write unit tests for rendering engine
- [ ] Write integration tests for full workflow
- [ ] Test face detection accuracy (>95% target)
- [ ] Test consent enforcement (100% correctness)
- [ ] Test image processing performance (<1 second per image)
- [ ] Test security and authorization
- [ ] Test edge cases and error handling

## Documentation & Deployment
- [x] Create comprehensive README.md
- [x] Document API endpoints
- [x] Create installation instructions
- [x] Create Docker setup (docker-compose.yml)
- [x] Document database schema
- [x] Create deployment guide
- [x] Document SNS connector integration
- [x] Create troubleshooting guide

## Demo & Delivery
- [ ] Create demo data (3 sample users)
- [ ] Prepare demo scenario walkthrough
- [ ] Test complete workflow end-to-end
- [ ] Package project for delivery
- [ ] Create project archive with all files
