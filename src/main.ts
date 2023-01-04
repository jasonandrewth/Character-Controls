// External dependencies.
import { CharacterControls } from "./characterControls";
import * as THREE from "three";
import "./index.css";
// import { CameraHelper } from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import nipplejs from "nipplejs";

// load shaders
//@ts-ignore
import overlayVertexShader from "./GLSL/Overlay/overlay.v.glsl?raw";
//@ts-ignore
import overlayFragmentShader from "./GLSL/Overlay/overlay.f.glsl?raw";

/*******************************************************************************
 * Main Code
 ******************************************************************************/

/**
 * Setup
 */

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * DOM ELEMENTS
 */
// Canvas
const canvas = document.querySelector("canvas.webgl") as HTMLCanvasElement;
//Loading Bar
const loadingBarElement: HTMLDivElement | null =
  document.querySelector(".loading-bar");
//Joystick
const joystickZone = document.querySelector(".zone");

/**
 * Loaders
 */
const loadingManager = new THREE.LoadingManager(
  // Loaded
  () => {
    window.setTimeout(() => {
      const interval = setInterval(decreaseAlpha, 30); //Call increaseMyVar every 30ms

      if (loadingBarElement) {
        // loadingBarElement.style.opacity = "0";
        loadingBarElement.classList.add("ended");
        loadingBarElement.style.transform = "";
      }
    }, 500);

    console.log("loaded");
    console.log(overlayMaterial.uniforms.uAlpha);

    const interval = setInterval(decreaseAlpha, 60); //Call increaseMyVar every 30ms

    function decreaseAlpha() {
      console.log("called");
      if (overlayMaterial.uniforms.uAlpha.value > 0) {
        overlayMaterial.uniforms.uAlpha.value =
          overlayMaterial.uniforms.uAlpha.value - 0.1;
      } else {
        clearInterval(interval);
      }

      return;
    }
  },

  // Progress
  (itemUrl, itemsLoaded, itemsTotal) => {
    const progressRatio = itemsLoaded / itemsTotal;
    console.log(progressRatio);

    if (loadingBarElement) {
      loadingBarElement.style.transform = `scaleX(${progressRatio})`;
    }
  }
);

const textureLoader = new THREE.TextureLoader(loadingManager);
const cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);

// SCENE
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xa8def0);

scene.background = cubeTextureLoader.load([
  "assets/background/Cold_Sunset__Cam_2_Left+X.png",
  "assets/background/Cold_Sunset__Cam_3_Right-X.png",
  "assets/background/Cold_Sunset__Cam_4_Up+Y.png",
  "assets/background/Cold_Sunset__Cam_5_Down-Y.png",
  "assets/background/Cold_Sunset__Cam_0_Front+Z.png",
  "assets/background/Cold_Sunset__Cam_1_Back-Z.png",
]);

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// ORBIT CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

//JOYSTICK
const joystick = nipplejs.create({
  zone: joystickZone as HTMLElement,
  color: "blue",
  multitouch: true,
});

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1);

const overlayMaterial = new THREE.ShaderMaterial({
  wireframe: false,
  transparent: true,
  vertexShader: overlayVertexShader,
  fragmentShader: overlayFragmentShader,
  uniforms: {
    uAlpha: { value: 1 },
  },
});

const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

// LIGHTS
light();

// FLOOR
generateFloor();

/**
 * MODEL WITH ANIMATIONS
 */
let characterControls: CharacterControls;

gltfLoader.load("assets/models/Soldier.glb", function (gltf) {
  const model = gltf.scene;
  model.traverse(function (object: any) {
    if (object.isMesh) object.castShadow = true;
  });
  scene.add(model);

  const gltfAnimations: THREE.AnimationClip[] = gltf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animationsMap: Map<string, THREE.AnimationAction> = new Map();
  gltfAnimations
    .filter((a) => a.name != "TPose")
    .forEach((a: THREE.AnimationClip) => {
      animationsMap.set(a.name, mixer.clipAction(a));
    });

  characterControls = new CharacterControls(
    model,
    mixer,
    animationsMap,
    orbitControls,
    camera,
    "Idle"
  );
});

/**
 * Key Control
 */

type KeyPressOBJ = {
  key0?: string;
  key1?: boolean;
  key2?: boolean;
  key3?: boolean;
};

const keysPressed: KeyPressOBJ = {};

