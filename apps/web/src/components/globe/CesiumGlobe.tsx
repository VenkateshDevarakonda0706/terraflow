'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium';
}

let cesiumPromise: Promise<any> | null = null;
const thumbnailCache = new Map<string, Promise<HTMLCanvasElement>>();

function loadCesium() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Cesium requires a browser'));
  if ((window as any).Cesium) return Promise.resolve((window as any).Cesium);
  if (cesiumPromise) return cesiumPromise;

  cesiumPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-terraflow-cesium]');
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).Cesium), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Cesium')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = '/cesium/Cesium.js';
    script.async = true;
    script.dataset.terraflowCesium = 'true';
    script.addEventListener('load', () => resolve((window as any).Cesium), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load Cesium')), { once: true });
    document.head.appendChild(script);
  });

  return cesiumPromise;
}

function createMemoryThumbnail(url: string): Promise<HTMLCanvasElement> {
  const cached = thumbnailCache.get(url);
  if (cached) return cached;

  const promise = new Promise<HTMLCanvasElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const size = 76;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.shadowColor = 'rgba(139, 92, 246, 0.75)';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 31, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139, 92, 246, 0.85)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 28, 0, Math.PI * 2);
      ctx.clip();
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
      ctx.restore();

      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 29, 0, Math.PI * 2);
      ctx.stroke();

      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.95)';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 34, 0, Math.PI * 2);
      ctx.stroke();

      resolve(canvas);
    };
    image.onerror = () => reject(new Error(`Failed to load memory image: ${url}`));
    image.src = url;
  });

  thumbnailCache.set(url, promise);
  return promise;
}

export interface GlobePin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  imageUrl?: string;
  count?: number;
}

export interface CesiumGlobeHandle {
  flyTo: (lat: number, lng: number, altitude?: number) => void;
}

interface Props {
  pins?: GlobePin[];
  onPinClick?: (id: string) => void;
  onGlobeClick?: (lat: number, lng: number) => void;
  isGuest?: boolean;
}

