import { useCallback, useEffect, useRef, useState } from 'react';

export type WhepStatus = 'connecting' | 'live' | 'retrying' | 'error';

// Relative and same-origin (HTTPS) — proxied to MediaMTX (plain HTTP) by the
// dev server, since a direct browser request to a non-TLS host from an HTTPS
// page is either blocked as mixed content or fails the TLS handshake outright.
function buildWhepUrl(streamPath: string): string {
  return `/whep/${streamPath}/whep`;
}

export function useWhepStream(streamPath: string) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<WhepStatus>('connecting');
  const [reconnectNonce, setReconnectNonce] = useState(0);

  const reconnect = useCallback(() => setReconnectNonce((n) => n + 1), []);

  useEffect(() => {
    let pc: RTCPeerConnection | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const whepUrl = buildWhepUrl(streamPath);

    async function connect() {
      if (cancelled || !whepUrl) {
        setStatus('error');
        return;
      }
      setStatus('connecting');
      try {
        pc = new RTCPeerConnection();
        pc.ontrack = (event) => {
          if (videoRef.current) videoRef.current.srcObject = event.streams[0];
          setStatus('live');
        };
        // ANPR cameras are video-only — no microphone hardware, so we don't
        // negotiate an audio transceiver.
        pc.addTransceiver('video', { direction: 'recvonly' });

        pc.oniceconnectionstatechange = () => {
          if (pc && ['failed', 'disconnected', 'closed'].includes(pc.iceConnectionState)) {
            scheduleRetry(3000);
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await new Promise<void>((resolve) => {
          if (!pc || pc.iceGatheringState === 'complete') return resolve();
          const check = () => {
            if (pc && pc.iceGatheringState === 'complete') {
              pc.removeEventListener('icegatheringstatechange', check);
              resolve();
            }
          };
          pc.addEventListener('icegatheringstatechange', check);
        });

        const res = await fetch(whepUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription?.sdp,
        });
        if (!res.ok) throw new Error(`WHEP request failed: ${res.status}`);
        const answerSdp = await res.text();
        await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
      } catch {
        scheduleRetry(5000);
      }
    }

    function scheduleRetry(delayMs: number) {
      if (cancelled) return;
      pc?.close();
      pc = null;
      setStatus('retrying');
      retryTimer = setTimeout(connect, delayMs);
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      pc?.close();
    };
  }, [streamPath, reconnectNonce]);

  return { videoRef, status, reconnect };
}
