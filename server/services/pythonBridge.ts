/**
 * Python Bridge Service
 * Provides Node.js interface to Python face processing services
 */

import { spawn, spawnSync } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { writeFile, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const servicesDir = path.join(process.cwd(), 'server', 'services');

interface FaceDetectionResult {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  confidence: number;
  landmarks: number[][];
}

interface EmbeddingResult {
  embedding: number[];
  success: boolean;
}

interface VectorSearchResult {
  user_id: number;
  face_profile_id: number;
  similarity_score: number;
  distance: number;
}

interface RenderingResult {
  success: boolean;
  output_path: string | null;
}

/**
 * Execute Python script and return JSON result
 */
async function executePython(
  scriptName: string,
  args: string[]
): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(servicesDir, scriptName);
    const process = spawn('python3', [scriptPath, ...args], {
      cwd: servicesDir,
      timeout: 60000, // 60 second timeout
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[${scriptName}] ${data.toString()}`);
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse JSON output: ${stdout}`));
      }
    });

    process.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Detect faces in an image
 */
export async function detectFaces(imagePath: string): Promise<FaceDetectionResult[]> {
  try {
    const result = await executePython('faceProcessor.py', ['detect', imagePath]);
    return result || [];
  } catch (error) {
    console.error('Face detection error:', error);
    return [];
  }
}

/**
 * Extract face embedding from image region
 */
export async function extractEmbedding(
  imagePath: string,
  bbox: { x: number; y: number; width: number; height: number }
): Promise<number[]> {
  try {
    const result = await executePython('faceProcessor.py', [
      'embed',
      imagePath,
      JSON.stringify(bbox),
    ]);

    if (result.success) {
      return result.embedding || [];
    }
    return [];
  } catch (error) {
    console.error('Embedding extraction error:', error);
    return [];
  }
}

/**
 * Add embedding to vector database
 */
export async function addEmbeddingToVectorDB(
  embedding: number[],
  userId: number,
  faceProfileId: number
): Promise<number> {
  try {
    const result = await executePython('vectorDatabase.py', [
      'add',
      JSON.stringify(embedding),
      userId.toString(),
      faceProfileId.toString(),
    ]);

    return result.success ? result.index_position : -1;
  } catch (error) {
    console.error('Vector DB add error:', error);
    return -1;
  }
}

/**
 * Search for similar embeddings in vector database
 */
export async function searchSimilarEmbeddings(
  embedding: number[],
  k: number = 5,
  threshold: number = 0.6
): Promise<VectorSearchResult[]> {
  try {
    const result = await executePython('vectorDatabase.py', [
      'search',
      JSON.stringify(embedding),
      k.toString(),
      threshold.toString(),
    ]);

    return result || [];
  } catch (error) {
    console.error('Vector DB search error:', error);
    return [];
  }
}

/**
 * Get vector database statistics
 */
export async function getVectorDBStats(): Promise<any> {
  try {
    const result = await executePython('vectorDatabase.py', ['stats']);
    return result;
  } catch (error) {
    console.error('Vector DB stats error:', error);
    return null;
  }
}

/**
 * Render image with conditional blurring
 */
export async function renderImage(
  imagePath: string,
  detectedFaces: FaceDetectionResult[],
  consentRequests: Array<{ requested_user_id: number; status: string }>,
  uploaderId: number
): Promise<RenderingResult> {
  try {
    const result = await executePython('renderingEngine.py', [
      'render',
      imagePath,
      JSON.stringify(detectedFaces),
      JSON.stringify(consentRequests),
      uploaderId.toString(),
    ]);

    return result;
  } catch (error) {
    console.error('Rendering error:', error);
    return { success: false, output_path: null };
  }
}

/**
 * Blur a specific region in an image
 */
export async function blurRegion(
  imagePath: string,
  bbox: { x: number; y: number; width: number; height: number; x1?: number; y1?: number; x2?: number; y2?: number }
): Promise<RenderingResult> {
  try {
    const result = await executePython('renderingEngine.py', [
      'blur',
      imagePath,
      JSON.stringify(bbox),
    ]);

    return result;
  } catch (error) {
    console.error('Blur region error:', error);
    return { success: false, output_path: null };
  }
}

/**
 * Process complete face detection and embedding pipeline
 */
export async function processFaceDetectionPipeline(
  imagePath: string
): Promise<Array<FaceDetectionResult & { embedding: number[] }>> {
  try {
    // Step 1: Detect faces
    const detectedFaces = await detectFaces(imagePath);

    if (detectedFaces.length === 0) {
      return [];
    }

    // Step 2: Extract embeddings for each face
    const facesWithEmbeddings: Array<FaceDetectionResult & { embedding: number[] }> = [];

    for (const face of detectedFaces) {
      const embedding = await extractEmbedding(imagePath, face.bbox);

      if (embedding.length > 0) {
        facesWithEmbeddings.push({
          ...face,
          embedding,
        });
      }
    }

    return facesWithEmbeddings;
  } catch (error) {
    console.error('Face detection pipeline error:', error);
    return [];
  }
}
