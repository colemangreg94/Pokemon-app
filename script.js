const pokedex = document.getElementById('pokedex');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');
const modalDetails = document.getElementById('modal-details');
const closeModal = document.getElementById('close-modal');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const pageInfo = document.getElementById('page-info');

const maxCount = 1025;
const pageSize = 50;
let currentPage = 1;
let allPokemon = [];

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}

async function fetchPokemonData(id) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  return res.json();
}

async function loadPage(page) {
  pokedex.innerHTML = '';
  pageInfo.textContent = `Page ${page}`;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, maxCount);
  const promises = [];

  for (let i = start; i <= end; i++) {
    promises.push(fetchPokemonData(i));
  }

  const pokemonList = await Promise.all(promises);
  allPokemon = pokemonList;
  pokemonList.forEach(pokemon => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" />
      <p>${capitalize(pokemon.name)}</p>
    `;
    card.addEventListener('click', () => showModal(pokemon));
    pokedex.appendChild(card);
  });

  prevBtn.disabled = page === 1;
  nextBtn.disabled = end === maxCount;
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

searchInput.addEventListener('input', (e) => {
  const value = e.target.value.toLowerCase();
  const filtered = allPokemon.filter(p => p.name.includes(value));
  pokedex.innerHTML = '';
  filtered.forEach(showCard);
});

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

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
});

prevBtn.addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    loadPage(currentPage);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentPage * pageSize < maxCount) {
    currentPage++;
    loadPage(currentPage);
  }
});

loadPage(currentPage);
