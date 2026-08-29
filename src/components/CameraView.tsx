import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Smile,
  Eye,
  ShieldCheck,
  SwitchCamera,
  Sun,
  Sparkles,
  Sliders,
  Zap,
  ChevronDown,
  Video,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react';
import { Member, VerificationProgress, LivenessTask } from '../types';
import {
  initFaceLandmarker,
  detectFaceLandmarks,
  calculateSmileScore,
  calculateEAR,
  drawFaceLandmarks,
  captureFacePhotoBlob,
  extractFacialFeatureVector,
  compareFaceLandmarkFeatures,
  extractLandmarksFromImage,
} from '../services/faceDetection';
import { audioService } from '../services/audioService';

interface CameraViewProps {
  member?: Member;
  selectedMember?: Member;
  onVerificationSuccess?: (photoBlob: Blob) => void;
  onSuccess?: (photoBlob: Blob) => void;
  onCancel: () => void;
}

type FilterMode = 'CYBER_GRID' | 'SOFT_BEAUTY' | 'HIGH_CONTRAST_MONO' | 'WARM_SUNLIGHT' | 'NORMAL';

const STORAGE_KEY_FACING = 'bintang_remaja_camera_facing';
const STORAGE_KEY_DEVICE = 'bintang_remaja_camera_device_id';

