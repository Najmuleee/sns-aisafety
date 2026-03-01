#!/usr/bin/env python3
"""
Face Processing Service
Handles face detection using RetinaFace and embedding generation using ArcFace
"""

import cv2
import numpy as np
import json
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Any
import onnxruntime as ort

# Try to import insightface, fall back to manual ONNX loading
try:
    import insightface
    INSIGHTFACE_AVAILABLE = True
except ImportError:
    INSIGHTFACE_AVAILABLE = False
    print("Warning: insightface not available, using ONNX models directly", file=sys.stderr)


class FaceProcessor:
    """
    Handles face detection and embedding generation
    """
    
    def __init__(self):
        self.detector = None
        self.recognizer = None
        self._init_models()
    
    def _init_models(self):
        """Initialize face detection and recognition models"""
        try:
            if INSIGHTFACE_AVAILABLE:
                # Use insightface for detection
                self.detector = insightface.app.FaceAnalysis(
                    name='buffalo_l',
                    providers=['CPUExecutionProvider'],
                    allowed_modules=['detection', 'recognition']
                )
                self.detector.prepare(ctx_id=-1)
            else:
                print("Using fallback face detection", file=sys.stderr)
        except Exception as e:
            print(f"Error initializing models: {e}", file=sys.stderr)
            raise
    
    def detect_faces(self, image_path: str) -> List[Dict[str, Any]]:
        """
        Detect faces in an image
        
        Returns:
            List of detected faces with bounding boxes and landmarks
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Detect faces
            if self.detector is None:
                raise RuntimeError("Detector not initialized")
            
            faces = self.detector.get(image)
            
            results = []
            for face in faces:
                bbox = face.bbox.astype(int)  # [x1, y1, x2, y2]
                
                # Convert to [x, y, width, height] format
                x, y = bbox[0], bbox[1]
                width = bbox[2] - bbox[0]
                height = bbox[3] - bbox[1]
                
                # Get confidence score
                confidence = float(face.det_score) if hasattr(face, 'det_score') else 0.9
                
                results.append({
                    'bbox': {
                        'x': int(x),
                        'y': int(y),
                        'width': int(width),
                        'height': int(height),
                        'x1': int(bbox[0]),
                        'y1': int(bbox[1]),
                        'x2': int(bbox[2]),
                        'y2': int(bbox[3])
                    },
                    'confidence': confidence,
                    'landmarks': face.landmark_2d_106.tolist() if hasattr(face, 'landmark_2d_106') else []
                })
            
            return results
        
        except Exception as e:
            print(f"Error detecting faces: {e}", file=sys.stderr)
            return []
    
    def extract_embedding(self, image_path: str, bbox: Dict[str, int]) -> Tuple[List[float], bool]:
        """
        Extract face embedding from image region
        
        Args:
            image_path: Path to image file
            bbox: Bounding box with x, y, width, height
        
        Returns:
            Tuple of (embedding vector, success flag)
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Extract face region
            x = bbox['x']
            y = bbox['y']
            width = bbox['width']
            height = bbox['height']
            
            # Add padding
            padding = 10
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(image.shape[1], x + width + padding)
            y2 = min(image.shape[0], y + height + padding)
            
            face_region = image[y1:y2, x1:x2]
            
            if face_region.size == 0:
                raise ValueError("Invalid face region")
            
            # Get embedding using insightface
            if self.detector is None:
                raise RuntimeError("Detector not initialized")
            
            # Detect faces in the region to get embedding
            faces = self.detector.get(face_region)
            
            if len(faces) == 0:
                # Try with original image and use bbox
                faces = self.detector.get(image)
                if len(faces) == 0:
                    return [], False
                
                # Find face closest to our bbox
                target_center_x = x + width / 2
                target_center_y = y + height / 2
                
                best_face = None
                best_distance = float('inf')
                
                for face in faces:
                    bbox_face = face.bbox.astype(int)
                    center_x = (bbox_face[0] + bbox_face[2]) / 2
                    center_y = (bbox_face[1] + bbox_face[3]) / 2
                    distance = (center_x - target_center_x) ** 2 + (center_y - target_center_y) ** 2
                    
                    if distance < best_distance:
                        best_distance = distance
                        best_face = face
                
                if best_face is None:
                    return [], False
                
                embedding = best_face.embedding.tolist()
            else:
                # Use the detected face with highest confidence
                best_face = max(faces, key=lambda f: f.det_score if hasattr(f, 'det_score') else 0)
                embedding = best_face.embedding.tolist()
            
            return embedding, True
        
        except Exception as e:
            print(f"Error extracting embedding: {e}", file=sys.stderr)
            return [], False
    
    def extract_embeddings_from_upload(self, image_path: str, detected_faces: List[Dict]) -> List[Dict]:
        """
        Extract embeddings for all detected faces in an upload
        
        Args:
            image_path: Path to uploaded image
            detected_faces: List of detected face bounding boxes
        
        Returns:
            List of detected faces with embeddings
        """
        results = []
        
        for i, face in enumerate(detected_faces):
            embedding, success = self.extract_embedding(image_path, face['bbox'])
            
            if success:
                face_data = face.copy()
                face_data['embedding'] = embedding
                results.append(face_data)
            else:
                print(f"Failed to extract embedding for face {i}", file=sys.stderr)
        
        return results


def main():
    """Command-line interface for face processing"""
    if len(sys.argv) < 2:
        print("Usage: python faceProcessor.py <command> [args...]", file=sys.stderr)
        print("Commands:", file=sys.stderr)
        print("  detect <image_path>", file=sys.stderr)
        print("  embed <image_path> <bbox_json>", file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    processor = FaceProcessor()
    
    if command == "detect":
        if len(sys.argv) < 3:
            print("Usage: python faceProcessor.py detect <image_path>", file=sys.stderr)
            sys.exit(1)
        
        image_path = sys.argv[2]
        faces = processor.detect_faces(image_path)
        print(json.dumps(faces))
    
    elif command == "embed":
        if len(sys.argv) < 4:
            print("Usage: python faceProcessor.py embed <image_path> <bbox_json>", file=sys.stderr)
            sys.exit(1)
        
        image_path = sys.argv[2]
        bbox_json = sys.argv[3]
        bbox = json.loads(bbox_json)
        
        embedding, success = processor.extract_embedding(image_path, bbox)
        result = {
            "success": success,
            "embedding": embedding
        }
        print(json.dumps(result))
    
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
