"use client";

import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export function CameraDebug() {
  const { camera } = useThree();
  const [enabled, setEnabled] = useState(false);
  const [pose, setPose] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.has("debug"));
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setInterval(() => {
      const target = new THREE.Vector3();
      camera.getWorldDirection(target);
      target.multiplyScalar(2).add(camera.position);
      const perspective = camera as THREE.PerspectiveCamera;
      setPose(
        `position: [${camera.position.x.toFixed(3)}, ${camera.position.y.toFixed(3)}, ${camera.position.z.toFixed(3)}]\ntarget: [${target.x.toFixed(3)}, ${target.y.toFixed(3)}, ${target.z.toFixed(3)}]\nfov: ${perspective.fov.toFixed(1)}`,
      );
    }, 250);
    return () => window.clearInterval(id);
  }, [camera, enabled]);

  if (!enabled) return null;

  return (
    <Html fullscreen>
      <div className="camera-debug">
        <pre>{pose}</pre>
      </div>
    </Html>
  );
}
