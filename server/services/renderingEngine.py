#!/usr/bin/env python3
"""
Rendering Engine Service
Handles conditional blurring of faces based on consent status
"""

import cv2
import numpy as np
import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from enum import Enum


class ConsentStatus(Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING = "pending"
    UNKNOWN = "unknown"


class RenderingEngine:
    """
    Handles face blurring and conditional rendering
    """
    
    def __init__(self, blur_method: str = "gaussian", blur_strength: int = 31):
        """
        Initialize rendering engine
        
        Args:
            blur_method: "gaussian" or "pixelate"
            blur_strength: Blur kernel size (must be odd number)
        """
        self.blur_method = blur_method
        self.blur_strength = blur_strength if blur_strength % 2 == 1 else blur_strength + 1
    
    def blur_region(self, image: np.ndarray, bbox: Dict[str, int]) -> np.ndarray:
        """
        Apply blur to a region of the image
        
        Args:
            image: Image array
            bbox: Bounding box with x, y, x1, y1, x2, y2
        
        Returns:
            Image with blurred region
        """
        try:
            # Extract coordinates
            x1 = max(0, bbox.get('x1', bbox['x']))
            y1 = max(0, bbox.get('y1', bbox['y']))
            x2 = min(image.shape[1], bbox.get('x2', bbox['x'] + bbox['width']))
            y2 = min(image.shape[0], bbox.get('y2', bbox['y'] + bbox['height']))
            
            # Ensure valid region
            if x1 >= x2 or y1 >= y2:
                return image
            
            # Extract region
            region = image[y1:y2, x1:x2].copy()
            
            if self.blur_method == "gaussian":
                # Apply Gaussian blur
                blurred = cv2.GaussianBlur(region, (self.blur_strength, self.blur_strength), 0)
            elif self.blur_method == "pixelate":
                # Apply pixelation
                blurred = self._pixelate(region, pixel_size=self.blur_strength // 3)
            else:
                blurred = region
            
            # Replace region in image
            image[y1:y2, x1:x2] = blurred
            return image
        
        except Exception as e:
            print(f"Error blurring region: {e}", file=sys.stderr)
            return image
    
    def _pixelate(self, image: np.ndarray, pixel_size: int = 10) -> np.ndarray:
        """
        Apply pixelation effect to image
        
        Args:
            image: Image array
            pixel_size: Size of pixelation blocks
        
        Returns:
            Pixelated image
        """
        try:
            h, w = image.shape[:2]
            
            # Resize down
            small_h = max(1, h // pixel_size)
            small_w = max(1, w // pixel_size)
            small = cv2.resize(image, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
            
            # Resize back
            pixelated = cv2.resize(small, (w, h), interpolation=cv2.INTER_NEAREST)
            
            return pixelated
        except Exception as e:
            print(f"Error pixelating: {e}", file=sys.stderr)
            return image
    
    def render_image(self, image_path: str, detected_faces: List[Dict[str, Any]], 
                    consent_status: Dict[int, str], uploader_id: int) -> Tuple[str, bool]:
        """
        Render image with conditional blurring
        
        Args:
            image_path: Path to original image
            detected_faces: List of detected faces with bounding boxes
            consent_status: Dict mapping face index to consent status
            uploader_id: ID of user who uploaded the image
        
        Returns:
            Tuple of (output_path, success)
        """
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Process each detected face
            for i, face in enumerate(detected_faces):
                matched_user_id = face.get('matched_user_id')
                bbox = face.get('bbox', {})
                
                # Determine if face should be blurred
                should_blur = False
                
                if matched_user_id == uploader_id:
                    # Uploader's face is always visible
                    should_blur = False
                else:
                    # Check consent status
                    status = consent_status.get(i, ConsentStatus.UNKNOWN.value)
                    
                    if status == ConsentStatus.APPROVED.value:
                        should_blur = False
                    else:
                        # Blur if rejected, pending, or unknown
                        should_blur = True
                
                # Apply blur if needed
                if should_blur:
                    image = self.blur_region(image, bbox)
            
            # Save rendered image
            output_path = image_path.replace('.jpg', '_rendered.jpg').replace('.png', '_rendered.png')
            success = cv2.imwrite(output_path, image)
            
            if not success:
                raise ValueError(f"Could not write image: {output_path}")
            
            return output_path, True
        
        except Exception as e:
            print(f"Error rendering image: {e}", file=sys.stderr)
            return "", False
    
    def render_with_consent_requests(self, image_path: str, detected_faces: List[Dict[str, Any]],
                                    consent_requests: List[Dict[str, Any]], uploader_id: int) -> Tuple[str, bool]:
        """
        Render image based on consent requests
        
        Args:
            image_path: Path to original image
            detected_faces: List of detected faces
            consent_requests: List of consent request objects with status
            uploader_id: ID of uploader
        
        Returns:
            Tuple of (output_path, success)
        """
        try:
            # Build consent status map
            # consent_requests should have: upload_id, requested_user_id, status
            consent_status = {}
            
            for i, face in enumerate(detected_faces):
                matched_user_id = face.get('matched_user_id')
                
                # Find consent request for this user
                status = ConsentStatus.UNKNOWN.value
                
                if matched_user_id:
                    for req in consent_requests:
                        if req.get('requested_user_id') == matched_user_id:
                            status = req.get('status', ConsentStatus.PENDING.value)
                            break
                
                consent_status[i] = status
            
            return self.render_image(image_path, detected_faces, consent_status, uploader_id)
        
        except Exception as e:
            print(f"Error rendering with consent requests: {e}", file=sys.stderr)
            return "", False


def main():
    """Command-line interface for rendering engine"""
    if len(sys.argv) < 2:
        print("Usage: python renderingEngine.py <command> [args...]", file=sys.stderr)
        print("Commands:", file=sys.stderr)
        print("  blur <image_path> <bbox_json>", file=sys.stderr)
        print("  render <image_path> <faces_json> <consent_json> <uploader_id>", file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    engine = RenderingEngine()
    
    if command == "blur":
        if len(sys.argv) < 4:
            print("Usage: python renderingEngine.py blur <image_path> <bbox_json>", file=sys.stderr)
            sys.exit(1)
        
        image_path = sys.argv[2]
        bbox_json = sys.argv[3]
        bbox = json.loads(bbox_json)
        
        image = cv2.imread(image_path)
        if image is None:
            print(json.dumps({"success": False, "error": "Could not read image"}))
            sys.exit(1)
        
        blurred = engine.blur_region(image, bbox)
        output_path = image_path.replace('.jpg', '_blurred.jpg').replace('.png', '_blurred.png')
        success = cv2.imwrite(output_path, blurred)
        
        result = {
            "success": success,
            "output_path": output_path if success else None
        }
        print(json.dumps(result))
    
    elif command == "render":
        if len(sys.argv) < 6:
            print("Usage: python renderingEngine.py render <image_path> <faces_json> <consent_json> <uploader_id>", file=sys.stderr)
            sys.exit(1)
        
        image_path = sys.argv[2]
        faces_json = sys.argv[3]
        consent_json = sys.argv[4]
        uploader_id = int(sys.argv[5])
        
        detected_faces = json.loads(faces_json)
        consent_requests = json.loads(consent_json)
        
        output_path, success = engine.render_with_consent_requests(
            image_path, detected_faces, consent_requests, uploader_id
        )
        
        result = {
            "success": success,
            "output_path": output_path if success else None
        }
        print(json.dumps(result))
    
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
