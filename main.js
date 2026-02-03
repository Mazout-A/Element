import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// ------------------------------------------------------------------
// 1. LA SCÈNE
// ------------------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// ------------------------------------------------------------------
// PARTIE MAP (LE TAPIS GÉANT)
// A mettre juste après "scene.background" et AVANT le joueur
// ------------------------------------------------------------------

// 1. Charger l'image de la map
const textureLoaderMap = new THREE.TextureLoader();
const mapTexture = textureLoaderMap.load("map.png"); // Mets le nom de ton image

// 2. Réglage Pixel Art (Pour que les maisons soient nettes)
mapTexture.magFilter = THREE.NearestFilter;
mapTexture.minFilter = THREE.NearestFilter;

// 3. Créer la forme (LE SOL)
// ATTENTION : Remplace 1024, 1024 par la taille REELLE de ton image !
// Si ton image fait 2000x1500, mets (2000, 1500)
const mapGeometry = new THREE.PlaneGeometry(6144, 3104);

const mapMaterial = new THREE.MeshBasicMaterial({
  map: mapTexture,
  side: THREE.DoubleSide, // Visible des deux côtés au cas où
});

const map = new THREE.Mesh(mapGeometry, mapMaterial);

// 4. L'ORIENTATION (CRUCIAL)
// Par défaut, un Plane est debout face à toi.
// On le tourne de -90 degrés (Math.PI / 2) sur l'axe X pour en faire un sol.
map.rotation.x = -Math.PI / 2;

// 5. La position
// On la met à 0 en hauteur.
// Comme ton perso est à y=16 (ses pieds sont à 0), il marchera pile dessus.
map.position.y = 0;

scene.add(map);

// ------------------------------------------------------------------
// 2. LE JOUEUR (TEXTURE & SPRITE)
// ------------------------------------------------------------------

// A. Chargement de l'image
const textureLoader = new THREE.TextureLoader();
// Assure-toi que "red.png" est bien à côté de ton fichier index.html
const persoTexture = textureLoader.load("scout.png");

// B. Réglage Pixel Art (Pour que ce soit net)
persoTexture.magFilter = THREE.NearestFilter;
persoTexture.minFilter = THREE.NearestFilter;

// C. Découpage (Sprite Sheet 4x4)
// On dit : "Affiche seulement 1 carré sur 4 en largeur et hauteur"
persoTexture.repeat.set(1 / 4, 1 / 4);

// D. Position de départ de l'image (Face caméra)
persoTexture.offset.x = 0;
persoTexture.offset.y = 0;

// E. Création de l'objet 3D (C'est ça qu'il te manquait !)
// On utilise un Plane (feuille plate) et pas un Box, c'est mieux pour la 2D
const geometry = new THREE.PlaneGeometry(32, 32);
const material = new THREE.MeshBasicMaterial({
  map: persoTexture, // On met l'image
  transparance: false,
  side: THREE.DoubleSide, // Visible des deux côtés
});

const cube = new THREE.Mesh(geometry, material);
cube.position.y = 16; // On le pose sur le sol (moitié de 32)
scene.add(cube);

// ------------------------------------------------------------------
// 3. LA CAMÉRA
// ------------------------------------------------------------------
const aspect = window.innerWidth / window.innerHeight;
const d = 300;
const camera = new THREE.OrthographicCamera(
  -d * aspect,
  d * aspect,
  d,
  -d,
  1,
  2000,
);

// Position style "Pokémon" (Haut et Loin)
const cameraOffset = new THREE.Vector3(0, 400, 400);

// ------------------------------------------------------------------
// 4. LE RENDU & SOL
// ------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// const tailleMap = 3200;
// const tailleCase = 32;
// const gridHelper = new THREE.GridHelper(tailleMap, tailleMap / tailleCase);
// scene.add(gridHelper);

// ------------------------------------------------------------------
// 5. VARIABLES D'ANIMATION (Le Cerveau)
// ------------------------------------------------------------------
let currentColumn = 0; // Quelle étape du pas ? (0, 1, 2, 3)
let currentDirection = 0; // Quelle ligne ? (0=Face, 1=Gauche, 2=Droite, 3=Dos)
let frameTimer = 0; // Chronomètre interne
const frameSpeed = 10; // Vitesse de l'animation (Plus c'est haut, plus c'est lent)

// FONCTION MAGIQUE : Elle calcule quelle partie de l'image afficher
function animateSprite(direction, isMoving) {
  // 1. Choix de la LIGNE (Direction)
  // Three.js compte Y de bas en haut (0 en bas, 1 en haut)
  // Donc : Ligne 0 (Face) = 0.75, Ligne 3 (Dos) = 0
  // Cette formule convertit ta direction (0,1,2,3) en coordonnées ThreeJS
  persoTexture.offset.y = (3 - direction) * (1 / 4);

  // 2. Choix de la COLONNE (Animation des pieds)
  if (isMoving) {
    frameTimer++;
    if (frameTimer > frameSpeed) {
      currentColumn++; // Image suivante
      if (currentColumn > 3) currentColumn = 0; // Retour au début
      frameTimer = 0;
    }
  } else {
    currentColumn = 0; // Position statique si on ne bouge pas
    frameTimer = 0;
  }

  // Application du décalage X
  persoTexture.offset.x = currentColumn * (1 / 4);
}

// ------------------------------------------------------------------
// 6. GESTION CLAVIER (Pour animation fluide)
// ------------------------------------------------------------------
const keys = { z: false, q: false, s: false, d: false };

window.addEventListener("keydown", (e) => {
  if (keys.hasOwnProperty(e.key.toLowerCase()))
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.key.toLowerCase()))
    keys[e.key.toLowerCase()] = false;
});

// ------------------------------------------------------------------
// 7. LA BOUCLE DE JEU (ANIMATE)
// ------------------------------------------------------------------
function animate() {
  requestAnimationFrame(animate);

  const speed = 8;
  let isMoving = false;

  // Logique de déplacement
  // On met à jour "currentDirection" selon la touche
  // 0 = Face (S), 1 = Gauche (Q), 2 = Droite (D), 3 = Dos (Z)

  if (keys.z) {
    cube.position.z -= speed;
    currentDirection = 3; // Dos
    isMoving = true;
  } else if (keys.s) {
    cube.position.z += speed;
    currentDirection = 0; // Face
    isMoving = true;
  } else if (keys.q) {
    cube.position.x -= speed;
    currentDirection = 1; // Gauche
    isMoving = true;
  } else if (keys.d) {
    cube.position.x += speed;
    currentDirection = 2; // Droite
    isMoving = true;
  }

  // On met à jour l'image du perso
  animateSprite(currentDirection, isMoving);

  // La caméra suit le perso (sans tourner)
  camera.position.copy(cube.position).add(cameraOffset);
  camera.lookAt(cube.position);

  renderer.render(scene, camera);
}
animate();
