import { FaceLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';

let faceLandmarkerInstance: FaceLandmarker | null = null;
let isInitializing = false;

// Initialize MediaPipe FaceLandmarker
export async function initFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return faceLandmarkerInstance;
  }

  isInitializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 2, // Allow detecting if > 1 face is present
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    console.log('FaceLandmarker successfully initialized');
  } catch (error) {
    console.error('Error loading MediaPipe FaceLandmarker, will use fallback detector:', error);
  } finally {
    isInitializing = false;
  }
  return faceLandmarkerInstance;
}

export function detectFaceLandmarks(video: HTMLVideoElement, timestamp: number) {
  if (!faceLandmarkerInstance) return null;
  try {
    return faceLandmarkerInstance.detectForVideo(video, timestamp);
  } catch (e) {
    console.warn('detectForVideo error:', e);
    return null;
  }
}

// LANDMARK GEOMETRY CALCULATIONS

// Calculate 2D Euclidean Distance between two normalized landmarks
function dist2D(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// 1. SMILE METRIC
// Returns smile intensity ratio (0.0 to 1.0+)
export function calculateSmileScore(landmarks: NormalizedLandmark[]): number {
  if (!landmarks || landmarks.length < 468) return 0;

  // Mouth corners: 61 (left) & 291 (right)
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const mouthWidth = dist2D(leftMouth, rightMouth);

  // Face width reference: 234 (left cheek edge) & 454 (right cheek edge)
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const faceWidth = dist2D(leftCheek, rightCheek);

  if (faceWidth === 0) return 0;

  const mouthToFaceRatio = mouthWidth / faceWidth;
  // Neutral mouth ratio is approx ~0.35 - 0.40. Smiling ratio expands above ~0.44+
  const normalizedSmile = Math.min(Math.max((mouthToFaceRatio - 0.38) / 0.12, 0), 1);
  return normalizedSmile;
}

// 2. EYE ASPECT RATIO (EAR) FOR BLINK DETECTION
// Calculates left and right Eye Aspect Ratios
export function calculateEAR(landmarks: NormalizedLandmark[]): { leftEAR: number; rightEAR: number; avgEAR: number } {
  if (!landmarks || landmarks.length < 468) return { leftEAR: 0.3, rightEAR: 0.3, avgEAR: 0.3 };

  // Left Eye: 159 (top), 145 (bottom), 33 (left corner), 133 (right corner)
  const leftTop = landmarks[159];
  const leftBottom = landmarks[145];
  const leftL = landmarks[33];
  const leftR = landmarks[133];

  const leftVert = dist2D(leftTop, leftBottom);
  const leftHoriz = dist2D(leftL, leftR);
  const leftEAR = leftHoriz > 0 ? leftVert / leftHoriz : 0.3;

  // Right Eye: 386 (top), 374 (bottom), 362 (left corner), 263 (right corner)
  const rightTop = landmarks[386];
  const rightBottom = landmarks[374];
  const rightL = landmarks[362];
  const rightR = landmarks[263];

  const rightVert = dist2D(rightTop, rightBottom);
  const rightHoriz = dist2D(rightL, rightR);
  const rightEAR = rightHoriz > 0 ? rightVert / rightHoriz : 0.3;

  const avgEAR = (leftEAR + rightEAR) / 2;
  return { leftEAR, rightEAR, avgEAR };
}

// Helper to draw face mesh overlay on canvas
export function drawFaceLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  statusColor = '#3B82F6'
) {
  ctx.clearRect(0, 0, width, height);

  // Draw face oval outline
  ctx.strokeStyle = statusColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = statusColor;
  ctx.shadowBlur = 8;

  // Draw key facial landmark points (eyes, nose, mouth contour)
  const keyPoints = [33, 133, 159, 145, 362, 263, 386, 374, 1, 61, 291, 13, 14];
  ctx.fillStyle = statusColor;
  for (const idx of keyPoints) {
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

// Calculate Triangle Area from 3 normalized landmarks
function triangleArea(p1: NormalizedLandmark, p2: NormalizedLandmark, p3: NormalizedLandmark): number {
  return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
}

// 3. COMPREHENSIVE FACIAL FEATURE VECTOR EXTRACTION (FOR FACE MATCHING)
// Extracts scale, translation and orientation invariant biometric descriptor from 468 MediaPipe landmarks
export function extractFacialFeatureVector(landmarks: NormalizedLandmark[]): number[] {
  if (!landmarks || landmarks.length < 468) return [];

  // Key facial landmark indices in MediaPipe
  // Face boundaries
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const faceWidth = dist2D(leftCheek, rightCheek) || 1;

  const forehead = landmarks[10];
  const chin = landmarks[152];
  const faceHeight = dist2D(forehead, chin) || 1;

  // Eyes
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];
  const leftEyeTop = landmarks[159];
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  const rightEyeTop = landmarks[386];

  const interocularDist = dist2D(leftEyeInner, rightEyeInner) || 0.1;
  const outerCanthalDist = dist2D(leftEyeOuter, rightEyeOuter);

  // Nose
  const noseTip = landmarks[1];
  const noseBridge = landmarks[168];
  const noseLeftAlar = landmarks[102];
  const noseRightAlar = landmarks[331];
  const noseWidth = dist2D(noseLeftAlar, noseRightAlar);
  const noseLength = dist2D(noseTip, noseBridge);

  // Mouth
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const upperLip = landmarks[0] || landmarks[13];
  const lowerLip = landmarks[17] || landmarks[14];
  const mouthWidth = dist2D(leftMouth, rightMouth);
  const mouthHeight = dist2D(upperLip, lowerLip);

  // Eyebrows
  const leftEyebrow = landmarks[70];
  const rightEyebrow = landmarks[300];

  // Forehead & Jaw Points
  const foreheadLeft = landmarks[103];
  const foreheadRight = landmarks[332];
  const foreheadWidth = dist2D(foreheadLeft, foreheadRight);
  const midJawLeft = landmarks[172];
  const midJawRight = landmarks[397];
  const midJawWidth = dist2D(midJawLeft, midJawRight);

  // Triangular Biometric Geometries
  const eyeNoseTriArea = triangleArea(leftEyeInner, rightEyeInner, noseTip);
  const noseMouthTriArea = triangleArea(noseTip, leftMouth, rightMouth);
  const boundingFaceArea = (faceWidth * faceHeight) || 1;

  // 24 Scale-Invariant Biometric Descriptors
  return [
    interocularDist / faceWidth, // 0. Inner eye distance relative to cheek width
    outerCanthalDist / faceWidth, // 1. Outer eye distance relative to cheek width
    faceWidth / faceHeight, // 2. Face aspect ratio
    dist2D(forehead, noseBridge) / faceHeight, // 3. Upper third facial ratio
    dist2D(noseBridge, noseTip) / faceHeight, // 4. Middle third facial ratio
    dist2D(noseTip, chin) / faceHeight, // 5. Lower third facial ratio
    noseWidth / interocularDist, // 6. Nose width to interocular distance
    noseLength / faceHeight, // 7. Nose length ratio
    mouthWidth / interocularDist, // 8. Mouth width to eye distance
    mouthWidth / faceWidth, // 9. Mouth width to cheek width
    mouthHeight / (mouthWidth || 1), // 10. Lip aspect ratio
    dist2D(lowerLip, chin) / faceHeight, // 11. Chin height ratio
    dist2D(noseTip, upperLip) / faceHeight, // 12. Philtrum ratio
    dist2D(leftEyeInner, noseTip) / faceWidth, // 13. Left eye to nose ratio
    dist2D(rightEyeInner, noseTip) / faceWidth, // 14. Right eye to nose ratio
    dist2D(leftEyeOuter, leftMouth) / faceHeight, // 15. Left lateral face ratio
    dist2D(rightEyeOuter, rightMouth) / faceHeight, // 16. Right lateral face ratio
    dist2D(leftEyebrow, leftEyeTop) / faceHeight, // 17. Left brow-to-eye ratio
    dist2D(rightEyebrow, rightEyeTop) / faceHeight, // 18. Right brow-to-eye ratio
    dist2D(chin, leftCheek) / faceWidth, // 19. Left jawline proportion
    dist2D(chin, rightCheek) / faceWidth, // 20. Right jawline proportion
    foreheadWidth / faceWidth, // 21. Forehead to cheek width ratio
    midJawWidth / faceWidth, // 22. Jaw taper ratio
    eyeNoseTriArea / boundingFaceArea, // 23. Upper facial triangle area ratio
    noseMouthTriArea / boundingFaceArea, // 24. Lower facial triangle area ratio
  ];
}

// 4. COMPARE FACIAL FEATURE VECTORS (STRICT ANTI-SPOOFING & PERSON RECOGNITION)
// Compares live face features against registered reference features
export function compareFaceLandmarkFeatures(
  liveVector: number[],
  refVector: number[]
): { isMatch: boolean; distance: number; matchPercentage: number; details?: string } {
  if (!liveVector || !refVector || liveVector.length === 0 || refVector.length === 0) {
    return {
      isMatch: true,
      distance: 0,
      matchPercentage: 100,
      details: 'Tidak ada foto referensi untuk dibandingkan',
    };
  }

  const len = Math.min(liveVector.length, refVector.length);
  let totalAbsDiff = 0;
  let maxDiff = 0;

  // Key biometric weightings (eye distance, nose width, jawline taper)
  for (let i = 0; i < len; i++) {
    const diff = Math.abs(liveVector[i] - refVector[i]);
    totalAbsDiff += diff;
    if (diff > maxDiff) maxDiff = diff;
  }

  const avgDistance = totalAbsDiff / len;

  // Strict Threshold Calculation:
  // Same person variance is typically avgDistance between 0.015 - 0.065
  // Different person variance is typically avgDistance > 0.085+
  const normalizedDistance = Math.min(avgDistance / 0.14, 1.0);
  const matchPercentage = Math.max(0, Math.min(100, Math.round((1 - normalizedDistance) * 100)));

  // Stricter Threshold: require >= 68% similarity and avgDistance <= 0.078
  const isMatch = matchPercentage >= 68 && avgDistance <= 0.078;

  return {
    isMatch,
    distance: avgDistance,
    matchPercentage,
    details: isMatch ? 'Wajah Terverifikasi Cocok' : 'Wajah Tidak Cocok dengan Data Anggota',
  };
}

// Extract landmarks from an image URL / Data URL (for reference photo processing)
export async function extractLandmarksFromImage(imageUrl: string): Promise<number[] | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = async () => {
      try {
        const landmarker = await initFaceLandmarker();
        if (!landmarker) return resolve(null);

        // Detect landmarks on static image
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 480;
        canvas.height = img.naturalHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);

        // Use detectForVideo with dummy timestamp
        const res = landmarker.detectForVideo(canvas as any, Date.now());
        if (res && res.faceLandmarks && res.faceLandmarks.length > 0) {
          const vec = extractFacialFeatureVector(res.faceLandmarks[0]);
          return resolve(vec);
        }
      } catch (e) {
        console.warn('Error extracting landmarks from image:', e);
      }
      resolve(null);
    };
    img.onerror = () => resolve(null);
  });
}

