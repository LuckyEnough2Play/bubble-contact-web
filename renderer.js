const { ipcRenderer } = require('electron');
let contacts = [];
let simulation;
let searchTerm = '';
let allTags = new Set();
let selectedFilterTags = [];
let formSelectedTags = [];
let focusedContact = null;
let links = [];
const panelWidth = 150;
const svg = d3.select('#bubbleCanvas');
const width = window.innerWidth - panelWidth;
const height = window.innerHeight - 40;
svg.attr('width', width).attr('height', height);
const centerX = width/2;
const centerY = height/2;
const circleGroup = svg.select('#circleGroup');
const linkGroup = svg.select('#linkGroup');
circleGroup.selectAll('circle')
  .data([100,200,300])
  .enter()
  .append('circle')
  .attr('cx', centerX)
  .attr('cy', centerY)
  .attr('r', d=>d)
  .style('fill','none')
  .style('stroke','#444')
  .style('stroke-dasharray','2,2');

function matchesSearch(d){
  if(!searchTerm) return true;
  const t = searchTerm.toLowerCase();
  return (
    d.firstName.toLowerCase().includes(t) ||
    d.lastName.toLowerCase().includes(t) ||
    d.email.toLowerCase().includes(t) ||
    d.tags.join(' ').toLowerCase().includes(t)
  );
}


function updateMatchLevels(){
  if(selectedFilterTags.length===0){
    contacts.forEach(c=>c.matchLevel=null);
  }else{
    contacts.forEach(c=>{
      if(selectedFilterTags.every(t=>c.tags.includes(t))) c.matchLevel=2;
      else if(selectedFilterTags.some(t=>c.tags.includes(t))) c.matchLevel=1;
      else c.matchLevel=0;
    });
  }
}

function updateLinks(){
  const visible = contacts.filter(matchesSearch);
  links = [];
  for(let i=0;i<visible.length;i++){
    for(let j=i+1;j<visible.length;j++){
      if(visible[i].tags.some(t=>visible[j].tags.includes(t))){
        links.push({source:visible[i], target:visible[j]});
      }
    }
  }
  const lineSel = linkGroup.selectAll('line.link').data(links,d=>d.source.id+'-'+d.target.id);
  lineSel.enter().append('line')
    .attr('class','link')
    .style('stroke','#888')
    .style('stroke-dasharray','4,2')
    .style('opacity',0.3);
  lineSel.exit().remove();
}

function applyForces(){
  if(selectedFilterTags.length===0){
    simulation.force('radial', d3.forceRadial(250, centerX, centerY).strength(0.2));
    circleGroup.selectAll('circle').style('display',(d,i)=>i===2?'block':'none');
  }else{
    simulation.force('radial', d3.forceRadial(d=>{
      return d.matchLevel===2?50:d.matchLevel===1?150:250;
    }, centerX, centerY).strength(0.4));
    circleGroup.selectAll('circle').style('display','block');
  }
  if(focusedContact){
    contacts.forEach(c=>{ c.fx=null; c.fy=null; });
    focusedContact.fx = centerX;
    focusedContact.fy = centerY;
  }else{
    contacts.forEach(c=>{ c.fx=null; c.fy=null; });
  }
}

function focusFromBubble(contact){
  focusedContact = contact;
  selectedFilterTags = contact.tags.slice();
  renderTagPanel();
  updateMatchLevels();
  applyForces();
  updateLinks();
  simulation.alpha(1).restart();
}

function render() {
  updateMatchLevels();
  updateLinks();
  applyForces();

  const nodes = svg.selectAll('g.contact').data(contacts, d => d.id);

  const enter = nodes.enter().append('g').attr('class','contact');
  enter.append('circle').attr('r',25).attr('fill','steelblue');
  enter.append('text').attr('text-anchor','middle').attr('dy',5).text(d=>d.firstName);

  const merged = enter.merge(nodes);
  merged.on('click', (event,d)=>{ focusFromBubble(d); openForm(d); });

  nodes.exit().remove();

  svg.selectAll('g.contact')
    .style('display',d=> matchesSearch(d)? null : 'none')
    .style('opacity', d=>{
      if(selectedFilterTags.length===0) return 1;
      return d.matchLevel===2?1:d.matchLevel===1?0.6:0.1;
    });

  simulation.nodes(contacts).on('tick', ticked).alpha(1).restart();
}

function ticked(){
  svg.selectAll('g.contact').attr('transform',d=>`translate(${d.x},${d.y})`);
  linkGroup.selectAll('line.link')
    .attr('x1',d=>d.source.x)
    .attr('y1',d=>d.source.y)
    .attr('x2',d=>d.target.x)
    .attr('y2',d=>d.target.y);
}

