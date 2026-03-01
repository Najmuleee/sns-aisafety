# PFIP Setup Guide

Complete setup instructions for the Privacy-Focused Image Publishing Framework.

## Prerequisites

- **Node.js**: 22.0 or higher
- **Python**: 3.11 or higher
- **MySQL**: 8.0 or higher
- **Git**: Latest version
- **Docker** (optional): For containerized deployment

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/pfip.git
cd pfip
```

### 2. Install Node Dependencies

```bash
pnpm install
```

### 3. Install Python Dependencies

```bash
# Install build tools
sudo apt-get install -y build-essential python3-dev

# Install Python packages
sudo pip3 install opencv-python onnxruntime numpy pillow faiss-cpu scikit-image
```

### 4. Configure Environment

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=mysql://pfip_user:pfip_password@localhost:3306/pfip
JWT_SECRET=your_secure_random_key_here
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
```

### 5. Initialize Database

```bash
# Generate migrations
pnpm db:push
```

This will create all required tables:
- users
- face_profiles
- uploads
- detected_faces
- consent_requests
- audit_logs

### 6. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Docker Deployment

### 1. Build and Start Containers

```bash
docker-compose up -d
```

This starts:
- MySQL database
- Redis cache
- MinIO S3 storage
- PFIP application

### 2. Verify Services

```bash
# Check running containers
docker-compose ps

# View logs
docker-compose logs -f app
```

### 3. Access Application

- **Application**: http://localhost:3000
- **MinIO Console**: http://localhost:9001
- **Database**: localhost:3306

## Configuration Details

### Database Setup

If using local MySQL:

```bash
# Create database
mysql -u root -p
CREATE DATABASE pfip;
CREATE USER 'pfip_user'@'localhost' IDENTIFIED BY 'pfip_password';
GRANT ALL PRIVILEGES ON pfip.* TO 'pfip_user'@'localhost';
FLUSH PRIVILEGES;
```

### S3 Storage Setup

#### Using MinIO (Local Development)

```bash
# Create bucket
docker exec pfip_minio mc mb minio/pfip-images
```

#### Using AWS S3 (Production)

Update `.env`:

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=your_aws_access_key
S3_SECRET_KEY=your_aws_secret_key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
```

### OAuth Configuration

1. Register application at Manus
2. Get `VITE_APP_ID`
3. Set `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL`

### SNS Connectors

#### Facebook Integration

```env
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_token
FACEBOOK_PAGE_ID=your_page_id
```

#### Instagram Integration

```env
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
INSTAGRAM_ACCESS_TOKEN=your_access_token
```

## Face Processing Setup

### Model Download

Models are downloaded automatically on first use:

- **RetinaFace**: ~100MB
- **InsightFace (ArcFace)**: ~300MB

### GPU Support (Optional)

For faster processing with NVIDIA GPU:

```bash
# Install CUDA-enabled packages
sudo pip3 install onnxruntime-gpu
```

Update `faceProcessor.py`:

```python
providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
```

## Testing

### Run Tests

```bash
pnpm test
```

### Test Face Detection

```bash
python3 server/services/faceProcessor.py detect path/to/image.jpg
```

### Test Vector Database

```bash
python3 server/services/vectorDatabase.py stats
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution**:
- Verify MySQL is running: `sudo systemctl status mysql`
- Check DATABASE_URL in .env
- Ensure database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Python Module Not Found

```
ModuleNotFoundError: No module named 'cv2'
```

**Solution**:
```bash
sudo pip3 install opencv-python
```

### Face Detection Fails

```
Error detecting faces: No module named 'insightface'
```

**Solution**:
- Ensure Python packages installed: `pip3 list | grep -E "opencv|onnx|faiss"`
- Check model files downloaded to `~/.insightface/models/`

### Port Already in Use

```
Error: listen EADDRINUSE :::3000
```

**Solution**:
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

## Performance Optimization

### Database Indexing

Add indexes for frequently queried fields:

```sql
CREATE INDEX idx_user_id ON face_profiles(user_id);
CREATE INDEX idx_upload_id ON detected_faces(upload_id);
CREATE INDEX idx_consent_upload ON consent_requests(upload_id);
```

### FAISS Index Optimization

For large-scale deployments:

```python
# Use GPU-accelerated FAISS
import faiss
index = faiss.index_factory(512, "IVF1000,Flat")
```

### Image Processing Pipeline

- **Parallel Processing**: Process multiple faces concurrently
- **Caching**: Cache embeddings for repeated faces
- **Batch Operations**: Process multiple uploads in batch

## Monitoring

### Application Logs

```bash
# View server logs
tail -f .manus-logs/devserver.log

# View browser console
cat .manus-logs/browserConsole.log

# View network requests
cat .manus-logs/networkRequests.log
```

### Database Monitoring

```bash
# Check active connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check table sizes
mysql -u root -p -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.tables WHERE table_schema = 'pfip';"
```

## Production Deployment

### Environment Setup

```env
NODE_ENV=production
APP_URL=https://your-domain.com
JWT_SECRET=<generate_strong_random_key>
```

### SSL/TLS Configuration

Use reverse proxy (nginx/Apache):

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Backup

```bash
# Daily backup
mysqldump -u pfip_user -p pfip > backup_$(date +%Y%m%d).sql

# Restore
mysql -u pfip_user -p pfip < backup_20260228.sql
```

### Scaling Considerations

- **Horizontal Scaling**: Use load balancer (HAProxy, nginx)
- **Database Replication**: MySQL master-slave setup
- **Cache Layer**: Redis cluster for session management
- **CDN**: CloudFront or similar for image delivery

## Support

For issues or questions:

1. Check logs in `.manus-logs/`
2. Review error messages in browser console
3. Check database connectivity
4. Verify all environment variables set
5. Open GitHub issue with details

## Next Steps

1. Register test users
2. Upload sample images
3. Test face detection pipeline
4. Configure SNS connectors
5. Set up monitoring and alerts

---

**Last Updated**: February 2026  
**Version**: 1.0.0
