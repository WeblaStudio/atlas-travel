import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DESTINATIONS = [
  { id: "iran", name: "ایران", region: "LAND OF STORIES", lat: 35.6892, lon: 51.389, season: "بهار و پاییز", description: "از کوچه‌های تاریخی تا کوهستان‌های بلند؛ سفری میان رنگ، معماری و مهمان‌نوازی.", image: "assets/images/iran.jpg", accent: "#d9b477", glow: "rgba(217,180,119,.22)" },
  { id: "italy", name: "ایتالیا", region: "LA DOLCE VITA", lat: 41.9028, lon: 12.4964, season: "آوریل تا ژوئن", description: "شهرهای سنگی، هنر بی‌زمان و عصرهایی که انگار برای آهسته زندگی‌کردن ساخته شده‌اند.", image: "assets/images/italy.jpg", accent: "#c8b178", glow: "rgba(200,177,120,.2)" },
  { id: "japan", name: "ژاپن", region: "BETWEEN WORLDS", lat: 35.6762, lon: 139.6503, season: "بهار و پاییز", description: "سکوت باغ‌های سنتی در کنار ریتم پرنور شهر؛ جایی میان گذشته و آینده.", image: "assets/images/japan.jpg", accent: "#e7a5b5", glow: "rgba(231,165,181,.2)" },
  { id: "iceland", name: "ایسلند", region: "EDGE OF THE EARTH", lat: 64.1466, lon: -21.9426, season: "ژوئن تا سپتامبر", description: "آبشارهای دوردست، خاکستر آتشفشان و آسمانی که هر شب می‌تواند شگفت‌زده‌ات کند.", image: "assets/images/iceland.jpg", accent: "#8db8b1", glow: "rgba(141,184,177,.2)" },
  { id: "maldives", name: "مالدیو", region: "BLUE INFINITY", lat: 3.2028, lon: 73.2207, season: "نوامبر تا آوریل", description: "آب‌های شفاف، افق بی‌انتها و فرصتی برای شنیدن صدای آرام دریا.", image: "assets/images/maldives.jpg", accent: "#69c9cf", glow: "rgba(105,201,207,.2)" },
  { id: "turkey", name: "ترکیه", region: "WHERE CONTINENTS MEET", lat: 41.0082, lon: 28.9784, season: "آوریل تا مه", description: "بازارهای پرقصه، معماری باشکوه و تلاقی فرهنگ‌هایی که قرن‌ها کنار هم زیسته‌اند.", image: "assets/images/turkey.jpg", accent: "#e6a16f", glow: "rgba(230,161,111,.2)" },
  { id: "france", name: "فرانسه", region: "ART OF LIVING", lat: 48.8566, lon: 2.3522, season: "آوریل تا ژوئن", description: "از خیابان‌های پرهنر تا جاده‌های روستایی؛ زیبایی در جزئیاتی آرام و حساب‌شده.", image: "assets/images/france.jpg", accent: "#bca6d7", glow: "rgba(188,166,215,.2)" },
  { id: "switzerland", name: "سوئیس", region: "ABOVE THE CLOUDS", lat: 46.8182, lon: 8.2275, season: "ژوئن تا سپتامبر", description: "دریاچه‌های آینه‌ای، قطارهای کوهستانی و سکوت باشکوه آلپ.", image: "assets/images/switzerland.jpg", accent: "#9bc9d4", glow: "rgba(155,201,212,.2)" },
  { id: "thailand", name: "تایلند", region: "TROPICAL SOUL", lat: 13.7563, lon: 100.5018, season: "نوامبر تا فوریه", description: "جزیره‌های سبز، عطر غذاهای خیابانی و معابد آرام در دل شهرهای زنده.", image: "assets/images/thailand.jpg", accent: "#a8c77d", glow: "rgba(168,199,125,.2)" },
  { id: "greece", name: "یونان", region: "SUNLIT HORIZONS", lat: 37.9838, lon: 23.7275, season: "مه تا اکتبر", description: "خانه‌های روشن، آب‌های فیروزه‌ای و عصرهایی طلایی بر فراز دریای اژه.", image: "assets/images/greece.jpg", accent: "#70c3cf", glow: "rgba(112,195,207,.2)" },
  { id: "morocco", name: "مراکش", region: "A THOUSAND COLOURS", lat: 31.6295, lon: -7.9811, season: "مارس تا مه", description: "دیوارهای اخرایی، بازارهای پررنگ و مسیرهایی که از شهر به شن‌های صحرا می‌رسند.", image: "assets/images/morocco.jpg", accent: "#d88b68", glow: "rgba(216,139,104,.2)" }
];

