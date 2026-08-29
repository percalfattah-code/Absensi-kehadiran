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
  Video
} from 'lucide-react';
import { Member, VerificationProgress, LivenessTask } from '../types';
import {
  initFaceLandmarker,
  detectFaceLandmarks,
  calculateSmileScore,
  calculateEAR,
  drawFaceLandmarks,
  captureFacePhotoBlob,
} from '../services/faceDetection';

interface CameraViewProps {
  member: Member;
  onVerificationSuccess: (photoBlob: Blob) => void;
  onCancel: () => void;
}

type FilterMode = 'CYBER_GRID' | 'SOFT_BEAUTY' | 'HIGH_CONTRAST_MONO' | 'WARM_SUNLIGHT' | 'NORMAL';

const STORAGE_KEY_FACING = 'bintang_remaja_camera_facing';
const STORAGE_KEY_DEVICE = 'bintang_remaja_camera_device_id';

export const CameraView: React.FC<CameraViewProps> = ({
  member,
  onVerificationSuccess,
  onCancel,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

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

  // Blink state machine variables
  const eyeClosedRef = useRef(false);
  const isCapturingRef = useRef(false);

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
  }, [facingMode, selectedDeviceId, stream, enumerateCameraDevices]);

  // Initial mount
  useEffect(() => {
    startCamera();
    initFaceLandmarker(); // Pre-warm MediaPipe model

    return () => {
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
            const strokeColor = filterMode === 'CYBER_GRID' ? '#3B82F6' : '#10B981';
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
  }, [isCameraReady, currentTaskIndex, livenessSequence, progress.completed, filterMode]);

  // Completion Handler with Shutter Flash Effect
  const triggerCompletion = async (video: HTMLVideoElement, landmarks?: any) => {
    if (isCapturingRef.current) return;
    isCapturingRef.current = true;

    // Trigger Shutter Flash Visual Animation
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 300);

    setProgress((prev) => ({ ...prev, completed: true }));
    setStatusMessage('Verifikasi Berhasil! Mengambil foto...');

    try {
      const isFront = facingMode === 'user';
      const blob = await captureFacePhotoBlob(video, landmarks, isFront);
      
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onVerificationSuccess(blob);
    } catch (e) {
      console.error('Photo capture error:', e);
      setCameraError('Gagal mengambil foto. Silakan coba lagi.');
      isCapturingRef.current = false;
    }
  };

  // Simulation Fallback for testing / low-light manual trigger
  const handleSimulatedVerification = async () => {
    if (!videoRef.current) return;
    isCapturingRef.current = true;
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 300);

    setProgress({
      faceDetected: true,
      singleFace: true,
      smileDetected: true,
      blinkDetected: true,
      completed: true,
    });
    setStatusMessage('Verifikasi Manual Berhasil!');

    try {
      const isFront = facingMode === 'user';
      const blob = await captureFacePhotoBlob(videoRef.current, undefined, isFront);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      onVerificationSuccess(blob);
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
      <div className="bg-blue-900 p-4 rounded-2xl border border-blue-800 flex items-center justify-between shadow-md text-white">
        <div>
          <span className="text-[11px] font-black text-amber-400 uppercase tracking-widest">Verifikasi Biometrik</span>
          <h2 className="text-base font-extrabold text-white">{member.name}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-camera device selector toggle */}
          {availableDevices.length > 1 && (
            <button
              onClick={() => setShowDevicePicker(!showDevicePicker)}
              className="p-2 bg-blue-800 hover:bg-blue-700 text-amber-300 rounded-xl border border-blue-700 transition-all text-xs font-bold flex items-center gap-1"
              title="Pilih Kamera Spasial"
            >
              <Video className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-blue-800 hover:bg-blue-700 text-blue-100 rounded-full text-xs font-bold border border-blue-700 transition-all active:scale-95"
          >
            Batal
          </button>
        </div>
      </div>

      {/* Camera Device Selector Modal Sheet */}
      <AnimatePresence>
        {showDevicePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-lg text-xs space-y-2 text-slate-800"
          >
            <div className="font-extrabold text-slate-900 text-xs mb-1">Pilih Sumber Kamera Perangkat:</div>
            <div className="space-y-1.5">
              {availableDevices.map((dev, idx) => (
                <button
                  key={dev.deviceId || idx}
                  onClick={() => handleSelectDevice(dev.deviceId)}
                  className={`w-full text-left p-2.5 rounded-xl border font-semibold flex items-center justify-between ${
                    selectedDeviceId === dev.deviceId
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-extrabold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="truncate">{dev.label || `Kamera ${idx + 1}`}</span>
                  {selectedDeviceId === dev.deviceId && <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Camera Viewport with Phone Mock Shell & Virtual Fill-Light */}
      <div className={`relative w-[310px] sm:w-[340px] h-[460px] bg-slate-950 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center mx-auto transition-all duration-300 ${
        isRingLightOn ? 'ring-8 ring-white shadow-[0_0_60px_rgba(255,255,255,0.9)]' : 'ring-4 ring-slate-200'
      }`}>
        {/* Smartphone Camera Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></div>
        </div>

        {/* Shutter White Flash Overlay */}
        <AnimatePresence>
          {isShutterFlashing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-white z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {cameraError ? (
          <div className="p-6 text-center space-y-4 max-w-xs z-20">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
            <div className="text-sm font-bold text-red-400">{cameraError}</div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => startCamera()}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-extrabold rounded-full flex items-center gap-2 mx-auto hover:bg-blue-500 transition-all shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi Kamera</span>
            </motion.button>
          </div>
        ) : (
          <>
            {/* Live Video Stream Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ filter: getFilterCss() }}
              className={`w-full h-full object-cover transition-all duration-300 ${
                facingMode === 'user' ? '-scale-x-100' : 'scale-x-100'
              }`}
            />

            {/* Landmark Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                facingMode === 'user' ? '-scale-x-100' : 'scale-x-100'
              }`}
            />

            {/* Oval Face Alignment Target Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div
                className={`relative w-52 h-68 rounded-[50%] border-4 transition-all duration-300 overflow-hidden ${
                  progress.completed
                    ? 'border-green-500 bg-green-500/15 shadow-[0_0_35px_rgba(34,197,94,0.6)]'
                    : progress.faceDetected && progress.singleFace
                    ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)]'
                    : 'border-amber-400/70 border-dashed shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                }`}
              >
                {/* Laser Biometric Scan Line Animation */}
                {isCameraReady && !progress.completed && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#FBBF24] z-20"
                  />
                )}
              </div>
            </div>

            {/* Floating Top Status Badge Prompt */}
            <div className="absolute top-8 inset-x-4 flex justify-center z-20">
              <motion.div
                key={statusMessage}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-4 py-2 rounded-full backdrop-blur-md border text-xs font-extrabold text-center shadow-lg transition-all ${
                  progress.completed
                    ? 'bg-green-600 text-white border-green-400'
                    : 'bg-blue-950/90 text-amber-300 border-blue-800'
                }`}
              >
                {currentTask === 'SMILE' && <Smile className="w-4 h-4 inline mr-1.5 text-amber-300" />}
                {currentTask === 'BLINK' && <Eye className="w-4 h-4 inline mr-1.5 text-amber-300" />}
                <span>{statusMessage}</span>
              </motion.div>
            </div>

            {/* Right Side HUD Controls: Camera Flip & Ring Light */}
            <div className="absolute right-3 top-20 z-30 flex flex-col gap-2">
              {/* Front / Back Camera Switch Button */}
              <motion.button
                whileTap={{ scale: 0.85, rotate: 180 }}
                onClick={handleToggleFacingMode}
                className="w-10 h-10 rounded-full bg-blue-950/80 backdrop-blur-md border border-blue-700/80 text-amber-400 flex items-center justify-center shadow-lg hover:bg-blue-900 transition-all"
                title={`Ganti ke Kamera ${facingMode === 'user' ? 'Belakang' : 'Depan'}`}
              >
                <SwitchCamera className="w-5 h-5" />
              </motion.button>

              {/* Virtual Ring Light / Fill Frame Toggle */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setIsRingLightOn(!isRingLightOn)}
                className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-all ${
                  isRingLightOn
                    ? 'bg-white text-slate-900 border-white ring-2 ring-amber-400'
                    : 'bg-blue-950/80 border-blue-700/80 text-blue-200 hover:text-white'
                }`}
                title="Toggle Ring Light Lampu Layar"
              >
                <Sun className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Bottom HUD Camera Mode Info Tag */}
            <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[10px] text-blue-200 font-mono bg-blue-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-blue-800/80">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Zap className="w-3 h-3" />
                <span>{facingMode === 'user' ? 'Depan' : 'Belakang'}</span>
              </span>
              <span className="truncate max-w-[150px]">{filterMode.replace('_', ' ')}</span>
            </div>
          </>
        )}
      </div>

      {/* Camera Visual Effects Filter Selector Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 px-1">
          <span className="flex items-center gap-1.5 text-blue-900">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Efek Filter Kamera</span>
          </span>
          <span className="text-slate-400 font-medium">Sentuh untuk mengubah</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold">
          {(
            [
              { id: 'CYBER_GRID', label: 'Cyber', icon: Sparkles },
              { id: 'SOFT_BEAUTY', label: 'Beauty', icon: Sun },
              { id: 'HIGH_CONTRAST_MONO', label: 'Mono', icon: ShieldCheck },
              { id: 'WARM_SUNLIGHT', label: 'Warm', icon: Smile },
              { id: 'NORMAL', label: 'Normal', icon: Camera },
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
                    ? 'bg-blue-900 text-amber-400 border-blue-800 shadow-sm font-extrabold'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{filter.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Liveness Verification Progress Checklist */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Indikator Verifikasi Biometrik</span>
        </h4>

        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              progress.faceDetected && progress.singleFace
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${
                progress.faceDetected && progress.singleFace ? 'text-green-600' : 'text-slate-300'
              }`}
            />
            <span>Wajah Terdeteksi</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              progress.smileDetected
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${progress.smileDetected ? 'text-green-600' : 'text-slate-300'}`}
            />
            <span>Senyum Terdeteksi</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              progress.blinkDetected
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${progress.blinkDetected ? 'text-green-600' : 'text-slate-300'}`}
            />
            <span>Kedipan Terdeteksi</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              progress.completed
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${progress.completed ? 'text-green-600' : 'text-slate-300'}`}
            />
            <span>Verifikasi Berhasil</span>
          </div>
        </div>

        {/* Fallback Manual Verification Button */}
        {isCameraReady && !progress.completed && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Cahaya redup / silau?</span>
            <button
              onClick={handleSimulatedVerification}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
            >
              <span>Verifikasi Manual & Ambil Foto</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