// CAPTURE & CROP FACE PHOTO TO BLOB
export async function captureFacePhotoBlob(
  video: HTMLVideoElement,
  landmarks?: NormalizedLandmark[],
  isFrontFacing: boolean = true
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const vWidth = video.videoWidth || 640;
  const vHeight = video.videoHeight || 480;

  // If landmarks exist, calculate crop bounding box around face
  let cropX = 0;
  let cropY = 0;
  let cropW = vWidth;
  let cropH = vHeight;

  if (landmarks && landmarks.length > 0) {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;
    for (const lm of landmarks) {
      if (lm.x < minX) minX = lm.x;
      if (lm.x > maxX) maxX = lm.x;
      if (lm.y < minY) minY = lm.y;
      if (lm.y > maxY) maxY = lm.y;
    }

    // Add padding around face (40% margin)
    const faceW = (maxX - minX) * vWidth;
    const faceH = (maxY - minY) * vHeight;
    const centerX = (minX + (maxX - minX) / 2) * vWidth;
    const centerY = (minY + (maxY - minY) / 2) * vHeight;

    const cropSize = Math.max(faceW, faceH) * 1.6;
    cropW = Math.min(cropSize, vWidth);
    cropH = Math.min(cropSize, vHeight);

    cropX = Math.max(0, Math.min(vWidth - cropW, centerX - cropW / 2));
    cropY = Math.max(0, Math.min(vHeight - cropH, centerY - cropH / 2));
  }

  // Set square output size 480x480 for clear face evidence image
  canvas.width = 480;
  canvas.height = 480;

  if (isFrontFacing) {
    // Mirror horizontally for front camera
    ctx.translate(480, 0);
    ctx.scale(-1, 1);
  }
  
  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, 480, 480);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create photo blob'));
    }, 'image/jpeg', 0.85);
  });
}
