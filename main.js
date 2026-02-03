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

// Chargement de l'image
const textureLoader = new THREE.TextureLoader();
// Assure-toi que "red.png" est bien à côté de ton fichier index.html
const persoTexture = textureLoader.load("DEV.png");

// Réglage Pixel Art (Pour que ce soit net)
persoTexture.magFilter = THREE.NearestFilter;
persoTexture.minFilter = THREE.NearestFilter;

// Découpage (Sprite Sheet 4x4)
// On dit : "Affiche seulement 1 carré sur 4 en largeur et hauteur"
persoTexture.repeat.set(1 / 4, 1 / 4);

// Position de départ de l'image (Face caméra)
persoTexture.offset.x = 0;
persoTexture.offset.y = 0;

// Création de l'objet 3D (C'est ça qu'il te manquait !)
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

// --- CONFIGURATION INVENTAIRE MINECRAFT ---
const slotCount = 4; // Nombre de cases (5 pour faire simple, Minecraft en a 9)
let selectedSlot = 0; // La case actuellement sélectionnée (0 à 4)
const inventoryData = new Array(slotCount).fill(null); // On crée 5 cases vides

// 1. Le Conteneur (La barre noire)
const hotbar = document.createElement("div");
hotbar.style.position = "absolute";
hotbar.style.bottom = "10px";
hotbar.style.left = "50%";
hotbar.style.transform = "translateX(-50%)"; // Centrer parfaitement
hotbar.style.display = "flex";
hotbar.style.gap = "4px"; // Petit espace entre les cases
hotbar.style.padding = "4px";
hotbar.style.backgroundColor = "rgba(0, 0, 0, 0.4)"; // Noir transparent
hotbar.style.borderRadius = "4px";
document.body.appendChild(hotbar);

// 2. Création des Cases (Slots)
const slotsDOM = []; // On garde les références HTML

for (let i = 0; i < slotCount; i++) {
  const slot = document.createElement("div");

  // Style de la case Minecraft
  slot.style.width = "50px";
  slot.style.height = "50px";
  slot.style.border = "2px solid #555"; // Bordure grise par défaut
  slot.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  slot.style.display = "flex";
  slot.style.justifyContent = "center";
  slot.style.alignItems = "center";
  slot.style.color = "white";
  slot.style.fontFamily = "Arial, sans-serif";
  slot.style.fontSize = "12px";
  slot.style.fontWeight = "bold";
  slot.style.boxSizing = "border-box"; // Important pour les bordures

  hotbar.appendChild(slot);
  slotsDOM.push(slot);
}

// 3. Fonction de Mise à Jour Visuelle
function updateHotbar() {
  for (let i = 0; i < slotCount; i++) {
    const slot = slotsDOM[i];
    const item = inventoryData[i];

    // A. Gestion de la SÉLECTION (Cadre Blanc)
    if (i === selectedSlot) {
      slot.style.borderColor = "white";
      slot.style.borderWidth = "4px"; // Plus épais quand sélectionné
      slot.style.opacity = "1";
    } else {
      slot.style.borderColor = "#555"; // Gris quand pas sélectionné
      slot.style.borderWidth = "2px";
      slot.style.opacity = "0.7";
    }

    // B. Gestion de l'OBJET dedans
    slot.innerHTML = ""; // On vide
    if (item !== null) {
      // Ici, si tu as des images, on mettra <img src...>
      // Pour l'instant on met un carré de couleur
      const icon = document.createElement("div");
      icon.style.width = "30px";
      icon.style.height = "30px";
      icon.style.backgroundColor = item.color;
      icon.style.border = "1px solid black";

      // On peut ajouter le nom en tout petit si on survole (optionnel)
      icon.title = item.name;

      slot.appendChild(icon);
    }
  }
}

// On lance l'affichage une première fois
updateHotbar();

// --- CONTROLES DE LA HOTBAR (PAVÉ NUMÉRIQUE) ---

window.addEventListener("keydown", (event) => {
  // On regarde le "code" de la touche pour distinguer le pavé numérique
  const code = event.code;

  // Touche 1 (Pavé Numérique OU Chiffre au dessus des lettres)
  if (code === "Numpad1" || code === "Digit1") {
    selectedSlot = 0; // Case 1
    updateHotbar();
  }
  // Touche 2
  else if (code === "Numpad2" || code === "Digit2") {
    selectedSlot = 1; // Case 2
    updateHotbar();
  }
  // Touche 3
  else if (code === "Numpad3" || code === "Digit3") {
    selectedSlot = 2; // Case 3
    updateHotbar();
  }
  // Touche 4
  else if (code === "Numpad4" || code === "Digit4") {
    selectedSlot = 3; // Case 4
    updateHotbar();
  }

  // Touche F (Utiliser l'objet)
  else if (code === "KeyF") {
    const itemEnMain = inventoryData[selectedSlot];

    if (itemEnMain !== null) {
      console.log("J'utilise : " + itemEnMain.name);
      alert("Vous utilisez : " + itemEnMain.name);

      // Si tu veux que l'objet disparaisse après usage, décommente la ligne dessous :
      // inventoryData[selectedSlot] = null;

      updateHotbar();
    }
  }
});

// 3. Action "UTILISER" (Clic Souris ou Touche F)
window.addEventListener("keydown", (event) => {
  // Si on appuie sur F (ou si tu préfères Clic gauche, dis-le moi)
  if (event.key.toLowerCase() === "f") {
    const itemEnMain = inventoryData[selectedSlot];

    if (itemEnMain !== null) {
      console.log("J'utilise : " + itemEnMain.name);

      // Exemple d'effet : Si c'est une Potion, on change la couleur du joueur
      if (itemEnMain.name === "Potion") {
        cube.material.color.setHex(0x00ff00); // Le joueur devient vert
        alert("Vous buvez la potion !");

        // On retire l'objet après usage (Optionnel)
        inventoryData[selectedSlot] = null;
        updateHotbar();
      }
    } else {
      console.log("Main vide !");
    }
  }
});
