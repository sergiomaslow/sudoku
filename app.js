'use strict';

const TAM = 9;
const NRS = [1,2,3,4,5,6,7,8,9];

let puzzle = [];
let solucion = [];
let celdasFijas = new Set();
let seleccionada = null;
let errores = new Set();

const $tablero = document.getElementById('tablero');
const $numeros = document.getElementById('numeros');
const $mensaje = document.getElementById('mensaje');
const $dificultad = document.getElementById('dificultad');

// ---------- Generación ----------
function tableroVacio() {
  return Array.from({ length: TAM }, () => Array(TAM).fill(0));
}

function esValido(t, f, c, n) {
  for (let i = 0; i < TAM; i++) {
    if (i !== c && t[f][i] === n) return false;
    if (i !== f && t[i][c] === n) return false;
  }
  const f0 = Math.floor(f / 3) * 3;
  const c0 = Math.floor(c / 3) * 3;
  for (let ff = f0; ff < f0 + 3; ff++)
    for (let cc = c0; cc < c0 + 3; cc++)
      if ((ff !== f || cc !== c) && t[ff][cc] === n) return false;
  return true;
}

function mezclar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resolver(t) {
  for (let f = 0; f < TAM; f++) {
    for (let c = 0; c < TAM; c++) {
      if (t[f][c] === 0) {
        for (const n of mezclar([...NRS])) {
          if (esValido(t, f, c, n)) {
            t[f][c] = n;
            if (resolver(t)) return true;
            t[f][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generarJuego(dificultad) {
  const sol = tableroVacio();
  resolver(sol);

  const puz = sol.map(fila => [...fila]);
  const vacias = { facil: 40, medio: 50, dificil: 58 }[dificultad] ?? 50;

  let quitadas = 0;
  const celdas = mezclar(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
  );

  for (const [f, c] of celdas) {
    if (quitadas >= vacias) break;
    if (puz[f][c] !== 0) {
      puz[f][c] = 0;
      quitadas++;
    }
  }

  return { puz, sol };
}

// ---------- Render ----------
function renderTablero() {
  const frag = document.createDocumentFragment();
  for (let f = 0; f < TAM; f++) {
    for (let c = 0; c < TAM; c++) {
      const celda = document.createElement('div');
      celda.className = 'celda';
      celda.dataset.f = f;
      celda.dataset.c = c;

      const v = puzzle[f][c];
      if (celdasFijas.has(`${f}-${c}`)) {
        celda.textContent = v;
        celda.classList.add('fija');
      } else if (v !== 0) {
        celda.textContent = v;
      }

      if (seleccionada) {
        if (seleccionada.f === f && seleccionada.c === c)
          celda.classList.add('seleccionada');
        else if (
          seleccionada.f === f || seleccionada.c === c ||
          (Math.floor(seleccionada.f / 3) === Math.floor(f / 3) &&
           Math.floor(seleccionada.c / 3) === Math.floor(c / 3))
        )
          celda.classList.add('resaltada');
      }

      if (errores.has(`${f}-${c}`)) celda.classList.add('error');

      frag.appendChild(celda);
    }
  }
  $tablero.innerHTML = '';
  $tablero.appendChild(frag);
}

function renderNumeros() {
  const conteo = Array(10).fill(0);
  for (let f = 0; f < TAM; f++)
    for (let c = 0; c < TAM; c++)
      if (puzzle[f][c] !== 0) conteo[puzzle[f][c]]++;

  $numeros.innerHTML = '';
  for (const n of NRS) {
    const b = document.createElement('button');
    b.textContent = n;
    b.dataset.n = n;
    if (conteo[n] >= 9) b.classList.add('agotado');
    $numeros.appendChild(b);
  }
}

// ---------- Lógica del juego ----------
function nuevoJuego() {
  const dif = $dificultad.value;
  const { puz, sol } = generarJuego(dif);
  puzzle = puz;
  solucion = sol;
  celdasFijas.clear();
  for (let f = 0; f < TAM; f++)
    for (let c = 0; c < TAM; c++)
      if (puz[f][c] !== 0) celdasFijas.add(`${f}-${c}`);
  
  seleccionada = null;
  errores.clear();
  $mensaje.textContent = '';
  $mensaje.className = 'mensaje';
  renderTablero();
  renderNumeros();
}

function mostrarMensaje(texto, tipo = '') {
  $mensaje.textContent = texto;
  $mensaje.className = 'mensaje ' + tipo;
}

function comprobarVictoria() {
  const vacias = puzzle.flat().filter(v => v === 0).length;
  if (vacias === 0 && errores.size === 0) {
    mostrarMensaje('¡Felicidades! Sudoku completado 🎉', 'exito');
  }
}

// ---------- Eventos ----------
$tablero.addEventListener('click', (e) => {
  const celda = e.target.closest('.celda');
  if (!celda) return;
  const f = +celda.dataset.f;
  const c = +celda.dataset.c;
  if (celdasFijas.has(`${f}-${c}`)) return;

  if (seleccionada && seleccionada.f === f && seleccionada.c === c) {
    seleccionada = null;
  } else {
    seleccionada = { f, c };
  }
  renderTablero();
});

$numeros.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn || !seleccionada) return;
  
  const n = +btn.dataset.n;
  const { f, c } = seleccionada;

  if (n !== solucion[f][c]) {
    errores.add(`${f}-${c}`);
    mostrarMensaje('Ese número no va ahí', 'fallo');
  } else {
    errores.delete(`${f}-${c}`);
    mostrarMensaje('');
  }

  puzzle[f][c] = n;
  seleccionada = null; // Deseleccionar tras poner número
  renderTablero();
  renderNumeros();
  comprobarVictoria();
});

document.getElementById('btn-nuevo').addEventListener('click', nuevoJuego);

document.getElementById('btn-borrar').addEventListener('click', () => {
  if (!seleccionada) return;
  const { f, c } = seleccionada;
  if (celdasFijas.has(`${f}-${c}`)) return;
  
  puzzle[f][c] = 0;
  errores.delete(`${f}-${c}`);
  renderTablero();
  renderNumeros();
});

document.getElementById('btn-verificar').addEventListener('click', () => {
  const vacias = puzzle.flat().filter(v => v === 0).length;
  if (vacias > 0) {
    mostrarMensaje(`Faltan ${vacias} celdas`, 'fallo');
  } else if (errores.size > 0) {
    mostrarMensaje('Hay errores en el tablero', 'fallo');
  } else {
    mostrarMensaje('¡Todo correcto! 🎉', 'exito');
  }
});

// ---------- Tema ----------
const $btnTema = document.getElementById('btn-tema');
const temaGuardado = localStorage.getItem('sudoku-tema') || 'oscuro';
document.documentElement.setAttribute('data-tema', temaGuardado);

$btnTema.addEventListener('click', () => {
  const actual = document.documentElement.getAttribute('data-tema');
  const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro';
  document.documentElement.setAttribute('data-tema', nuevo);
  localStorage.setItem('sudoku-tema', nuevo);
});

// Iniciar
nuevoJuego();