document.addEventListener(
  "keydown",
  (event) => {
    if (event.shiftKey && characterControls) {
      characterControls.switchRunToggle();
    } else {
      (keysPressed as any)[event.key.toLowerCase()] = true;
    }
  },
  false
);
document.addEventListener(
  "keyup",
  (event) => {
    (keysPressed as any)[event.key.toLowerCase()] = false;
  },
  false
);

joystick.on("move", function (evt, data) {
  console.log(data.force);
  const dirData = data.direction;

  // if (data.force > 1.5) {
  //   characterControls.switchRunToggle();
  // }

  if (dirData) {
    if (dirData.angle === "down") {
      console.log("Down");
      for (const [key, value] of Object.entries(keysPressed)) {
        (keysPressed as any)[key] = false;
      }
      (keysPressed as any)["s"] = true;
    }
    if (dirData.angle === "up") {
      console.log("Up");
      for (const [key, value] of Object.entries(keysPressed)) {
        (keysPressed as any)[key] = false;
      }
      (keysPressed as any)["w"] = true;
    }

    if (dirData.angle === "right") {
      for (const [key, value] of Object.entries(keysPressed)) {
        (keysPressed as any)[key] = false;
      }
      if (dirData.y === "up") {
        console.log("Up right");
        (keysPressed as any)["w"] = true;
        (keysPressed as any)["d"] = true;
      } else if (dirData.y === "down") {
        console.log("down right");
        (keysPressed as any)["s"] = true;
        (keysPressed as any)["d"] = true;
      } else {
        console.log("Right");
        (keysPressed as any)["d"] = true;
      }
    }
    if (dirData.angle === "left") {
      for (const [key, value] of Object.entries(keysPressed)) {
        (keysPressed as any)[key] = false;
      }
      if (dirData.y === "up") {
        console.log("Up Left");
        (keysPressed as any)["w"] = true;
        (keysPressed as any)["a"] = true;
      } else if (dirData.y === "down") {
        console.log("down left");
        (keysPressed as any)["s"] = true;
        (keysPressed as any)["a"] = true;
      } else {
        console.log("Left");
        (keysPressed as any)["a"] = true;
      }
    }
  }
});

joystick.on("end", () => {
  for (const [key, value] of Object.entries(keysPressed)) {
    (keysPressed as any)[key] = false;
  }
});

/**
 * Resize Handler
 */

const onWindowResize = () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
};

window.addEventListener("resize", onWindowResize);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  // const elapsedTime = clock.getElapsedTime();
  let mixerUpdateDelta = clock.getDelta();
  if (characterControls) {
    characterControls.update(mixerUpdateDelta, keysPressed);
  }

  // Update orbit controls
  orbitControls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * Generate Floor and Light
 */

function generateFloor() {
  // TEXTURES
  const placeholder = textureLoader.load(
    "assets/textures/placeholder/placeholder.png"
  );
  const sandBaseColor = textureLoader.load(
    "assets/textures/sand/Sand 002_COLOR.jpg"
  );
  const sandNormalMap = textureLoader.load(
    "assets/textures/sand/Sand 002_NRM.jpg"
  );
  const sandHeightMap = textureLoader.load(
    "assets/textures/sand/Sand 002_DISP.jpg"
  );
  const sandAmbientOcclusion = textureLoader.load(
    "assets/textures/sand/Sand 002_OCC.jpg"
  );

  const WIDTH = 420;
  const LENGTH = 420;

  const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 1024, 1024);
  const material = new THREE.MeshStandardMaterial({
    map: sandBaseColor,
    normalMap: sandNormalMap,
    displacementMap: sandHeightMap,
    displacementScale: 0.1,
    aoMap: sandAmbientOcclusion,
  });
  wrapAndRepeatTexture(material.map!);
  wrapAndRepeatTexture(material.normalMap!);
  wrapAndRepeatTexture(material.displacementMap!);
  wrapAndRepeatTexture(material.aoMap!);
  // const material = new THREE.MeshPhongMaterial({ map: placeholder})

  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
}

function wrapAndRepeatTexture(map: THREE.Texture) {
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.x = map.repeat.y = 10;
}

function light() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const pointLight = new THREE.PointLight(0xff0000, 0.5);
  pointLight.position.set(0, 0.2, 0);
  scene.add(pointLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(-60, 100, -10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -50;
  dirLight.shadow.camera.left = -50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
  // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}
