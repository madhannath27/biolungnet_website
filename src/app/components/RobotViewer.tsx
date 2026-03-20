import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ROBOT_GLB_B64 } from "../../lib/assets";

function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const ab = new ArrayBuffer(bin.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < bin.length; i++) ia[i] = bin.charCodeAt(i);
  return ab;
}

interface GLTFResult {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

function parseGLB(buffer: ArrayBuffer): GLTFResult {
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546C67) throw new Error("Not a GLB file");
  const c0len = view.getUint32(12, true);
  const json  = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, c0len)));
  const c1off = 20 + c0len;
  let bin: ArrayBuffer | null = null;
  if (c1off < buffer.byteLength) {
    const c1len = view.getUint32(c1off, true);
    bin = buffer.slice(c1off + 8, c1off + 8 + c1len);
  }

  const tcache: Record<number, THREE.Texture> = {};
  const getTex = (i: number) => {
    if (tcache[i]) return tcache[i];
    const img = json.images[i], bv = json.bufferViews[img.bufferView];
    const bytes = new Uint8Array(bin!, bv.byteOffset || 0, bv.byteLength);
    const url = URL.createObjectURL(new Blob([bytes], { type: img.mimeType || "image/png" }));
    const t = new THREE.TextureLoader().load(url);
    t.flipY = false;
    return (tcache[i] = t);
  };
  const getAcc = (i: number) => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView];
    const off = (bv.byteOffset || 0) + (a.byteOffset || 0);
    const c = ({ SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16 } as Record<string,number>)[a.type] || 1;
    const C = ({ 5126:Float32Array,5123:Uint16Array,5121:Uint8Array,5125:Uint32Array } as Record<number,any>)[a.componentType] || Float32Array;
    return new C(bin!, off, a.count * c);
  };
  const buildMat = (md: any) => {
    if (!md) return new THREE.MeshStandardMaterial({ color: 0x39FF6A, metalness: 0.8, roughness: 0.2 });
    const pbr = md.pbrMetallicRoughness || {};
    const opts: any = {
      metalness: pbr.metallicFactor !== undefined ? pbr.metallicFactor : 1,
      roughness: pbr.roughnessFactor !== undefined ? pbr.roughnessFactor : 0.5,
    };
    if (pbr.baseColorFactor) {
      const c = pbr.baseColorFactor;
      opts.color = new THREE.Color(c[0], c[1], c[2]);
      opts.opacity = c[3] !== undefined ? c[3] : 1;
      if (opts.opacity < 1) opts.transparent = true;
    }
    if (pbr.baseColorTexture) opts.map = getTex(json.textures[pbr.baseColorTexture.index].source);
    if (pbr.metallicRoughnessTexture) opts.metalnessMap = opts.roughnessMap = getTex(json.textures[pbr.metallicRoughnessTexture.index].source);
    if (md.normalTexture) opts.normalMap = getTex(json.textures[md.normalTexture.index].source);
    if (md.emissiveFactor) { const e = md.emissiveFactor; opts.emissive = new THREE.Color(e[0], e[1], e[2]); }
    if (md.emissiveTexture) opts.emissiveMap = getTex(json.textures[md.emissiveTexture.index].source);
    return new THREE.MeshStandardMaterial(opts);
  };
  const buildMesh = (md: any) => {
    const g = new THREE.Group();
    for (const p of md.primitives) {
      const geo = new THREE.BufferGeometry(), a = p.attributes;
      if (a.POSITION !== undefined) geo.setAttribute("position", new THREE.BufferAttribute(getAcc(a.POSITION), 3));
      if (a.NORMAL !== undefined)   geo.setAttribute("normal",   new THREE.BufferAttribute(getAcc(a.NORMAL), 3));
      if (a.TEXCOORD_0 !== undefined) geo.setAttribute("uv",     new THREE.BufferAttribute(getAcc(a.TEXCOORD_0), 2));
      if (p.indices !== undefined) geo.setIndex(new THREE.BufferAttribute(getAcc(p.indices), 1));
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, buildMat(p.material !== undefined ? json.materials[p.material] : null));
      mesh.castShadow = true;
      g.add(mesh);
    }
    return g;
  };
  const buildNode = (ni: number): THREE.Object3D => {
    const nd = json.nodes[ni], obj = new THREE.Group();
    obj.name = nd.name || "n" + ni;
    if (nd.matrix) { const m = new THREE.Matrix4(); m.fromArray(nd.matrix); obj.applyMatrix4(m); }
    else {
      if (nd.translation) obj.position.fromArray(nd.translation);
      if (nd.rotation) { const q = nd.rotation; obj.quaternion.set(q[0], q[1], q[2], q[3]); }
      if (nd.scale) obj.scale.fromArray(nd.scale);
    }
    if (nd.mesh !== undefined) obj.add(buildMesh(json.meshes[nd.mesh]));
    if (nd.children) nd.children.forEach((c: number) => obj.add(buildNode(c)));
    return obj;
  };

  const result: GLTFResult = { scene: new THREE.Group(), animations: [] };
  const sd = json.scenes[json.scene || 0];
  if (sd?.nodes) sd.nodes.forEach((n: number) => result.scene.add(buildNode(n)));

  if (json.animations) {
    json.animations.forEach((ad: any) => {
      const tracks: THREE.KeyframeTrack[] = [];
      ad.channels.forEach((ch: any) => {
        const s = ad.samplers[ch.sampler];
        const times = getAcc(s.input), vals = getAcc(s.output);
        const nn = json.nodes[ch.target.node].name || "n" + ch.target.node;
        const p = ch.target.path;
        const pm = ({ translation: "position", rotation: "quaternion", scale: "scale" } as Record<string,string>)[p] || p;
        try {
          tracks.push(p === "rotation"
            ? new THREE.QuaternionKeyframeTrack(nn + "." + pm, Array.from(times), Array.from(vals))
            : new THREE.VectorKeyframeTrack(nn + "." + pm, Array.from(times), Array.from(vals)));
        } catch (_) {}
      });
      if (tracks.length) result.animations.push(new THREE.AnimationClip(ad.name || "anim", -1, tracks));
    });
  }
  return result;
}