export const CameraView: React.FC<CameraViewProps> = ({
  member: propMember,
  selectedMember,
  onVerificationSuccess,
  onSuccess,
  onCancel,
}) => {
  const member = (propMember || selectedMember)!;
  const notifySuccess = onVerificationSuccess || onSuccess || (() => {});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Sound/TTS Audio Toggle
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Camerafacing mode & device list
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FACING);
    return saved === 'environment' ? 'environment' : 'user';
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_DEVICE) || '';
  });
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  // Camera Effects & Virtual Ring Light States
  const [filterMode, setFilterMode] = useState<FilterMode>('CYBER_GRID');
  const [isRingLightOn, setIsRingLightOn] = useState(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  // Liveness Verification State
  const [livenessSequence, setLivenessSequence] = useState<LivenessTask[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

  const [statusMessage, setStatusMessage] = useState('Mengaktifkan kamera biometrik...');
  const [progress, setProgress] = useState<VerificationProgress>({
    faceDetected: false,
    singleFace: false,
    smileDetected: false,
    blinkDetected: false,
    completed: false,
  });

  // Reference Face Matching State
  const isCapturingRef = useRef<boolean>(false);
  const eyeClosedRef = useRef<boolean>(false);
  const lastTaskSpokenRef = useRef<string>('');
  const hasTriggeredMismatchAlarmRef = useRef<boolean>(false);
  const consecutiveMismatchFramesRef = useRef<number>(0);
  const matchPercentageHistoryRef = useRef<number[]>([]);
  const [currentMatchScore, setCurrentMatchScore] = useState<number | null>(null);
  const [refFeatureVector, setRefFeatureVector] = useState<number[] | null>(member.faceLandmarks || null);
  const [mismatchError, setMismatchError] = useState<string | null>(null);

  // Reset mismatch alarm state and load reference vector when member changes
  useEffect(() => {
    hasTriggeredMismatchAlarmRef.current = false;
    consecutiveMismatchFramesRef.current = 0;
    matchPercentageHistoryRef.current = [];
    setCurrentMatchScore(null);
    setMismatchError(null);

    if (member.faceLandmarks && member.faceLandmarks.length > 0) {
      setRefFeatureVector(member.faceLandmarks);
    } else if (member.avatarUrl) {
      extractLandmarksFromImage(member.avatarUrl).then((vec) => {
        if (vec) setRefFeatureVector(vec);
      });
    }
  }, [member]);

  // Load available camera devices
  const enumerateCameraDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (e) {
      console.warn('Could not list media devices:', e);
    }
  }, []);

  // Generate a random liveness challenge sequence
  useEffect(() => {
    const sequences: LivenessTask[][] = [
      ['LOOK_CAMERA', 'SMILE', 'BLINK'],
      ['LOOK_CAMERA', 'BLINK', 'SMILE'],
      ['LOOK_CAMERA', 'SMILE', 'BLINK', 'SMILE'],
    ];
    const chosen = sequences[Math.floor(Math.random() * sequences.length)];
    setLivenessSequence(chosen);
    setCurrentTaskIndex(0);
  }, []);

  // Start / Restart Camera with facingMode or deviceId preference
  const startCamera = useCallback(async (overrideFacing?: 'user' | 'environment', overrideDeviceId?: string) => {
    setCameraError(null);
    setIsCameraReady(false);

    // Stop current stream tracks if running
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    const targetFacing = overrideFacing || facingMode;
    const targetDevice = overrideDeviceId !== undefined ? overrideDeviceId : selectedDeviceId;

    try {
      let videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
      };

      if (targetDevice) {
        videoConstraints.deviceId = { exact: targetDevice };
      } else {
        videoConstraints.facingMode = targetFacing;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setIsCameraReady(true);
        setStatusMessage('Posisikan wajah di dalam bingkai oval');
        
        // Voice Instruction: Posisikan wajah di tengah kamera
        if (!isSoundMuted) {
          audioService.speakLookCamera();
        }
      }

      // Save user choice to localStorage for instant re-use without re-prompts
      localStorage.setItem(STORAGE_KEY_FACING, targetFacing);
      if (targetDevice) {
        localStorage.setItem(STORAGE_KEY_DEVICE, targetDevice);
      }

      // Refresh device list now that permission is active
      enumerateCameraDevices();
    } catch (err: any) {
      console.error('Camera access error:', err);

      // Fallback if exact constraints failed
      if (targetDevice) {
        console.warn('Exact device ID constraint failed, falling back to facingMode...');
        setSelectedDeviceId('');
        localStorage.removeItem(STORAGE_KEY_DEVICE);
        startCamera(targetFacing, '');
        return;
      }

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin kamera ditolak. Silakan izinkan akses kamera di setelan browser Android Anda.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Kamera tidak ditemukan di perangkat ini.');
      } else {
        setCameraError('Gagal memuat kamera: ' + (err.message || 'Error tidak diketahui'));
      }
    }
  }, [facingMode, selectedDeviceId, stream, enumerateCameraDevices, isSoundMuted]);

  // Initial mount
  useEffect(() => {
    startCamera();
    initFaceLandmarker(); // Pre-warm MediaPipe model

    return () => {
      audioService.stopSpeaking();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Toggle Front ↔ Rear Camera
  const handleToggleFacingMode = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
    localStorage.removeItem(STORAGE_KEY_DEVICE);
    startCamera(nextFacing, '');
  };

  // Switch specific device ID
  const handleSelectDevice = (devId: string) => {
    setSelectedDeviceId(devId);
    setShowDevicePicker(false);
    startCamera(facingMode, devId);
  };

  // Trigger Indonesian Voice Prompt on Task Change
  useEffect(() => {
    if (!isCameraReady || isSoundMuted || progress.completed || mismatchError) return;
    const task = livenessSequence[currentTaskIndex];
    if (!task) return;

    if (lastTaskSpokenRef.current !== task) {
      lastTaskSpokenRef.current = task;
      if (task === 'LOOK_CAMERA') {
        audioService.speakLookCamera();
      } else if (task === 'SMILE') {
        audioService.speakSmile();
      } else if (task === 'BLINK') {
        audioService.speakBlink();
      }
    }
  }, [currentTaskIndex, livenessSequence, isCameraReady, isSoundMuted, progress.completed, mismatchError]);

  // Real-time Frame Analysis Loop
  useEffect(() => {
    if (!isCameraReady || progress.completed) return;

    let animFrameId: number;
    let lastTime = -1;

    const analyzeFrame = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        animFrameId = requestAnimationFrame(analyzeFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      const currentTime = video.currentTime;
      if (currentTime !== lastTime && canvas && ctx) {
        lastTime = currentTime;

        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const landmarksResult = detectFaceLandmarks(video, Date.now());

        if (landmarksResult && landmarksResult.faceLandmarks && landmarksResult.faceLandmarks.length > 0) {
          const numFaces = landmarksResult.faceLandmarks.length;

          if (numFaces > 1) {
            setStatusMessage('Terdeteksi >1 wajah! Pastikan hanya 1 orang di depan kamera.');
            setProgress((prev) => ({ ...prev, faceDetected: true, singleFace: false }));
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          } else {
            // Single face detected!
            const landmarks = landmarksResult.faceLandmarks[0];

            // STRICT BIOMETRIC IDENTITY VERIFICATION AGAINST REGISTERED MEMBER PHOTO
            if (refFeatureVector && refFeatureVector.length > 0) {
              const liveVector = extractFacialFeatureVector(landmarks);
              const { isMatch, matchPercentage } = compareFaceLandmarkFeatures(liveVector, refFeatureVector);

              // Maintain rolling history of last 5 frames for stable, flicker-free similarity display
              matchPercentageHistoryRef.current.push(matchPercentage);
              if (matchPercentageHistoryRef.current.length > 5) {
                matchPercentageHistoryRef.current.shift();
              }
              const smoothedPercentage = Math.round(
                matchPercentageHistoryRef.current.reduce((a, b) => a + b, 0) /
                  matchPercentageHistoryRef.current.length
              );
              setCurrentMatchScore(smoothedPercentage);

              if (!isMatch) {
                consecutiveMismatchFramesRef.current += 1;

                // Confirm mismatch after 3 consecutive frames to filter temporary landmark jitter
                if (consecutiveMismatchFramesRef.current >= 3) {
                  const errMsg = `Wajah tidak sesuai dengan foto anggota ${member.name} (${smoothedPercentage}% kecocokan)`;
                  setMismatchError(errMsg);
                  setStatusMessage(`⛔ WAJAH TIDAK SESUAI (${smoothedPercentage}% Cocok)`);

                  // Voice & Buzzer Warning: ONLY FIRES ONCE per mismatch occurrence!
                  if (!hasTriggeredMismatchAlarmRef.current) {
                    hasTriggeredMismatchAlarmRef.current = true;
                    if (!isSoundMuted) {
                      audioService.speakFaceMismatch(member.name);
                    }
                  }

                  drawFaceLandmarks(ctx, landmarks, canvas.width, canvas.height, '#F43F5E');
                  setProgress((prev) => ({ ...prev, faceDetected: true, singleFace: true }));

                  if (!isCapturingRef.current) {
                    animFrameId = requestAnimationFrame(analyzeFrame);
                  }
                  return; // BLOCK verification for different person!
                }
              } else {
                // Face matches reference identity! Reset mismatch alarm state
                consecutiveMismatchFramesRef.current = 0;
                hasTriggeredMismatchAlarmRef.current = false;
                setMismatchError(null);
              }
            }

            const strokeColor = filterMode === 'CYBER_GRID' ? '#A855F7' : '#10B981';
            drawFaceLandmarks(ctx, landmarks, canvas.width, canvas.height, strokeColor);

            setProgress((prev) => ({ ...prev, faceDetected: true, singleFace: true }));

            const activeTask = livenessSequence[currentTaskIndex];

            // 1. LOOK_CAMERA
            if (activeTask === 'LOOK_CAMERA') {
              setStatusMessage('Wajah terdeteksi ✓ Memulai verifikasi...');
              setTimeout(() => {
                setCurrentTaskIndex(1);
              }, 700);
            }
            // 2. SMILE TASK
            else if (activeTask === 'SMILE') {
              const smileScore = calculateSmileScore(landmarks);
              setStatusMessage('Silakan tersenyum 😊');

              if (smileScore > 0.45) {
                setProgress((prev) => ({ ...prev, smileDetected: true }));
                if (currentTaskIndex < livenessSequence.length - 1) {
                  setCurrentTaskIndex((idx) => idx + 1);
                } else {
                  triggerCompletion(video, landmarks);
                }
              }
            }
            // 3. BLINK TASK
            else if (activeTask === 'BLINK') {
              const { avgEAR } = calculateEAR(landmarks);
              setStatusMessage('Silakan berkedip 👁️');

              if (avgEAR < 0.17) {
                eyeClosedRef.current = true;
              } else if (eyeClosedRef.current && avgEAR > 0.22) {
                eyeClosedRef.current = false;
                setProgress((prev) => ({ ...prev, blinkDetected: true }));

                if (currentTaskIndex < livenessSequence.length - 1) {
                  setCurrentTaskIndex((idx) => idx + 1);
                } else {
                  triggerCompletion(video, landmarks);
                }
              }
            }
          }
        } else {
          // No face detected
          setStatusMessage('Wajah belum terdeteksi. Posisikan di depan kamera.');
          setProgress((prev) => ({ ...prev, faceDetected: false, singleFace: false }));
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      if (!isCapturingRef.current) {
        animFrameId = requestAnimationFrame(analyzeFrame);
      }
    };

    animFrameId = requestAnimationFrame(analyzeFrame);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isCameraReady, currentTaskIndex, livenessSequence, progress.completed, filterMode, refFeatureVector, member.name, isSoundMuted]);

  // Completion Handler with Shutter Flash & Harmonic Success Chime + Voice
  const triggerCompletion = async (video: HTMLVideoElement, landmarks?: any) => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    // Trigger Shutter Sound & Flash Visual Animation
    audioService.playCameraShutter();
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 300);

    setProgress((prev) => ({ ...prev, completed: true }));
    setStatusMessage('Verifikasi Berhasil! Mengambil foto...');

    // Play Success Chime & Indonesian TTS Greeting
    if (!isSoundMuted) {
      audioService.speakSuccess(member.name);
    }

    try {
      const isFront = facingMode === 'user';
      const blob = await captureFacePhotoBlob(video, landmarks, isFront);
      
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setTimeout(() => {
        notifySuccess(blob);
      }, 600);
    } catch (e) {
      console.error('Photo capture error:', e);
      setCameraError('Gagal mengambil foto. Silakan coba lagi.');
      isCapturingRef.current = false;
    }
  };

  // Simulation Fallback for testing / low-light manual trigger (blocked if mismatch detected)
  const handleSimulatedVerification = async () => {
    if (!videoRef.current) return;
    if (mismatchError) {
      alert(`Verifikasi ditolak! Wajah Anda tidak sesuai dengan data anggota ${member.name}. Silakan gunakan wajah anggota yang benar.`);
      return;
    }

    isCapturingRef.current = true;
    audioService.playCameraShutter();
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 300);

    setProgress({
      faceDetected: true,
      singleFace: true,
      smileDetected: true,
      blinkDetected: true,
      completed: true,
    });
    setStatusMessage('Verifikasi Berhasil!');

    if (!isSoundMuted) {
      audioService.speakSuccess(member.name);
    }

    try {
      const isFront = facingMode === 'user';
      const blob = await captureFacePhotoBlob(videoRef.current, undefined, isFront);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setTimeout(() => {
        notifySuccess(blob);
      }, 500);
    } catch (e) {
      setCameraError('Gagal mengambil foto snapshot.');
      isCapturingRef.current = false;
    }
  };

  const currentTask = livenessSequence[currentTaskIndex];

  // Map Filter Mode to CSS Filter string
  const getFilterCss = () => {
    switch (filterMode) {
      case 'SOFT_BEAUTY':
        return 'brightness(1.08) contrast(1.04) saturate(1.1) blur(0.2px)';
      case 'HIGH_CONTRAST_MONO':
        return 'grayscale(100%) contrast(135%) brightness(1.05)';
      case 'WARM_SUNLIGHT':
        return 'sepia(18%) brightness(1.06) saturate(1.15)';
      case 'CYBER_GRID':
        return 'contrast(115%) saturate(1.15)';
      case 'NORMAL':
      default:
        return 'none';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 max-w-md mx-auto pb-24"
    >
      {/* Top Header Card */}
      <div className="card-3d p-4 flex items-center justify-between shadow-md text-white border-violet-400/50">
        <div>
          <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            VERIFIKASI BIOMETRIK WAJAH
          </span>
          <h2 className="text-base font-black text-white">{member.name}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound / TTS Voice Guide Toggle */}
          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              isSoundMuted
                ? 'btn-3d-dark text-violet-400'
                : 'btn-3d-violet text-amber-300'
            }`}
            title={isSoundMuted ? 'Nyalakan Suara Panduan TTS' : 'Matikan Suara TTS'}
          >
            {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
          </button>

          {/* Multi-camera device selector toggle */}
          {availableDevices.length > 1 && (
            <button
              onClick={() => setShowDevicePicker(!showDevicePicker)}
              className="p-2 btn-3d-dark text-amber-300 rounded-xl transition-all text-xs font-bold flex items-center gap-1"
              title="Pilih Kamera"
            >
              <Video className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={() => {
              audioService.stopSpeaking();
              onCancel();
            }}
            className="px-3.5 py-1.5 btn-3d-rose text-white rounded-xl text-xs font-bold transition-all"
          >
            Batal
          </button>
        </div>
      </div>

      {/* Camera Device Picker Dropdown Modal */}
      <AnimatePresence>
        {showDevicePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card-3d-subtle p-4 text-xs space-y-2 text-white"
          >
            <div className="font-extrabold text-violet-200 text-xs mb-1">Pilih Sumber Kamera:</div>
            <div className="space-y-1.5">
              {availableDevices.map((dev, idx) => (
                <button
                  key={dev.deviceId || idx}
                  onClick={() => handleSelectDevice(dev.deviceId)}
                  className={`w-full text-left p-2.5 rounded-xl border font-semibold flex items-center justify-between ${
                    selectedDeviceId === dev.deviceId
                      ? 'bg-violet-900 border-amber-400 text-white font-extrabold'
                      : 'bg-[#110526] hover:bg-violet-950 border-violet-800 text-violet-300'
                  }`}
                >
                  <span className="truncate">{dev.label || `Kamera ${idx + 1}`}</span>
                  {selectedDeviceId === dev.deviceId && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Camera Viewport with 3D Cyber Shell & Virtual Fill-Light */}
      <div className={`relative w-[310px] sm:w-[340px] h-[460px] bg-[#0c0417] rounded-[2.5rem] border-[6px] border-[#220c3d] shadow-[0_12px_0_0_#140526,0_25px_35px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center mx-auto transition-all duration-300 ${
        isRingLightOn ? 'ring-8 ring-amber-300 shadow-[0_0_60px_rgba(251,191,36,0.8)]' : 'ring-2 ring-violet-500/40'
      }`}>
        {/* Smartphone Camera Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-[#17072c] rounded-b-xl z-30 flex items-center justify-center border-b border-violet-800/60">
          <div className="w-3 h-3 rounded-full bg-[#0d041a] border border-violet-600/50"></div>
        </div>

        {/* Shutter White Flash Overlay */}
        <AnimatePresence>
          {isShutterFlashing && (
            <motion.div
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 bg-white z-40 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {cameraError ? (
          <div className="p-6 text-center space-y-4 max-w-xs z-20">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
            <div className="text-sm font-bold text-rose-300">{cameraError}</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => startCamera()}
              className="px-4 py-2 btn-3d-violet text-white text-xs font-extrabold rounded-full flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi Kamera</span>
            </motion.button>
          </div>
        ) : (
          <>
            {/* Live Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{ filter: getFilterCss() }}
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Landmarks Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Oval Face Alignment Target Frame with 3D glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                className={`relative w-52 h-68 rounded-[50%] border-4 transition-all duration-300 overflow-hidden ${
                  mismatchError
                    ? 'border-rose-500 bg-rose-500/25 shadow-[0_0_40px_rgba(244,63,94,0.9)] animate-pulse'
                    : progress.completed
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.8)]'
                    : progress.faceDetected && progress.singleFace
                    ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.6)]'
                    : 'border-violet-400/70 border-dashed shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                }`}
              >
                {/* Laser Biometric Scan Line Animation */}
                {!progress.completed && !mismatchError && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_15px_#FBBF24] z-20"
                  />
                )}
              </div>
            </div>

            {/* Live Instruction Pill Banner */}
            <div className="absolute top-8 left-4 right-4 z-20 flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-4 py-2 rounded-2xl backdrop-blur-md border text-xs font-black text-center shadow-lg transition-all max-w-[90%] ${
                  mismatchError
                    ? 'bg-rose-950/95 text-rose-200 border-rose-500 shadow-rose-950/60'
                    : progress.completed
                    ? 'bg-emerald-950/95 text-emerald-300 border-emerald-400'
                    : 'bg-[#15072d]/95 text-amber-300 border-violet-600/80 shadow-[0_4px_12px_rgba(0,0,0,0.5)]'
                }`}
              >
                {mismatchError ? (
                  <div className="flex items-center gap-1.5 justify-center">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{statusMessage}</span>
                  </div>
                ) : (
                  <>
                    {currentTask === 'SMILE' && <Smile className="w-4 h-4 inline mr-1.5 text-amber-300" />}
                    {currentTask === 'BLINK' && <Eye className="w-4 h-4 inline mr-1.5 text-amber-300" />}
                    {currentTask === 'LOOK_CAMERA' && <Camera className="w-4 h-4 inline mr-1.5 text-amber-300" />}
                    <span>{statusMessage}</span>
                  </>
                )}
              </motion.div>
            </div>

            {/* Right Side HUD Controls: Camera Flip & Ring Light */}
            <div className="absolute right-3 top-20 z-30 flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.85, rotate: 180 }}
                onClick={handleToggleFacingMode}
                className="w-10 h-10 rounded-2xl bg-violet-950/90 backdrop-blur-md border border-violet-500/60 text-amber-300 flex items-center justify-center shadow-lg hover:bg-violet-900 transition-all"
                title={`Ganti ke Kamera ${facingMode === 'user' ? 'Belakang' : 'Depan'}`}
              >
                <SwitchCamera className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setIsRingLightOn(!isRingLightOn)}
                className={`w-10 h-10 rounded-2xl backdrop-blur-md border flex items-center justify-center shadow-lg transition-all ${
                  isRingLightOn
                    ? 'bg-amber-400 text-purple-950 border-white ring-2 ring-amber-300'
                    : 'bg-violet-950/90 border-violet-500/60 text-violet-200 hover:text-white'
                }`}
                title="Toggle Ring Light Lampu Layar"
              >
                <Sun className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Bottom HUD Camera Mode Info Tag */}
            <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[10px] text-violet-200 font-mono bg-[#14062a]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-violet-700/80">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Zap className="w-3 h-3" />
                <span>{facingMode === 'user' ? 'Depan' : 'Belakang'}</span>
              </span>
              <span className="text-violet-300">
                {isSoundMuted ? '🔇 Audio Mute' : '🔊 TTS Aktif'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Mismatch Alert Box if Rejected */}
      {mismatchError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 text-xs space-y-2 shadow-lg"
        >
          <div className="flex items-center gap-2 font-black text-rose-300 text-sm">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>Verifikasi Wajah Ditolak</span>
          </div>
          <p className="leading-relaxed">
            {mismatchError}. Absensi hanya dapat diselesaikan oleh pemilik wajah yang sesuai dengan database profil.
          </p>
          <div className="text-[11px] text-rose-400 font-medium">
            Silakan minta anggota bersangkutan (<span className="font-bold text-white">{member.name}</span>) berada di depan kamera.
          </div>
        </motion.div>
      )}

      {/* Camera Visual Effects Filter Selector Bar in 3D Card */}
      <div className="card-3d-subtle p-3 space-y-2 text-white">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-violet-300 px-1">
          <span className="flex items-center gap-1.5 text-white">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Efek Filter Kamera</span>
          </span>
          <span className="text-violet-400 font-medium text-[10px]">Pilih gaya tampilan</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold">
          {(
            [
              { id: 'CYBER_GRID', label: 'Cyber', icon: Sparkles },
              { id: 'SOFT_BEAUTY', label: 'Beauty', icon: Sun },
              { id: 'HIGH_CONTRAST_MONO', label: 'Mono', icon: Zap },
              { id: 'WARM_SUNLIGHT', label: 'Warm', icon: Sun },
              { id: 'NORMAL', label: 'Asli', icon: Camera },
            ] as const
          ).map((filter) => {
            const Icon = filter.icon;
            const isActive = filterMode === filter.id;
            return (
              <motion.button
                key={filter.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => setFilterMode(filter.id)}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'btn-3d-violet text-amber-300 shadow-md font-black'
                    : 'btn-3d-dark text-violet-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-violet-400'}`} />
                <span>{filter.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Liveness Verification Progress Checklist in 3D Card */}
      <div className="card-3d-subtle p-4 space-y-3 text-white">
        <h4 className="text-xs font-black text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Indikator Verifikasi Biometrik</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              progress.faceDetected && progress.singleFace && !mismatchError
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-[#110526] border-violet-800/60 text-violet-500'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${
                progress.faceDetected && progress.singleFace && !mismatchError ? 'text-emerald-400' : 'text-violet-700'
              }`}
            />
            <span>Wajah Terdeteksi</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between gap-1.5 transition-all ${
              refFeatureVector && !mismatchError && progress.faceDetected
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : mismatchError
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                : 'bg-[#110526] border-violet-800/60 text-violet-500'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  refFeatureVector && !mismatchError && progress.faceDetected
                    ? 'text-emerald-400'
                    : mismatchError
                    ? 'text-rose-400'
                    : 'text-violet-700'
                }`}
              />
              <span className="truncate">Kecocokan Identitas</span>
            </div>
            {currentMatchScore !== null && progress.faceDetected && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                !mismatchError
                  ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-900/80 text-rose-300 border border-rose-500/40'
              }`}>
                {currentMatchScore}%
              </span>
            )}
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              progress.smileDetected
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-[#110526] border-violet-800/60 text-violet-500'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${progress.smileDetected ? 'text-emerald-400' : 'text-violet-700'}`}
            />
            <span>Senyum Terdeteksi</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              progress.blinkDetected
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-[#110526] border-violet-800/60 text-violet-500'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${progress.blinkDetected ? 'text-emerald-400' : 'text-violet-700'}`}
            />
            <span>Kedipan Terdeteksi</span>
          </div>
        </div>

        {/* Fallback Manual Verification Button (Disabled if mismatch detected) */}
        {isCameraReady && !progress.completed && !mismatchError && (
          <div className="pt-2 border-t border-violet-800/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-violet-400 font-medium">Cahaya redup?</span>
            <button
              onClick={handleSimulatedVerification}
              className="text-xs font-black text-amber-300 hover:text-amber-200 underline flex items-center gap-1"
            >
              <span>Verifikasi Manual & Jepret</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
