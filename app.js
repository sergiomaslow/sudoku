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