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
