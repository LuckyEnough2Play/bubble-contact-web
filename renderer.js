const { ipcRenderer } = require('electron');
let contacts = [];
let simulation;
let searchTerm = '';
let allTags = new Set();
let tagCounts = new Map();
let selectedFilterTags = [];
let formSelectedTags = [];
let focusedContact = null;
let links = [];
const panelWidth = 225;
const sidePanelWidth = 300;
let sidePanelOpen = false;
const svg = d3.select('#bubbleCanvas');
let width = window.innerWidth - panelWidth;
const height = window.innerHeight - 40;
svg.attr('width', width).attr('height', height);
let centerX = width/2;
const centerY = height/2;
const viewGroup = svg.select('#viewGroup');
const circleGroup = viewGroup.select('#circleGroup');
const linkGroup = viewGroup.select('#linkGroup');
const contactGroup = viewGroup.select('#contactGroup');
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStart = {x:0, y:0};
let zoneRadii = (()=>{
  const maxR = Math.min(width,height)/2 - 50;
  return [maxR*0.3, maxR*0.6, maxR];
})();

function computeRadius(c){
  const name = (`${c.firstName} ${c.lastName}`.trim() || c.email || '');
  const len = name.length;
  const base = len * 4 + 8; // approximate text width plus a small margin
  return Math.min(90, Math.max(25, base));
}

function createBubbleGradient(id){
  const defs = svg.select('defs');
  const cx = 20 + Math.random()*60;
  const cy = 20 + Math.random()*60;
  const grad = defs.append('radialGradient')
    .attr('id', id)
    .attr('cx', `${cx}%`)
    .attr('cy', `${cy}%`)
    .attr('r', '70%');
  const hue1 = Math.random() * 360;
  const hue2 = (hue1 + 60 + Math.random()*120) % 360;
  const color1 = d3.hsl(hue1, 0.7, 0.6).toString();
  const color2 = d3.hsl(hue2, 0.7, 0.4).toString();
  const midHue = (hue1 + hue2) / 2;
  const colorMid = d3.hsl(midHue, 0.8, 0.5).toString();
  grad.append('stop').attr('offset','0%').attr('stop-color','rgba(255,255,255,0.9)');
  grad.append('stop').attr('offset','50%').attr('stop-color',color1);
  grad.append('stop').attr('offset','75%').attr('stop-color',colorMid);
  grad.append('stop').attr('offset','100%').attr('stop-color',color2);
}
circleGroup.selectAll('circle')
  .data(zoneRadii)
  .enter()
  .append('circle')
  .attr('cx', centerX)
  .attr('cy', centerY)
  .attr('r', d=>d)
  .style('fill','none')
  .style('stroke','#444')
  .style('stroke-dasharray','2,2');

function updateDimensions(){
  width = window.innerWidth - panelWidth - (sidePanelOpen ? sidePanelWidth : 0);
  centerX = width/2;
  svg.attr('width', width);
  const maxR = Math.min(width,height)/2 - 50;
  zoneRadii = [maxR*0.3, maxR*0.6, maxR];
  circleGroup.selectAll('circle')
    .data(zoneRadii)
    .attr('r', d=>d)
    .attr('cx', centerX)
    .attr('cy', centerY);
  applyZoom(zoomLevel);
  if(simulation){
    simulation.force('center', d3.forceCenter(centerX, centerY));
    applyForces();
    simulation.alpha(1).restart();
  }
}

function matchesSearch(d){
  if(!searchTerm) return true;
  const t = searchTerm.toLowerCase();
  return (
    d.firstName.toLowerCase().includes(t) ||
    d.lastName.toLowerCase().includes(t) ||
    d.email.toLowerCase().includes(t) ||
    d.phone.toLowerCase().includes(t) ||
    d.address.toLowerCase().includes(t) ||
    d.title.toLowerCase().includes(t) ||
    d.company.toLowerCase().includes(t) ||
    d.tags.join(' ').toLowerCase().includes(t)
  );
}


function updateMatchLevels(){
  if(selectedFilterTags.length===0){
    contacts.forEach(c=>c.matchLevel=null);
  }else{
    contacts.forEach(c=>{
      const includesAll = selectedFilterTags.every(t=>c.tags.includes(t));
      if(includesAll && c.tags.length === selectedFilterTags.length) {
        c.matchLevel = 2;
      } else if(includesAll || selectedFilterTags.some(t=>c.tags.includes(t))) {
        c.matchLevel = 1;
      } else {
        c.matchLevel = 0;
      }
    });
  }
}