const $ = (selector, root = document) => root.querySelector(selector);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const coarsePointer = window.matchMedia("(pointer: coarse)");

function makeFallbackEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#123d46");
  gradient.addColorStop(0.5, "#0d3340");
  gradient.addColorStop(1, "#071a2a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // خطوط شبکه‌ای لطیف در نقشهٔ جایگزین.
  ctx.strokeStyle = "rgba(167,205,174,.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 128) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // قاره‌های شماتیک؛ تا زمانی که تکسچر واقعی دانلود شود.
  const landShapes = [
    [[180,180],[270,130],[390,160],[455,230],[420,310],[365,355],[340,460],[290,500],[255,415],[220,340],[165,285]],
    [[430,470],[505,430],[555,500],[570,590],[530,700],[480,785],[435,660],[410,560]],
    [[900,205],[980,150],[1090,165],[1150,220],[1090,270],[1010,270],[950,340],[895,290]],
    [[965,310],[1085,315],[1150,395],[1120,520],[1055,655],[990,610],[950,490],[920,390]],
    [[1070,170],[1240,115],[1420,145],[1540,220],[1625,320],[1540,390],[1430,350],[1360,285],[1250,330],[1160,275]],
    [[1490,600],[1580,570],[1670,610],[1710,680],[1640,735],[1550,710]],
    [[1770,300],[1830,340],[1815,410],[1765,390]]
  ];
  landShapes.forEach((shape) => {
    ctx.beginPath();
    shape.forEach(([x, y], index) => index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath();
    ctx.fillStyle = "#315f50";
    ctx.fill();
    ctx.strokeStyle = "rgba(210,194,133,.35)";
    ctx.stroke();
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function latLonToVector(lat, lon, radius = 1) {
  // مختصات با UV نقشهٔ equirectangular یکسان است.
  const u = (lon + 180) / 360;
  const phi = u * Math.PI * 2;
  const theta = (90 - lat) * Math.PI / 180;
  return new THREE.Vector3(
    -Math.cos(phi) * Math.sin(theta) * radius,
    Math.cos(theta) * radius,
    Math.sin(phi) * Math.sin(theta) * radius
  );
}

function loadTexture(loader, path, onSuccess, onFailure) {
  loader.load(path, onSuccess, undefined, onFailure);
}

export function initGlobe({ onReady = () => {}, onError = () => {} } = {}) {
  const stage = $("#globeStage");
  const host = $("#globeCanvas");
  const card = $("#destinationCard");
  const cardImage = $("#destinationCardImage");
  const cardImageWrap = $("#destinationCardImageWrap");
  const cardIndex = $("#destinationCardIndex");
  const cardRegion = $("#destinationCardRegion");
  const cardTitle = $("#destinationCardTitle");
  const cardDescription = $("#destinationCardDescription");
  const cardSeason = $("#destinationCardSeason");
  const message = $("#globeMessage");

  if (!stage || !host) return { selectDestination: () => {}, clearSelection: () => {}, destroy: () => {} };

  let renderer;
  let scene;
  let camera;
  let controls;
  let globeGroup;
  let earthMesh;
  let cloudMesh;
  let raycaster;
  let animationFrame = 0;
  let resizeObserver;
  let lastTime = 0;
  let readyNotified = false;
  let hoveredId = null;
  let pinned = false;
  let activeId = null;
  let activeMarker = null;
  let hoverClearTimer = 0;
  let pointerDown = null;
  let isDragging = false;
  let userInteracting = false;
  let targetQuaternion = null;
  let destroyed = false;

  const markerEntries = [];
  const tempWorldPosition = new THREE.Vector3();
  const tempNormal = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const pointer = new THREE.Vector2(99, 99);

  function notifyReady() {
    if (readyNotified) return;
    readyNotified = true;
    onReady();
  }

  function applyDestinationTheme(destination) {
    document.documentElement.style.setProperty("--travel-accent", destination.accent);
    document.documentElement.style.setProperty("--travel-glow", destination.glow);
  }

  function destinationById(id) {
    return DESTINATIONS.find((destination) => destination.id === id);
  }

  function frontFacing(marker) {
    marker.root.getWorldPosition(tempWorldPosition);
    marker.localNormal.copy(marker.baseNormal).applyQuaternion(globeGroup.quaternion);
    cameraDirection.copy(camera.position).normalize();
    return marker.localNormal.dot(cameraDirection) > 0.12;
  }

  function positionCard() {
    if (!card || card.hidden || !activeMarker || pinned) return;
    activeMarker.root.getWorldPosition(tempWorldPosition);
    const projected = tempWorldPosition.clone().project(camera);
    const rect = stage.getBoundingClientRect();
    if (projected.z > 1 || projected.z < -1) return;

    const x = (projected.x * 0.5 + 0.5) * rect.width;
    const y = (-projected.y * 0.5 + 0.5) * rect.height;
    const cardWidth = Math.min(265, rect.width - 24);
    const cardHeight = card.offsetHeight || 290;
    let left = x + 18;
    if (left + cardWidth > rect.width - 10) left = x - cardWidth - 18;
    left = Math.max(10, Math.min(left, rect.width - cardWidth - 10));
    const top = Math.max(15, Math.min(y - 60, rect.height - cardHeight - 28));
    card.style.left = `${left}px`;
    card.style.right = "auto";
    card.style.top = `${top}px`;
  }

  function showDestination(id, { pin = false } = {}) {
    const destination = destinationById(id);
    if (!destination || !card) return;
    const marker = markerEntries.find((entry) => entry.destination.id === id);

    activeId = id;
    activeMarker = marker || null;
    pinned = pin;
    clearTimeout(hoverClearTimer);
    card.hidden = false;
    card.classList.remove("is-pinned");
    if (pin) card.classList.add("is-pinned");
    applyDestinationTheme(destination);

    if (cardIndex) cardIndex.textContent = `DESTINATION ${String(DESTINATIONS.findIndex((item) => item.id === id) + 1).padStart(2, "0")}`;
    if (cardRegion) cardRegion.textContent = destination.region;
    if (cardTitle) cardTitle.textContent = destination.name;
    if (cardDescription) cardDescription.textContent = destination.description;
    if (cardSeason) cardSeason.textContent = destination.season;

    // تصویرها محلی و اختیاری‌اند؛ خطای نبود فایل باعث خالی‌شدن کارت نمی‌شود.
    if (cardImage) {
      cardImage.classList.remove("is-loaded");
      cardImage.alt = `چشم‌انداز مقصد ${destination.name}`;
      cardImage.onload = () => cardImage.classList.add("is-loaded");
      cardImage.onerror = () => cardImage.classList.remove("is-loaded");
      cardImage.src = destination.image;
    }

    document.querySelectorAll("[data-destination]").forEach((button) => {
      const active = button.dataset.destination === id;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (message) message.textContent = `${destination.name} انتخاب شده است.`;
    positionCard();
  }

  function clearSelection() {
    clearTimeout(hoverClearTimer);
    activeId = null;
    activeMarker = null;
    pinned = false;
    if (card) {
      card.hidden = true;
      card.classList.remove("is-pinned");
      card.style.left = "";
      card.style.right = "";
      card.style.top = "";
    }
    document.documentElement.style.setProperty("--travel-accent", "#d9b477");
    document.documentElement.style.setProperty("--travel-glow", "rgba(217,180,119,.2)");
    document.querySelectorAll("[data-destination]").forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
  }

  function rotateToDestination(id) {
    const marker = markerEntries.find((entry) => entry.destination.id === id);
    if (!marker || !globeGroup) return;
    const desired = marker.baseNormal.clone().normalize();
    targetQuaternion = new THREE.Quaternion().setFromUnitVectors(desired, new THREE.Vector3(0, 0, 1));
  }

  function selectDestination(id, { pin = true, focusGlobe = true } = {}) {
    const destination = destinationById(id);
    if (!destination) return;
    showDestination(id, { pin });
    rotateToDestination(id);
    if (focusGlobe && host) {
      // روی موبایل و انتخاب از فهرست، کره در دید باقی می‌ماند.
      if (coarsePointer.matches) stage.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "center" });
    }
  }

  function scheduleClearHover() {
    clearTimeout(hoverClearTimer);
    hoverClearTimer = window.setTimeout(() => {
      if (pinned) return;
      if (card && card.matches(":hover")) return;
      hoveredId = null;
      clearSelection();
    }, 260);
  }

  function setHoveredMarker(marker) {
    if (!marker) {
      if (!pinned) scheduleClearHover();
      return;
    }
    clearTimeout(hoverClearTimer);
    if (hoveredId !== marker.destination.id) {
      hoveredId = marker.destination.id;
      targetQuaternion = null;
      showDestination(marker.destination.id, { pin: false });
    }
  }

  function createStars() {
    const count = coarsePointer.matches ? 420 : 1100;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = 9 + Math.random() * 17;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      const tint = Math.random();
      colors[i * 3] = tint > 0.7 ? 0.95 : 0.56;
      colors[i * 3 + 1] = tint > 0.7 ? 0.77 : 0.72;
      colors[i * 3 + 2] = tint > 0.7 ? 0.49 : 0.68;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: coarsePointer.matches ? 0.025 : 0.018, vertexColors: true, transparent: true, opacity: 0.78, depthWrite: false, sizeAttenuation: true });
    scene.add(new THREE.Points(geometry, material));
  }

  function createMarker(destination) {
    const radius = 1.015;
    const normal = latLonToVector(destination.lat, destination.lon, 1).normalize();
    const root = new THREE.Group();
    root.position.copy(normal.clone().multiplyScalar(radius));
    root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 8),
      new THREE.MeshBasicMaterial({ color: destination.accent, transparent: true, opacity: 1, toneMapped: false })
    );
    dot.position.z = 0.025;
    root.add(dot);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.0027, 6, 28),
      new THREE.MeshBasicMaterial({ color: destination.accent, transparent: true, opacity: 0.88, toneMapped: false })
    );
    ring.position.z = 0.024;
    root.add(ring);

    // سطح نامرئی بزرگ‌تر، تعامل با لمس را آسان می‌کند.
    const hitArea = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hitArea.position.z = 0.025;
    hitArea.userData.destinationId = destination.id;
    root.add(hitArea);
    globeGroup.add(root);

    const marker = { destination, root, dot, ring, hitArea, baseNormal: normal.clone(), localNormal: new THREE.Vector3() };
    markerEntries.push(marker);
    return marker;
  }

  function initRenderer() {
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !coarsePointer.matches, powerPreference: "high-performance" });
    } catch (error) {
      stage.classList.remove("has-webgl");
      if (message) message.textContent = "WebGL در این مرورگر در دسترس نیست؛ فهرست مقصدها همچنان کار می‌کند.";
      onError("کرهٔ سه‌بعدی در این مرورگر در دسترس نیست.");
      return false;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.15 : 1.7));
    renderer.setSize(host.clientWidth, host.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.domElement.setAttribute("aria-label", "کرهٔ زمین؛ برای چرخاندن با ماوس یا لمس بکشید و برای انتخاب مقصد روی نقطه کلیک کنید.");
    renderer.domElement.setAttribute("tabindex", "0");
    renderer.domElement.setAttribute("role", "application");
    host.appendChild(renderer.domElement);
    stage.classList.add("has-webgl");
    return true;
  }

  if (!initRenderer()) {
    // لیست مقصدها حتی در صورت فقدان WebGL قابل استفاده است.
    return { selectDestination, clearSelection, destroy: () => {} };
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, host.clientWidth / Math.max(1, host.clientHeight), 0.1, 100);
  camera.position.set(0, 0, 4.25);
  globeGroup = new THREE.Group();
  scene.add(globeGroup);

  scene.add(new THREE.AmbientLight(0xb4d4d0, 1.25));
  const keyLight = new THREE.DirectionalLight(0xffe5bd, 2.0);
  keyLight.position.set(-3.5, 2.7, 4.5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x3e9baf, 1.1);
  rimLight.position.set(4, -1.5, -4);
  scene.add(rimLight);

  const globeSegments = coarsePointer.matches ? 56 : 96;
  const earthGeometry = new THREE.SphereGeometry(1, globeSegments, Math.round(globeSegments * 0.66));
  const earthMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 9, specular: new THREE.Color(0x244957) });
  earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  globeGroup.add(earthMesh);

  // هالهٔ جوی با شیدر سبک و بدون تکسچر خارجی.
  const atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vNormal; void main(){ float rim = pow(0.78 - max(dot(normalize(vNormal), vec3(0.0,0.0,1.0)), 0.0), 3.0); gl_FragColor = vec4(0.19,0.62,0.72,1.0) * rim; }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.085, 48, 32), atmosphereMaterial);
  globeGroup.add(atmosphere);

  // چرخش آرام ابرها روی سطح؛ در صورت نبود فایل، لایه حذف می‌شود.
  const cloudMaterial = new THREE.MeshPhongMaterial({ color: 0xd5e4df, transparent: true, opacity: 0.19, depthWrite: false, blending: THREE.NormalBlending });
  cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(1.009, globeSegments, Math.round(globeSegments * 0.66)), cloudMaterial);
  globeGroup.add(cloudMesh);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.minDistance = 3.15;
  controls.maxDistance = 6.3;
  controls.rotateSpeed = 0.48;
  controls.zoomSpeed = 0.55;
  controls.target.set(0, 0, 0);
  controls.addEventListener("start", () => { userInteracting = true; });
  controls.addEventListener("end", () => { userInteracting = false; });

  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.1;
  createStars();
  DESTINATIONS.forEach(createMarker);

  // نقشهٔ روز: اگر فایل وجود نداشت از تکسچر ساخته‌شده در همین فایل استفاده کن.
  const loader = new THREE.TextureLoader();
  loadTexture(loader, "assets/textures/earth-day.jpg", (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    earthMaterial.map = texture;
    earthMaterial.color.set(0xffffff);
    earthMaterial.needsUpdate = true;
    notifyReady();
  }, () => {
    earthMaterial.map = makeFallbackEarthTexture();
    earthMaterial.color.set(0xffffff);
    earthMaterial.needsUpdate = true;
    notifyReady();
  });

  loadTexture(loader, "assets/textures/earth-clouds.jpg", (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    cloudMesh.material.map = texture;
    cloudMesh.material.needsUpdate = true;
  }, () => {
    // ابرها اختیاری‌اند و نبودشان نباید مانع رندر شود.
  });

  // فایل‌های تکمیلی اختیاری‌اند؛ اگر موجود باشند فعال می‌شوند.
  loadTexture(loader, "assets/textures/earth-normal.png", (texture) => {
    earthMaterial.normalMap = texture;
    earthMaterial.normalScale.set(0.035, 0.035);
    earthMaterial.needsUpdate = true;
  }, () => {});

  // Height/bump map جداگانه و اختیاری است؛ در صورت نداشتن آن این مرحله را نادیده بگیر.
  loadTexture(loader, "assets/textures/earth-bump.png", (texture) => {
    earthMaterial.bumpMap = texture;
    earthMaterial.bumpScale = 0.008;
    earthMaterial.needsUpdate = true;
  }, () => {});

  loadTexture(loader, "assets/textures/earth-specular.png", (texture) => {
    earthMaterial.specularMap = texture;
    earthMaterial.specular.set(0x68868c);
    earthMaterial.shininess = 18;
    earthMaterial.needsUpdate = true;
  }, () => {});

  /* Raycasting: فقط نقطه‌های سمت قابل مشاهده می‌توانند hover شوند. */
  function setPointerFromEvent(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function markerAtPointer() {
    raycaster.setFromCamera(pointer, camera);
    const candidates = markerEntries.filter(frontFacing).map((entry) => entry.hitArea);
    const intersections = raycaster.intersectObjects(candidates, false);
    if (!intersections.length) return null;
    const id = intersections[0].object.userData.destinationId;
    return markerEntries.find((entry) => entry.destination.id === id) || null;
  }

  renderer.domElement.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch" || isDragging || pinned) return;
    setPointerFromEvent(event);
    const marker = markerAtPointer();
    if (marker) {
      setHoveredMarker(marker);
      controls.enabled = true;
    } else {
      setHoveredMarker(null);
    }
  }, { passive: true });

  renderer.domElement.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY, id: event.pointerId };
    isDragging = false;
  }, { passive: true });

  renderer.domElement.addEventListener("pointermove", (event) => {
    if (!pointerDown || pointerDown.id !== event.pointerId) return;
    const dx = event.clientX - pointerDown.x;
    const dy = event.clientY - pointerDown.y;
    if (Math.hypot(dx, dy) > 5) isDragging = true;
  }, { passive: true });

  renderer.domElement.addEventListener("pointerup", (event) => {
    if (!pointerDown) return;
    const wasDrag = isDragging;
    pointerDown = null;
    if (event.pointerType === "touch") isDragging = false;
    else window.setTimeout(() => { isDragging = false; }, 80);
    if (wasDrag) return;
    setPointerFromEvent(event);
    const marker = markerAtPointer();
    if (marker) selectDestination(marker.destination.id, { pin: true, focusGlobe: false });
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    if (!pinned) scheduleClearHover();
  });

  card?.addEventListener("pointerenter", () => clearTimeout(hoverClearTimer));
  card?.addEventListener("pointerleave", () => {
    if (!pinned) scheduleClearHover();
  });

  renderer.domElement.addEventListener("keydown", (event) => {
    if (event.key === "Escape") clearSelection();
    if (event.key === "Enter" || event.key === " ") {
      if (activeId) selectDestination(activeId, { pin: true, focusGlobe: false });
    }
  });

  function handleResize() {
    if (destroyed || !renderer || !camera) return;
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.15 : 1.7));
    renderer.setSize(width, height, false);
  }

  resizeObserver = new ResizeObserver(handleResize);
  resizeObserver.observe(host);
  window.addEventListener("resize", handleResize, { passive: true });

  function render(time = 0) {
    if (destroyed) return;
    animationFrame = requestAnimationFrame(render);
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;

    if (cloudMesh && !reduceMotion.matches) cloudMesh.rotation.y += delta * 0.012;

    if (targetQuaternion && !reduceMotion.matches) {
      globeGroup.quaternion.slerp(targetQuaternion, 1 - Math.exp(-delta * 2.8));
      if (globeGroup.quaternion.angleTo(targetQuaternion) < 0.0015) {
        globeGroup.quaternion.copy(targetQuaternion);
        targetQuaternion = null;
      }
    } else if (!pinned && !hoveredId && !controls.dragging && !reduceMotion.matches) {
      globeGroup.rotation.y += delta * 0.035;
    }

    markerEntries.forEach((marker, index) => {
      const pulse = 1 + (Math.sin(time * 0.0024 + index * 0.9) + 1) * 0.18;
      marker.ring.scale.setScalar(pulse);
      marker.ring.material.opacity = 0.5 + (pulse - 1) * 1.6;
      marker.dot.scale.setScalar(1 + (pulse - 1) * 0.23);
      const isActive = activeId === marker.destination.id;
      marker.dot.scale.multiplyScalar(isActive ? 1.25 : 1);
    });

    controls.update();
    if (activeMarker && !pinned && !reduceMotion.matches) positionCard();
    renderer.render(scene, camera);
  }

  // notifyReady به onLoad یا onError تکسچر اصلی وابسته است؛ تایمر پشتیبان هم دارد.
  window.setTimeout(notifyReady, 1200);
  render();

  return {
    selectDestination,
    clearSelection,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(animationFrame);
      clearTimeout(hoverClearTimer);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      controls?.dispose();
      scene?.traverse((object) => {
        object.geometry?.dispose?.();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            Object.values(material).forEach((value) => {
              if (value && value.isTexture) value.dispose();
            });
            material.dispose?.();
          });
        }
      });
      renderer?.dispose();
      renderer?.domElement?.remove();
    }
  };
}