export function RobotViewer() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef(0);
  const mouseXRef   = useRef(0);
  const mouseYRef   = useRef(0);

  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const W = container.offsetWidth, H = container.offsetHeight;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 1.2, 4.5);
    const clock  = new THREE.Clock();

    // Neon sci-fi lighting
    scene.add(new THREE.AmbientLight(0x00FFD1, 0.4));
    const key  = new THREE.DirectionalLight(0x39FF6A, 1.8); key.position.set(2, 4, 3); scene.add(key);
    const fill = new THREE.PointLight(0x00BFFF, 2.5, 10);  fill.position.set(-2, 2, 2); scene.add(fill);
    const rim  = new THREE.PointLight(0xBF5FFF, 2.0, 8);   rim.position.set(1, -1, -3); scene.add(rim);
    const bot  = new THREE.PointLight(0x39FF6A, 1.5, 6);   bot.position.set(0, -2, 1);  scene.add(bot);

    let mixer: THREE.AnimationMixer | null = null;

    // Parse and load robot
    const buffer = b64ToArrayBuffer(ROBOT_GLB_B64);
    const gltf   = parseGLB(buffer);
    const model  = gltf.scene;

    // Center and scale
    const box    = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3());
    const sc     = 2.2 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(sc);
    model.position.sub(center.multiplyScalar(sc));
    model.position.y -= 0.3;

    // Apply neon emissive tint
    model.traverse(ch => {
      if ((ch as THREE.Mesh).isMesh) {
        const mats = Array.isArray((ch as THREE.Mesh).material)
          ? (ch as THREE.Mesh).material as THREE.MeshStandardMaterial[]
          : [(ch as THREE.Mesh).material as THREE.MeshStandardMaterial];
        mats.forEach(m => { m.emissive = new THREE.Color(0x39FF6A); m.emissiveIntensity = 0.15; });
      }
    });
    scene.add(model);

    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(model);
      mixer.clipAction(gltf.animations[0]).play();
    }

    // Mouse parallax
    const onMove = (e: MouseEvent) => {
      mouseXRef.current = (e.clientX / window.innerWidth  - 0.5) * 0.4;
      mouseYRef.current = (e.clientY / window.innerHeight - 0.5) * 0.2;
    };
    document.addEventListener("mousemove", onMove);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t     = clock.getElapsedTime();
      mixer?.update(delta);
      // Auto-rotate + float + mouse parallax
      model.rotation.y = t * 0.4 + mouseXRef.current;
      model.rotation.x = Math.sin(t * 0.5) * 0.08 + mouseYRef.current * 0.3;
      model.position.y = -0.3 + Math.sin(t * 1.2) * 0.12;
      // Pulsing neon lights
      fill.intensity = 2.2 + Math.sin(t * 2) * 0.5;
      rim.intensity  = 1.8 + Math.sin(t * 1.5 + 1) * 0.4;
      camera.lookAt(0, 0.5, 0);
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const onResize = () => {
      const W2 = container.offsetWidth, H2 = container.offsetHeight;
      camera.aspect = W2 / H2; camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", zIndex: 3 }}
    />
  );
}
