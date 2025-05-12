let allNames = [];

async function preloadNames() {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1025`);
  const data = await res.json();
  allNames = data.results; // [{ name, url }]
}
const pokedex = document.getElementById('pokedex');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');
const modalDetails = document.getElementById('modal-details');
const closeModal = document.getElementById('close-modal');

const maxCount = 1025;
const batchSize = 50;
let loadedCount = 0;
let isLoading = false;
let allPokemon = [];

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}

async function fetchPokemonData(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  return res.json();
}

async function loadNextBatch() {
  if (isLoading || loadedCount >= maxCount) return;
  isLoading = true;

  const promises = [];
  for (let i = loadedCount + 1; i <= Math.min(loadedCount + batchSize, maxCount); i++) {
    promises.push(fetchPokemonData(i));
  }

  const newPokemon = await Promise.all(promises);
  allPokemon = [...allPokemon, ...newPokemon];
  newPokemon.forEach(pokemon => showCard(pokemon));
  loadedCount += newPokemon.length;
  isLoading = false;
}

function showCard(pokemon) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
    <p>${capitalize(pokemon.name)}</p>
  `;
  card.addEventListener('click', () => showModal(pokemon));
  pokedex.appendChild(card);
}

async function showModal(pokemon) {
  modal.classList.remove('hidden');
  const moves = pokemon.moves.map(m => m.move.name).slice(0, 10).join(', ');
  const speciesRes = await fetch(pokemon.species.url);
  const speciesData = await speciesRes.json();
  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();

  const chain = [];
  let current = evoData.chain;
  do {
    chain.push(current.species.name);
    current = current.evolves_to[0];
  } while (current);

  modalDetails.innerHTML = `
    <h2>${capitalize(pokemon.name)}</h2>
    <img src="${pokemon.sprites.front_shiny}" alt="${pokemon.name} shiny" />
    <p><strong>Moves:</strong> ${moves}</p>
    <p><strong>Evolution Chain:</strong> ${chain.join(' → ')}</p>
  `;
}

searchInput.addEventListener('input', async (e) => {
  const value = e.target.value.toLowerCase();
  pokedex.innerHTML = '';

  if (!value) {
    allPokemon.forEach(showCard); // Show loaded Pokémon
    return;
  }

  const matches = allNames.filter(p => p.name.includes(value)).slice(0, 20); // Limit for performance
  const fetches = matches.map(async p => {
    const id = p.url.split('/').filter(Boolean).pop();
    const pokemon = await fetchPokemonData(id);
    return pokemon;
  });

  const results = await Promise.all(fetches);
  results.forEach(showCard);
});

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
});

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    loadNextBatch();
  }
});

preloadNames();