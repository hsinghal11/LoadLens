import { useEffect, useState, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface MetricSnapshot {
  planId: number;
  timestamp: string;
  p50: number;
  p95: number;
  requestsPerSecond: number;
  errorRate: number;
  activeVirtualUsers: number;
}

export interface TerminalMessage {
  planId: number;
  status: "COMPLETED" | "FAILED";
}

export function useWebSocket(
  planId: number | null | undefined,
  onSnapshot: (snapshot: MetricSnapshot) => void,
  onTerminal: (message: TerminalMessage) => void
) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  
  // Use refs for callbacks to prevent re-subscriptions if callbacks change
  const snapshotRef = useRef(onSnapshot);
  const terminalRef = useRef(onTerminal);

  useEffect(() => {
    snapshotRef.current = onSnapshot;
    terminalRef.current = onTerminal;
  }, [onSnapshot, onTerminal]);

  useEffect(() => {
    if (!planId) {
      console.log("[WS] planId is null/undefined — skipping WebSocket connection");
      return;
    }

    const baseUrl = import.meta.env.VITE_WS_URL?.replace(/^ws/, 'http') || "http://localhost:8080/ws";
    const topic = `/topic/metrics/${planId}`;

    console.log(`[WS] Connecting via SockJS to: ${baseUrl}`);
    console.log(`[WS] Will subscribe to: ${topic}`);

    const client = new Client({
      webSocketFactory: () => new SockJS(baseUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: (frame) => {
        console.log("[WS] ✅ Connected via SockJS", frame);
        setConnected(true);

        const sub = client.subscribe(topic, (message) => {
          console.log("[WS] 📨 Raw message received:", message.body);
          try {
            const body = JSON.parse(message.body);
            if (body.status) {
              console.log("[WS] 🏁 Terminal message:", body);
              terminalRef.current(body);
            } else {
              console.log("[WS] 📊 Snapshot:", body);
              snapshotRef.current(body);
            }
          } catch (e) {
            console.error("[WS] ❌ Failed to parse message body:", message.body, e);
          }
        });

        console.log(`[WS] Subscribed to ${topic} — sub id: ${sub.id}`);
      },

      onDisconnect: (frame) => {
        console.warn("[WS] ⚠️ Disconnected from broker", frame);
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error("[WS] ❌ STOMP error:", frame.headers["message"]);
        console.error("[WS] Error body:", frame.body);
      },

      onWebSocketError: (event) => {
        console.error("[WS] ❌ WebSocket error event:", event);
      },

      onWebSocketClose: (event) => {
        console.warn("[WS] ⚠️ WebSocket closed:", event.code, event.reason);
        setConnected(false);
      },
    });

    console.log("[WS] Activating STOMP client…");
    client.activate();
    clientRef.current = client;

    return () => {
      console.log(`[WS] 🧹 Cleaning up WebSocket for planId=${planId}`);
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [planId]);

  return { connected };
}
