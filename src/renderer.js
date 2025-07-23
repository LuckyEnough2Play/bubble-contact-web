const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

const dataPath = path.join(__dirname, '..', 'contacts.json');
let contacts = [];

function loadContacts() {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8');
    contacts = JSON.parse(raw);
  } catch (e) {
    contacts = [];
  }
}

function saveContacts() {
  fs.writeFileSync(dataPath, JSON.stringify(contacts, null, 2));
}

function createSVG() {
  const svg = d3.select('#bubble-container').append('svg')
    .attr('width', window.innerWidth)
    .attr('height', window.innerHeight);

  return svg;
}

let svg = createSVG();
let simulation;

function render() {
  svg.selectAll('*').remove();

  const nodes = contacts.map(c => Object.assign({}, c));
  const g = svg.selectAll('g').data(nodes, d => d.id).join('g');

  g.append('circle')
    .attr('r', 40)
    .attr('class', 'circle');

  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .text(d => d.firstName);

  g.on('click', (_, d) => openDetail(d));

  simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(window.innerWidth/2, window.innerHeight/2))
    .force('collision', d3.forceCollide(45))
    .on('tick', () => {
      g.attr('transform', d => `translate(${d.x},${d.y})`);
    });
}

function openDetail(contact) {
  const panel = document.getElementById('side-panel');
  const content = document.getElementById('detail-content');
  content.innerHTML = '';
  for (const key of ['firstName','lastName','email']) {
    const div = document.createElement('div');
    const label = document.createElement('label');
    label.textContent = key;
    const input = document.createElement('input');
    input.value = contact[key] || '';
    input.addEventListener('change', () => {
      contact[key] = input.value;
      saveContacts();
      render();
    });
    div.appendChild(label);
    div.appendChild(input);
    content.appendChild(div);
  }
  panel.classList.add('show');
}

document.getElementById('close-panel').addEventListener('click', () => {
  document.getElementById('side-panel').classList.remove('show');
});

document.getElementById('add-btn').addEventListener('click', () => {
  const newContact = { id: Date.now().toString(), firstName: 'New', lastName: 'Contact' };
  contacts.push(newContact);
  saveContacts();
  render();
  openDetail(newContact);
});

window.addEventListener('resize', () => {
  svg.attr('width', window.innerWidth).attr('height', window.innerHeight);
  simulation.force('center', d3.forceCenter(window.innerWidth/2, window.innerHeight/2));
});

loadContacts();
render();
