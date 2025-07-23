const { ipcRenderer } = require('electron');
let contacts = [];
let simulation;
const svg = d3.select('#viz');
const width = window.innerWidth;
const height = window.innerHeight - 40;
svg.attr('width', width).attr('height', height);

function render() {
  const nodes = svg.selectAll('g.contact').data(contacts, d => d.id);

  const enter = nodes.enter().append('g').attr('class','contact');
  enter.append('circle').attr('r',25).attr('fill','steelblue');
  enter.append('text').attr('text-anchor','middle').attr('dy',5).text(d=>d.firstName);
  enter.on('click', (event,d)=>openForm(d));

  nodes.exit().remove();

  simulation.nodes(contacts).on('tick', ticked).alpha(1).restart();
}

function ticked(){
  svg.selectAll('g.contact').attr('transform',d=>`translate(${d.x},${d.y})`);
}

function setupSim(){
  simulation = d3.forceSimulation(contacts)
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width/2, height/2))
    .force('collision', d3.forceCollide(30));
}

function openForm(contact){
  document.getElementById('sidepanel').classList.add('open');
  document.getElementById('contact-id').value = contact ? contact.id : '';
  document.getElementById('firstName').value = contact?contact.firstName:'';
  document.getElementById('lastName').value = contact?contact.lastName:'';
  document.getElementById('email').value = contact?contact.email:'';
  document.getElementById('tags').value = contact?contact.tags.join(', '):'';
}

function closeForm(){
  document.getElementById('sidepanel').classList.remove('open');
}

document.getElementById('add').addEventListener('click',()=>openForm());
document.getElementById('close').addEventListener('click',closeForm);

document.getElementById('contact-form').addEventListener('submit',e=>{
  e.preventDefault();
  const id = document.getElementById('contact-id').value;
  const c = {
    id: id || Date.now().toString(),
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    tags: document.getElementById('tags').value.split(',').map(s=>s.trim()).filter(Boolean)
  };
  if(id){
    const idx = contacts.findIndex(x=>x.id===id);
    contacts[idx]=c;
  }else{
    contacts.push(c);
  }
  ipcRenderer.send('save-contacts', contacts);
  closeForm();
  render();
});

async function load(){
  contacts = await ipcRenderer.invoke('load-contacts');
  contacts.forEach(c=>{
    c.x = Math.random()*width;
    c.y = Math.random()*height;
  });
  setupSim();
  render();
}

async function importCsv(){
  const res = await ipcRenderer.invoke('import-csv');
  if(res.canceled) return;
  const csv = res.content.split(/\r?\n/).filter(Boolean);
  const headers = csv.shift().split(',');
  csv.forEach(line=>{
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h,i)=>obj[h]=cols[i]);
    contacts.push({
      id: Date.now().toString()+Math.random(),
      firstName: obj['First Name']||'',
      lastName: obj['Last Name']||'',
      email: obj['E-mail Address']||'',
      tags: (obj['Categories']||'').split(';').filter(Boolean)
    });
  });
  ipcRenderer.send('save-contacts', contacts);
  render();
}

document.getElementById('import').addEventListener('click', importCsv);

document.getElementById('export').addEventListener('click', async()=>{
  const header = ['First Name','Last Name','E-mail Address','Categories'];
  const lines = contacts.map(c=>{
    return [c.firstName,c.lastName,c.email,c.tags.join(';')].join(',');
  });
  const csv = header.join(',')+'\n'+lines.join('\n');
  await ipcRenderer.invoke('export-csv', csv);
});

load();