function updateLinks(){
  const visible = contacts.filter(matchesSearch);
  links = [];
  for(let i=0;i<visible.length;i++){
    for(let j=i+1;j<visible.length;j++){
      const shared = visible[i].tags.filter(t=>visible[j].tags.includes(t)).length;
      if(shared>0){
        links.push({source:visible[i], target:visible[j], weight:shared});
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
    simulation.force('radial', d3.forceRadial(zoneRadii[2], centerX, centerY).strength(0.2));
    circleGroup.selectAll('circle').style('display',(d,i)=>i===2?'block':'none');
  }else{
    simulation.force('radial', d3.forceRadial(d=>{
      return d.matchLevel===2?zoneRadii[0]:d.matchLevel===1?zoneRadii[1]:zoneRadii[2];
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

  const nodes = contactGroup.selectAll('g.contact').data(contacts, d => d.id);

  const enter = nodes.enter().append('g').attr('class','contact');
  enter.append('circle')
    .attr('class','bubble-circle')
    .attr('r',d=>d.radius)
    .attr('fill',d=>`url(#${d.gradientId})`)
    .attr('filter','url(#marbleShadow)');
  enter.append('circle')
    .attr('class','bubble-highlight')
    .attr('r',d=>d.radius)
    .attr('fill','url(#bubbleHighlight)');
  enter.append('text').attr('text-anchor','middle').attr('dy',5).text(d=>`${d.firstName} ${d.lastName}`.trim());

  const merged = enter.merge(nodes);
  merged.on('click', (event,d)=>{ focusFromBubble(d); openForm(d); })
    .call(dragBehavior());
  merged.select('text').text(d=>`${d.firstName} ${d.lastName}`.trim());
  merged.select('circle.bubble-circle')
    .attr('r', d=>d.radius)
    .attr('fill', d => {
    if(selectedFilterTags.length && d.matchLevel === 2) return 'url(#marbleGold)';
    return `url(#${d.gradientId})`;
  });
  merged.select('circle.bubble-highlight')
    .attr('r', d=>d.radius);

  nodes.exit().remove();

  contactGroup.selectAll('g.contact')
    .style('display',d=> matchesSearch(d)? null : 'none')
    .style('opacity', d=>{
      if(selectedFilterTags.length===0) return 1;
      return d.matchLevel===2?1:d.matchLevel===1?0.6:0.1;
    });

  simulation.nodes(contacts).on('tick', ticked).alpha(1).restart();
}

function ticked(){
  contactGroup.selectAll('g.contact').attr('transform',d=>`translate(${d.x},${d.y})`);
  linkGroup.selectAll('line.link')
    .attr('x1',d=>d.source.x)
    .attr('y1',d=>d.source.y)
    .attr('x2',d=>d.target.x)
    .attr('y2',d=>d.target.y);
}

// Enable dragging/throwing of bubbles with smooth return.
// Inspired by D3 drag behavior documentation.
function dragBehavior(){
  let prev = null;
  function dragstarted(event, d){
    if(!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = event.x;
    d.fy = event.y;
    prev = {x:event.x, y:event.y};
  }
  function dragged(event, d){
    d.fx = event.x;
    d.fy = event.y;
    d.vx = event.x - prev.x;
    d.vy = event.y - prev.y;
    prev = {x:event.x, y:event.y};
  }
  function dragended(event, d){
    if(!event.active) simulation.alphaTarget(0.05);
    d.fx = null;
    d.fy = null;
    prev = null;
  }
  return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
}

// Idle drift speed for contacts. Increase the strength for faster motion.
function randomDrift(strength=0.1){
  let nodes;
  function force(){
    for(const n of nodes){
      n.vx += (Math.random()-0.5)*strength;
      n.vy += (Math.random()-0.5)*strength;
    }
  }
  force.initialize = _=>{ nodes = _; };
  return force;
}

// Draws contacts with shared tags toward one another.
function tagAttract(strength=0.05){
  return function(alpha){
    for(const l of links){
      const dx = l.target.x - l.source.x;
      const dy = l.target.y - l.source.y;
      const k = strength * alpha * (l.weight || 1);
      l.source.vx += dx * k;
      l.source.vy += dy * k;
      l.target.vx -= dx * k;
      l.target.vy -= dy * k;
    }
  };
}

function setupSim(){
  simulation = d3.forceSimulation(contacts)
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(centerX, centerY))
    .force('collision', d3.forceCollide(d=>d.radius + 5))
    .force('radial', d3.forceRadial(250, centerX, centerY).strength(0.2))
    .force('drift', randomDrift(0.1))
    .force('tagAttract', tagAttract(0.05));
  // Keep a bit more energy in the simulation so bubbles continue drifting
  simulation.alphaTarget(0.05);
}

function updateAllTags(){
  allTags = new Set();
  tagCounts = new Map();
  contacts.forEach(c=>{
    c.tags.forEach(t=>{
      allTags.add(t);
      tagCounts.set(t, (tagCounts.get(t)||0)+1);
    });
  });
}

function renderTagPanel(){
  updateAllTags();
  const tags = Array.from(allTags);
  tags.sort((a,b)=>{
    const diff = (tagCounts.get(b)||0) - (tagCounts.get(a)||0);
    if(diff!==0) return diff;
    return a.localeCompare(b);
  });
  const panel = d3.select('#tagList').selectAll('div.tag-box').data(tags, d=>d);
  const enter = panel.enter().append('div').attr('class','tag-box');
  enter.merge(panel)
    .classed('selected', d=>selectedFilterTags.includes(d))
    .text(d=>`${d} (${tagCounts.get(d)||0})`)
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
  const active = tags.filter(t=>formSelectedTags.includes(t));
  const inactive = tags.filter(t=>!formSelectedTags.includes(t));
  active.sort();
  inactive.sort();

  const activeSel = d3.select('#active-tags').selectAll('div.tag-box').data(active,d=>d);
  const activeEnter = activeSel.enter().append('div').attr('class','tag-box selected');
  activeEnter.merge(activeSel)
    .text(d=>d)
    .on('click',(event,d)=>{
      // Prevent the document click handler from closing the side panel when
      // tags are clicked and immediately removed/re-added
      event.stopPropagation();
      toggleFormTag(d);
    });
  activeSel.exit().remove();

  const availSel = d3.select('#available-tags').selectAll('div.tag-box').data(inactive,d=>d);
  const availEnter = availSel.enter().append('div').attr('class','tag-box');
  availEnter.merge(availSel)
    .text(d=>d)
    .on('click',(event,d)=>{
      // Prevent the document click handler from closing the side panel when
      // tags are clicked and immediately removed/re-added
      event.stopPropagation();
      toggleFormTag(d);
    });
  availSel.exit().remove();
}


function toggleFormTag(tag){
  const idx = formSelectedTags.indexOf(tag);
  if(idx===-1) formSelectedTags.push(tag); else formSelectedTags.splice(idx,1);
  renderTagOptions();
}

function openForm(contact){
  document.body.classList.add('panel-open');
  sidePanelOpen = true;
  updateDimensions();
  document.getElementById('sidepanel').classList.add('open');
  document.getElementById('contact-id').value = contact ? contact.id : '';
  document.getElementById('firstName').value = contact?contact.firstName:'';
  document.getElementById('lastName').value = contact?contact.lastName:'';
  document.getElementById('email').value = contact?contact.email:'';
  document.getElementById('phone').value = contact?contact.phone||'':'';
  document.getElementById('address').value = contact?contact.address||'':'';
  document.getElementById('title').value = contact?contact.title||'':'';
  document.getElementById('company').value = contact?contact.company||'':'';
  formSelectedTags = contact ? [...contact.tags] : [];
  document.getElementById('newTag').value = '';
  renderTagOptions();
  const delBtn = document.getElementById('delete-contact');
  if(delBtn) delBtn.style.display = contact ? 'block' : 'none';
}

function closeForm(){
  document.body.classList.remove('panel-open');
  sidePanelOpen = false;
  updateDimensions();
  document.getElementById('sidepanel').classList.remove('open');
}

function deleteContact(){
  const id = document.getElementById('contact-id').value;
  if(!id) { closeForm(); return; }
  if(!confirm('Delete this contact?')) return;
  const idx = contacts.findIndex(c=>c.id===id);
  if(idx!==-1){
    contacts.splice(idx,1);
    ipcRenderer.send('save-contacts', contacts);
    renderTagPanel();
    closeForm();
    render();
    updateLinks();
  }
}

document.getElementById('add-bubble').addEventListener('click',()=>openForm());
document.getElementById('close').addEventListener('click',closeForm);
document.getElementById('clearTags').addEventListener('click', clearFilterTags);
document.getElementById('delete-contact').addEventListener('click', deleteContact);

// Close the side panel when clicking anywhere outside of it
document.addEventListener('click', (e) => {
  const panel = document.getElementById('sidepanel');
  if (!panel.classList.contains('open')) return;

  const addBtn = document.getElementById('add-bubble');
  const inContact = e.target.closest('g.contact');

  // Only close if the click was outside the panel and not on the add button or a contact bubble
  if (!panel.contains(e.target) && e.target !== addBtn && !inContact) {
    closeForm();
  }
});

document.getElementById('contact-form').addEventListener('submit',e=>{
  e.preventDefault();
  const newTagInput = document.getElementById('newTag');
  const pendingTag = newTagInput.value.trim();
  if(pendingTag){
    pendingTag.split(/[,;]+/).map(t=>t.trim()).filter(Boolean).forEach(t=>{
      allTags.add(t);
      if(!formSelectedTags.includes(t)) formSelectedTags.push(t);
    });
    newTagInput.value = '';
  }
  const id = document.getElementById('contact-id').value;
  const c = {
    id: id || Date.now().toString(),
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    title: document.getElementById('title').value,
    company: document.getElementById('company').value,
    tags: formSelectedTags.slice()
  };
  if(c.company && !c.tags.includes(c.company)){
    c.tags.push(c.company);
    allTags.add(c.company);
  }
  c.radius = computeRadius(c);
  const existing = contacts.find(x=>x.id===id);
  c.gradientId = existing ? existing.gradientId : 'grad-'+c.id;
  if(!existing) createBubbleGradient(c.gradientId);
  if(id){
    const idx = contacts.findIndex(x=>x.id===id);
    c.x = contacts[idx].x;
    c.y = contacts[idx].y;
    contacts[idx]=c;
  }else{
    // Start new contacts in the primary center position so they are
    // easy to locate immediately after saving.
    c.x = centerX;
    c.y = centerY;
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
      phone:'555-1234',
      address:'123 Main St',
      title:'Manager',
      company:'Example Inc',
      tags:['sample']
    });
  }
  contacts.forEach(c=>{
    c.x = Math.random()*width;
    c.y = Math.random()*height;
    c.radius = computeRadius(c);
    c.gradientId = 'grad-'+c.id;
    createBubbleGradient(c.gradientId);
  });
  setupSim();
  updateAllTags();
  renderTagPanel();
  render();
  updateLinks();
  applyZoom(zoomLevel);
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
    const c = {
      id: Date.now().toString()+Math.random(),
      firstName:'',
      lastName:'',
      email:'',
      phone:'',
      address:'',
      title:'',
      company:'',
      tags:[]
    };
    headers.forEach((h,i)=>{
      const v = cols[i]||'';
      const lower = h.toLowerCase();
      if(lower === 'first name') c.firstName = v;
      else if(lower === 'last name') c.lastName = v;
      else if(lower.includes('email')) c.email = v;
      else if(lower.includes('phone')) c.phone = v;
      else if(lower.includes('address') || lower.includes('street')) c.address = v;
      else if(lower.includes('company')) c.company = v;
      else if(lower.includes('job title') || lower === 'title') c.title = v;
      else if(lower === 'categories') c.tags = v.split(';').filter(Boolean);
    });
    c.x = Math.random()*width;
    c.y = Math.random()*height;
    c.radius = computeRadius(c);
    c.gradientId = 'grad-'+c.id;
    createBubbleGradient(c.gradientId);
    contacts.push(c);
  });
  ipcRenderer.send('save-contacts', contacts);
  updateAllTags();
  renderTagPanel();
  render();
  updateLinks();
}


async function exportCsv(){
  const header = ['First Name','Last Name','E-mail Address','Business Phone','Business Street','Company','Job Title','Categories'];
  const lines = contacts.map(c=>{
    return [
      c.firstName,
      c.lastName,
      c.email,
      c.phone||'',
      c.address||'',
      c.company||'',
      c.title||'',
      c.tags.join(';')
    ].join(',');
  });
  const csv = header.join(',')+'\n'+lines.join('\n');
  await ipcRenderer.invoke('export-csv', csv);
}

const importBtn = document.getElementById('import');
if(importBtn) importBtn.addEventListener('click', importCsv);
const exportBtn = document.getElementById('export');
if(exportBtn) exportBtn.addEventListener('click', exportCsv);
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');
let resultsHovered = false;
const zoomSlider = document.getElementById('zoom-slider');
const zoomDisplay = document.getElementById('zoom-display');
const zoomResetBtn = document.getElementById('zoom-reset');

function applyZoom(level){
  zoomLevel = Math.min(2, Math.max(0.5, level));
  viewGroup.attr('transform', `translate(${centerX*(1-zoomLevel)+panX},${centerY*(1-zoomLevel)+panY}) scale(${zoomLevel})`);
  if(zoomSlider){
    zoomSlider.value = Math.round(zoomLevel*100);
  }
  if(zoomDisplay){
    zoomDisplay.textContent = `${Math.round(zoomLevel*100)}%`;
  }
}

if(zoomSlider){
  zoomSlider.addEventListener('input', e=>{
    applyZoom(e.target.value/100);
  });
}
if(zoomResetBtn){
  zoomResetBtn.addEventListener('click', () => {
    panX = 0;
    panY = 0;
    applyZoom(1);
  });
}

svg.node().addEventListener('wheel', e=>{
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.1 : -0.1;
  applyZoom(zoomLevel + delta);
});

svg.node().addEventListener('mousedown', e => {
  if(e.button !== 0) return;
  if(e.target.closest('g.contact')) return;
  isPanning = true;
  panStart = {x: e.clientX, y: e.clientY};
});

window.addEventListener('mousemove', e => {
  if(!isPanning) return;
  const dx = e.clientX - panStart.x;
  const dy = e.clientY - panStart.y;
  panX += dx;
  panY += dy;
  panStart = {x: e.clientX, y: e.clientY};
  applyZoom(zoomLevel);
});

window.addEventListener('mouseup', () => { isPanning = false; });
svg.node().addEventListener('mouseleave', () => { isPanning = false; });

function clearSearch(){
  searchTerm = '';
  if(searchInput) searchInput.value = '';
  if(searchResults){
    searchResults.innerHTML = '';
    searchResults.style.display = 'none';
  }
}

function updateSearchResults(){
  if(!searchResults) return;
  searchResults.innerHTML = '';
  if(!searchTerm){
    searchResults.style.display = 'none';
    return;
  }
  const matches = contacts.filter(matchesSearch).slice(0,5);
  matches.forEach(c=>{
    const div = document.createElement('div');
    const name = `${c.firstName} ${c.lastName}`.trim() || c.email;
    div.textContent = name;
    div.addEventListener('click',()=>{
      clearSearch();
      focusFromBubble(c);
      openForm(c);
      render();
    });
    searchResults.appendChild(div);
  });
  searchResults.style.display = matches.length? 'block' : 'none';
}

searchInput.addEventListener('input', e=>{
  searchTerm = e.target.value;
  render();
  updateSearchResults();
});

searchInput.addEventListener('blur', ()=>{
  setTimeout(()=>{ if(!resultsHovered){ clearSearch(); render(); } }, 100);
});

searchResults.addEventListener('mouseenter',()=>{ resultsHovered = true; });
searchResults.addEventListener('mouseleave',()=>{ resultsHovered = false; clearSearch(); render(); });

document.getElementById('newTag').addEventListener('keydown',e=>{
  if(e.key === 'Enter'){
    e.preventDefault();
    const tags = e.target.value.trim();
    if(tags){
      tags.split(/[,;]+/).map(t=>t.trim()).filter(Boolean).forEach(t=>{
        allTags.add(t);
        if(!formSelectedTags.includes(t)) formSelectedTags.push(t);
      });
      renderTagOptions();
      renderTagPanel();
    }
    e.target.value='';
  }
});


window.addEventListener('resize', () => {
  updateDimensions();
  render();
});

ipcRenderer.on('window-resized', () => {
  updateDimensions();
  render();
});

ipcRenderer.on('menu-import', importCsv);
ipcRenderer.on('menu-export', exportCsv);
ipcRenderer.on('menu-focus-search', () => {
  const input = document.getElementById('search');
  if(input) input.focus();
});

load();