function setupSim(){
  simulation = d3.forceSimulation(contacts)
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(centerX, centerY))
    .force('collision', d3.forceCollide(30))
    .force('radial', d3.forceRadial(250, centerX, centerY).strength(0.2));
}

function updateAllTags(){
  allTags = new Set();
  contacts.forEach(c=>c.tags.forEach(t=>allTags.add(t)));
}

function renderTagPanel(){
  updateAllTags();
  const tags = Array.from(allTags);
  tags.sort((a,b)=>{
    const aSel = selectedFilterTags.includes(a);
    const bSel = selectedFilterTags.includes(b);
    if(aSel && !bSel) return -1;
    if(!aSel && bSel) return 1;
    return a.localeCompare(b);
  });
  const panel = d3.select('#tagList').selectAll('div.tag-box').data(tags, d=>d);
  const enter = panel.enter().append('div').attr('class','tag-box');
  enter.merge(panel)
    .classed('selected', d=>selectedFilterTags.includes(d))
    .text(d=>d)
    .on('click',(event,d)=>toggleFilterTag(d));
  panel.exit().remove();
}

function toggleFilterTag(tag){
  const idx = selectedFilterTags.indexOf(tag);
  if(idx===-1) selectedFilterTags.push(tag); else selectedFilterTags.splice(idx,1);
  focusedContact = null;
  renderTagPanel();
  render();
}

function clearFilterTags(){
  selectedFilterTags = [];
  focusedContact = null;
  renderTagPanel();
  render();
}

function renderTagOptions(){
  const tags = Array.from(allTags).sort();
  const opts = d3.select('#tag-options').selectAll('div.tag-box').data(tags,d=>d);
  const enter = opts.enter().append('div').attr('class','tag-box');
  enter.merge(opts)
    .classed('selected', d=>formSelectedTags.includes(d))
    .text(d=>d)
    .on('click',(event,d)=>toggleFormTag(d));
  opts.exit().remove();
}

function toggleFormTag(tag){
  const idx = formSelectedTags.indexOf(tag);
  if(idx===-1) formSelectedTags.push(tag); else formSelectedTags.splice(idx,1);
  renderTagOptions();
}

function openForm(contact){
  document.getElementById('sidepanel').classList.add('open');
  document.getElementById('contact-id').value = contact ? contact.id : '';
  document.getElementById('firstName').value = contact?contact.firstName:'';
  document.getElementById('lastName').value = contact?contact.lastName:'';
  document.getElementById('email').value = contact?contact.email:'';
  formSelectedTags = contact ? [...contact.tags] : [];
  document.getElementById('newTag').value = '';
  renderTagOptions();
}

function closeForm(){
  document.getElementById('sidepanel').classList.remove('open');
}

document.getElementById('add-bubble').addEventListener('click',()=>openForm());
document.getElementById('close').addEventListener('click',closeForm);
document.getElementById('clearTags').addEventListener('click', clearFilterTags);

document.getElementById('contact-form').addEventListener('submit',e=>{
  e.preventDefault();
  const id = document.getElementById('contact-id').value;
  const c = {
    id: id || Date.now().toString(),
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    tags: formSelectedTags.slice()
  };
  if(id){
    const idx = contacts.findIndex(x=>x.id===id);
    contacts[idx]=c;
  }else{
    c.x = width - 60;
    c.y = height - 60;
    contacts.push(c);
  }
  ipcRenderer.send('save-contacts', contacts);
  renderTagPanel();
  closeForm();
  render();
  updateLinks();
});

async function load(){
  contacts = await ipcRenderer.invoke('load-contacts');
  if(contacts.length === 0){
    contacts.push({
      id: Date.now().toString(),
      firstName:'John',
      lastName:'Doe',
      email:'john@example.com',
      tags:['sample']
    });
  }
  contacts.forEach(c=>{
    c.x = Math.random()*width;
    c.y = Math.random()*height;
  });
  setupSim();
  updateAllTags();
  renderTagPanel();
  render();
  updateLinks();
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
  updateAllTags();
  renderTagPanel();
  render();
  updateLinks();
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

document.getElementById('search').addEventListener('input', e=>{
  searchTerm = e.target.value;
  render();
});

document.getElementById('newTag').addEventListener('keydown',e=>{
  if(e.key === 'Enter'){
    e.preventDefault();
    const tag = e.target.value.trim();
    if(tag){
      allTags.add(tag);
      if(!formSelectedTags.includes(tag)) formSelectedTags.push(tag);
      renderTagOptions();
      renderTagPanel();
    }
    e.target.value='';
  }
});

load();