const CesiumGlobe = forwardRef<CesiumGlobeHandle, Props>(function CesiumGlobe(
  { pins = [], onPinClick, onGlobeClick, isGuest = false },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const entityMap    = useRef<Map<string, any>>(new Map());
  const handlerRef   = useRef<any>(null);
  const rafRef       = useRef<number>(0);
  const pinsRef      = useRef<GlobePin[]>(pins);

  pinsRef.current = pins;

  function syncPins(Cesium: any, viewer: any, nextPins: GlobePin[]) {
    entityMap.current.forEach((entity, id) => {
      if (!nextPins.find(pin => pin.id === id)) {
        viewer.entities.remove(entity);
        entityMap.current.delete(id);
      }
    });

    nextPins.forEach(pin => {
      if (entityMap.current.has(pin.id)) return;

      const label = pin.count && pin.count > 1 ? `${pin.count}` : pin.title?.slice(0, 18) || '';
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(pin.lng, pin.lat, pin.imageUrl ? 70000 : 0),
        billboard: {
          image: '/pin.svg',
          width: pin.imageUrl ? 72 : pin.count && pin.count > 1 ? 44 : 36,
          height: pin.imageUrl ? 72 : pin.count && pin.count > 1 ? 44 : 36,
          verticalOrigin: pin.imageUrl ? Cesium.VerticalOrigin.CENTER : Cesium.VerticalOrigin.BOTTOM,
          heightReference: pin.imageUrl ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        point: pin.imageUrl ? {
          pixelSize: 84,
          color: Cesium.Color.fromCssColorString('rgba(139, 92, 246, 0.22)'),
          outlineColor: Cesium.Color.fromCssColorString('rgba(255, 255, 255, 0.32)'),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        } : undefined,
        label: {
          text: label,
          font: '11px system-ui',
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          outlineColor: Cesium.Color.BLACK,
          fillColor: Cesium.Color.WHITE,
          verticalOrigin: Cesium.VerticalOrigin.TOP,
          pixelOffset: new Cesium.Cartesian2(0, 4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        properties: new Cesium.PropertyBag({ postId: pin.id }),
      });

      entityMap.current.set(pin.id, entity);

      if (pin.imageUrl) {
        createMemoryThumbnail(pin.imageUrl)
          .then(canvas => {
            if (!entityMap.current.has(pin.id) || !entity.billboard) return;
            entity.billboard.image = canvas;
          })
          .catch(() => {});
      }
    });
  }

  // Expose flyTo via ref
  useImperativeHandle(ref, () => ({
    flyTo(lat: number, lng: number, altitude = 800000) {
      if (!viewerRef.current) return;
      loadCesium().then(({ Cartesian3 }) => {
        viewerRef.current.camera.flyTo({
          destination: Cartesian3.fromDegrees(lng, lat, altitude),
          duration: 1.8,
        });
      });
    },
  }));

  // Initialize Cesium once
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    let mounted = true;

    loadCesium().then(Cesium => {
      if (!mounted || !containerRef.current || viewerRef.current) return;

      try {
        const creditDiv = document.createElement('div');
        const viewer = new Cesium.Viewer(containerRef.current!, {
          geocoder: false, homeButton: false, sceneModePicker: false,
          baseLayerPicker: false, navigationHelpButton: false,
          animation: false, timeline: false, fullscreenButton: false,
          infoBox: false, selectionIndicator: false,
          shouldAnimate: true,
          creditContainer: creditDiv,
        });

        viewer.resolutionScale = Math.min(window.devicePixelRatio || 1, 1.6);
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.showGroundAtmosphere = true;
        if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true;
        if (viewer.scene.fog) {
          viewer.scene.fog.enabled = true;
          viewer.scene.fog.density = 0.00018;
        }
        viewer.scene.highDynamicRange = true;
        viewer.scene.postProcessStages.fxaa.enabled = true;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        viewer.scene.screenSpaceCameraController.inertiaSpin = 0.92;
        viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.88;
        viewer.scene.screenSpaceCameraController.inertiaZoom = 0.82;
        viewer.scene.screenSpaceCameraController.minimumZoomDistance = 45000;
        viewer.scene.screenSpaceCameraController.maximumZoomDistance = 18000000;
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(-88, 33, 9800000),
          orientation: {
            heading: Cesium.Math.toRadians(350),
            pitch: Cesium.Math.toRadians(-62),
            roll: 0,
          },
        });
        viewerRef.current = viewer;
        syncPins(Cesium, viewer, pinsRef.current);

        // Click handler — distinguishes pin clicks from globe clicks
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handlerRef.current = handler;

        handler.setInputAction((click: any) => {
          const picked = viewer.scene.pick(click.position);

          if (Cesium.defined(picked) && picked.id) {
            // Clicked an entity (pin)
            const entity = picked.id;
            const postId = entity.properties?.postId?.getValue();
            if (postId && onPinClick) {
              onPinClick(postId);
              return;
            }
          }

          // Clicked the globe itself
          const cartesian = viewer.camera.pickEllipsoid(
            click.position,
            viewer.scene.globe.ellipsoid,
          );
          if (cartesian && onGlobeClick) {
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(carto.latitude);
            const lng = Cesium.Math.toDegrees(carto.longitude);
            onGlobeClick(lat, lng);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // Slow rotation when guest
        if (isGuest) {
          let last = Date.now();
          const spin = () => {
            if (!viewerRef.current) return;
            const now = Date.now();
            viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, ((now - last) / 1000) * 0.04);
            last = now;
            rafRef.current = requestAnimationFrame(spin);
          };
          rafRef.current = requestAnimationFrame(spin);
        }
      } catch (err) {
        console.warn('[CesiumGlobe] init error:', err);
      }
    }).catch(err => {
      console.warn('[CesiumGlobe] load error:', err);
    });

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      handlerRef.current?.destroy();
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch (_) {}
        viewerRef.current = null;
      }
    };
  }, []);

  // Sync pins whenever they change
  useEffect(() => {
    if (!viewerRef.current) return;
    loadCesium().then(Cesium => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      syncPins(Cesium, viewer, pins);
    }).catch(() => {});
  }, [pins]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#050510' }} />
  );
});

export default CesiumGlobe;
