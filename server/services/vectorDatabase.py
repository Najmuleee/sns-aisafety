#!/usr/bin/env python3
"""
Vector Database Service
Manages FAISS index for face embedding similarity search
"""

import faiss
import numpy as np
import json
import pickle
import sys
from pathlib import Path
from typing import List, Tuple, Dict, Any
import os


class VectorDatabase:
    """
    FAISS-based vector database for face embeddings
    """
    
    def __init__(self, index_path: str = "/tmp/pfip_faiss.index", metadata_path: str = "/tmp/pfip_metadata.pkl"):
        self.index_path = index_path
        self.metadata_path = metadata_path
        self.index = None
        self.metadata = {}  # Maps index position to user_id and face_profile_id
        self.dimension = 512  # ArcFace embedding dimension
        self._load_or_create_index()
    
    def _load_or_create_index(self):
        """Load existing index or create new one"""
        if os.path.exists(self.index_path) and os.path.exists(self.metadata_path):
            try:
                self.index = faiss.read_index(self.index_path)
                with open(self.metadata_path, 'rb') as f:
                    self.metadata = pickle.load(f)
                print(f"Loaded existing FAISS index with {self.index.ntotal} vectors", file=sys.stderr)
            except Exception as e:
                print(f"Error loading index: {e}, creating new index", file=sys.stderr)
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        """Create a new FAISS index"""
        # Use IndexFlatL2 for L2 distance (Euclidean)
        # For cosine similarity, normalize vectors and use IndexFlatIP
        self.index = faiss.IndexFlatL2(self.dimension)
        self.metadata = {}
        print(f"Created new FAISS index with dimension {self.dimension}", file=sys.stderr)
    
    def _save_index(self):
        """Save index and metadata to disk"""
        try:
            faiss.write_index(self.index, self.index_path)
            with open(self.metadata_path, 'wb') as f:
                pickle.dump(self.metadata, f)
            print(f"Saved FAISS index with {self.index.ntotal} vectors", file=sys.stderr)
        except Exception as e:
            print(f"Error saving index: {e}", file=sys.stderr)
    
    def add_embedding(self, embedding: List[float], user_id: int, face_profile_id: int) -> int:
        """
        Add a face embedding to the index
        
        Args:
            embedding: Face embedding vector (512-dim for ArcFace)
            user_id: User ID
            face_profile_id: Face profile ID in database
        
        Returns:
            Index position in FAISS
        """
        try:
            # Normalize embedding for cosine similarity
            embedding_array = np.array([embedding], dtype=np.float32)
            embedding_array = embedding_array / np.linalg.norm(embedding_array, axis=1, keepdims=True)
            
            # Add to index
            index_pos = self.index.ntotal
            self.index.add(embedding_array)
            
            # Store metadata
            self.metadata[index_pos] = {
                'user_id': user_id,
                'face_profile_id': face_profile_id
            }
            
            self._save_index()
            return index_pos
        
        except Exception as e:
            print(f"Error adding embedding: {e}", file=sys.stderr)
            return -1
    
    def search_similar(self, embedding: List[float], k: int = 5, threshold: float = 0.6) -> List[Dict[str, Any]]:
        """
        Search for similar embeddings
        
        Args:
            embedding: Query embedding vector
            k: Number of results to return
            threshold: Similarity threshold (0.0 - 1.0), higher = more similar
        
        Returns:
            List of similar embeddings with metadata
        """
        try:
            if self.index.ntotal == 0:
                return []
            
            # Normalize query embedding
            query_array = np.array([embedding], dtype=np.float32)
            query_array = query_array / np.linalg.norm(query_array, axis=1, keepdims=True)
            
            # Search using L2 distance (on normalized vectors = cosine distance)
            distances, indices = self.index.search(query_array, min(k, self.index.ntotal))
            
            results = []
            for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
                if idx == -1:  # Invalid index
                    continue
                
                # Convert L2 distance to similarity score
                # For normalized vectors: similarity = 1 - (L2_distance / 2)
                similarity = 1.0 - (distance / 2.0)
                
                if similarity >= threshold:
                    metadata = self.metadata.get(int(idx), {})
                    results.append({
                        'user_id': metadata.get('user_id'),
                        'face_profile_id': metadata.get('face_profile_id'),
                        'similarity_score': float(similarity),
                        'distance': float(distance)
                    })
            
            return results
        
        except Exception as e:
            print(f"Error searching: {e}", file=sys.stderr)
            return []
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return {
            'total_vectors': self.index.ntotal if self.index else 0,
            'dimension': self.dimension,
            'index_type': type(self.index).__name__ if self.index else None
        }
    
    def reset(self):
        """Reset the index"""
        self._create_new_index()
        self._save_index()


def main():
    """Command-line interface for vector database"""
    if len(sys.argv) < 2:
        print("Usage: python vectorDatabase.py <command> [args...]", file=sys.stderr)
        print("Commands:", file=sys.stderr)
        print("  add <embedding_json> <user_id> <face_profile_id>", file=sys.stderr)
        print("  search <embedding_json> [k] [threshold]", file=sys.stderr)
        print("  stats", file=sys.stderr)
        sys.exit(1)
    
    command = sys.argv[1]
    db = VectorDatabase()
    
    if command == "add":
        if len(sys.argv) < 5:
            print("Usage: python vectorDatabase.py add <embedding_json> <user_id> <face_profile_id>", file=sys.stderr)
            sys.exit(1)
        
        embedding_json = sys.argv[2]
        user_id = int(sys.argv[3])
        face_profile_id = int(sys.argv[4])
        
        embedding = json.loads(embedding_json)
        index_pos = db.add_embedding(embedding, user_id, face_profile_id)
        
        result = {
            'success': index_pos >= 0,
            'index_position': index_pos
        }
        print(json.dumps(result))
    
    elif command == "search":
        if len(sys.argv) < 3:
            print("Usage: python vectorDatabase.py search <embedding_json> [k] [threshold]", file=sys.stderr)
            sys.exit(1)
        
        embedding_json = sys.argv[2]
        k = int(sys.argv[3]) if len(sys.argv) > 3 else 5
        threshold = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6
        
        embedding = json.loads(embedding_json)
        results = db.search_similar(embedding, k, threshold)
        
        print(json.dumps(results))
    
    elif command == "stats":
        stats = db.get_stats()
        print(json.dumps(stats))
    
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
