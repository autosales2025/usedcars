/* Lawrence Auto Sales - app.js (no CMS) */

const grid = document.getElementById('grid');
const stats = document.getElementById('stats');
const q = document.getElementById('q');
const bodyType = document.getElementById('bodyType');
const yearMin = document.getElementById('yearMin');
const yearMax = document.getElementById('yearMax');
const priceMax = document.getElementById('priceMax');
const resetBtn = document.getElementById('resetBtn');
const showSold = document.getElementById('showSold');
const sortBy = document.getElementById('sortBy');
const activeCount = document.getElementById('activeCount');
document.getElementById('year').textContent = new Date().getFullYear();

const FORMSPREE_ENDPOINT = ""; // optional

const BUSINESS = {
  name: 'Lawrence Auto Sales-LLC',
  phone: '9132869320',
  email: 'toufik.djarount@hotmail.com',
  // Use either a street address OR "lat,lng" here:
  address: '2400 Ponderose drive, Lawrence, KS 66044',
  // address: '38.9717,-95.2353', // example: coordinates
  tz: 'America/Chicago',
  hours: {
    mon: [{ open: '08:00', close: '14:00' }],
    tue: [{ open: '08:00', close: '14:00' }],
    wed: [{ open: '08:00', close: '14:00' }],
    thu: [{ open: '08:00', close: '14:00' }],
    fri: [{ open: '08:00', close: '14:00' }],
    sat: [{ open: '08:00', close: '18:00' }],
    sun: [{ open: '08:00', close: '18:00' }]
  }
};

let CARS = [];

/* Populate year filters (last 30 yrs) */
const currentYear = new Date().getFullYear();
Array.from({ length: 30 }, (_, i) => currentYear - i).forEach(y => {
  yearMin.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);
  yearMax.insertAdjacentHTML('beforeend', `<option value="${y}">${y}</option>`);
});

/* Helpers */
const money = n => n?.toLocaleString?.('en-US', { style: 'currency', currency: 'USD' }) ?? '$—';
const num = v => (v === undefined || v === null || isNaN(+v)) ? Infinity : +v;

/* Detect "lat,lng" */
function parseLatLng(s){
  const m = String(s).trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  return m ? { lat: m[1], lng: m[2] } : null;
}

function computeActiveFilters() {
  let c = 0;
  if (q.value.trim()) c++;
  if (bodyType.value) c++;
  if (yearMin.value) c++;
  if (yearMax.value) c++;
  if (priceMax.value) c++;
  if (showSold.checked) c++;
  if ((sortBy?.value || 'featuredNew') !== 'featuredNew') c++;
  activeCount.hidden = c === 0;
  if (c > 0) activeCount.textContent = String(c);
}

/* Filter + sort */
function filterCars() {
  const qv = q.value.trim().toLowerCase();
  const bt = bodyType.value;
  const ymin = +yearMin.value || -Infinity;
  const ymax = +yearMax.value || Infinity;
  const pmax = +priceMax.value || Infinity;

  return CARS.filter(c => {
    const text = `${c.year} ${c.make} ${c.model} ${c.trim || ''} ${c.color || ''} ${c.bodyType || ''}`.toLowerCase();
    const hit = !qv || text.includes(qv);
    const passType = !bt || c.bodyType === bt;
    const passYears = c.year >= ymin && c.year <= ymax;
    const passPrice = (c.price ?? Infinity) <= pmax;
    const passSold = showSold.checked ? true : (c.status !== 'sold');
    return hit && passType && passYears && passPrice && passSold;
  });
}
function sortCars(list) {
  const key = sortBy?.value || 'featuredNew';
  if (key === 'featuredNew') {
    return list.sort((a, b) => {
      const f = (b.featured === true) - (a.featured === true);
      if (f) return f;
      const y = (b.year || 0) - (a.year || 0); if (y) return y;
      const m = num(a.mileage) - num(b.mileage); if (m) return m;
      return num(a.price) - num(b.price);
    });
  }
  if (key === 'priceAsc')   return list.sort((a,b)=> num(a.price) - num(b.price) || (b.year||0)-(a.year||0));
  if (key === 'priceDesc')  return list.sort((a,b)=> num(b.price) - num(a.price) || (b.year||0)-(a.year||0));
  if (key === 'yearDesc')   return list.sort((a,b)=> (b.year||0) - (a.year||0) || num(a.price)-num(b.price));
  if (key === 'yearAsc')    return list.sort((a,b)=> (a.year||0) - (b.year||0) || num(a.price)-num(b.price));
  if (key === 'mileageAsc') return list.sort((a,b)=> num(a.mileage)-num(b.mileage) || (b.year||0)-(a.year||0));
  if (key === 'mileageDesc')return list.sort((a,b)=> num(b.mileage)-num(a.mileage) || (b.year||0)-(a.year||0));
  return list;
}

/* Render cards */
function render() {
  const list = sortCars(filterCars());
  stats.textContent = `${list.length} car${list.length !== 1 ? 's' : ''} shown • ${CARS.length} total`;
  grid.innerHTML = '';
  const tpl = document.getElementById('card-tpl');

  list.forEach(c => {
    const node = tpl.content.cloneNode(true);
    const card = node.querySelector('.card');

    const img = node.querySelector('.thumb');
    img.src = (c.photos && c.photos[0]) ||
      'https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=1200&auto=format&fit=crop';
    img.alt = `${c.year} ${c.make} ${c.model}`;

    const video = node.querySelector('.walkaround');
    if (c.video) { video.src = c.video; video.hidden = false; }

    const totalPhotos = (c.photos && c.photos.length) || 1;

    // Overlay label
    const overlayBtn = node.querySelector('.gallery-btn');
    overlayBtn.textContent = `View ${totalPhotos} photo${totalPhotos > 1 ? 's' : ''}`;

    // Wire BOTH photos buttons (overlay + actions-row)
    const openGallery = () => openLightbox(c.photos || [img.src]);
    node.querySelectorAll('.gallery-btn, .photos-btn').forEach(btn => btn.onclick = openGallery);

    node.querySelector('.title').textContent =
      `${c.year} ${c.make} ${c.model}${c.trim ? ' ' + c.trim : ''}`;
    node.querySelector('.meta').textContent =
      [c.bodyType, c.transmission, c.fuel, c.color].filter(Boolean).join(' • ');
    node.querySelector('.desc').textContent = c.description || '—';
    node.querySelector('.price').textContent = money(c.price);
    node.querySelector('.condition').textContent = c.status === 'sold' ? 'Sold' : (c.condition || 'Used');
    node.querySelector('.mileage').textContent = c.mileage ? `${(+c.mileage).toLocaleString()} mi` : '';

    if (c.status === 'sold') { node.querySelector('.flag.sold').hidden = false; card.classList.add('sold'); }
    if (c.featured === true) { node.querySelector('.flag.featured').hidden = false; card.classList.add('featured'); }

    const subject = encodeURIComponent(`Inquiry: ${c.year} ${c.make} ${c.model} (${c.id || ''})`);
    const body = encodeURIComponent(`Hello,\nI’m interested in the ${c.year} ${c.make} ${c.model} (ID: ${c.id || 'N/A'}).\nIs it still available?\n\nThanks!`);
    node.querySelector('.email').href = `mailto:${(c.contact && c.contact.email) || BUSINESS.email}?subject=${subject}&body=${body}`;

    const callBtn = node.querySelector('.wa');
    callBtn.textContent = 'Call';
    const phone = (c.contact && c.contact.phone ? c.contact.phone : BUSINESS.phone).replace(/[^\d+]/g, '');
    callBtn.href = phone ? `tel:${phone}` : '#';

    node.querySelector('.details-btn').onclick = () => openDetails(c);

    grid.appendChild(node);
  });

  computeActiveFilters();
  populateVehicleSelect(list);
  populateApptVehicleSelect(list);
}

/* Lightbox */
function openLightbox(urls) {
  if (!urls || !urls.length) return;
  const dlg = document.getElementById('lightbox');
  const img = document.getElementById('lbImg');
  const dots = document.getElementById('lbDots');
  let i = 0;
  function set(idx) {
    i = (idx + urls.length) % urls.length;
    img.src = urls[i];
    dots.querySelectorAll('button').forEach((b, j) => b.classList.toggle('active', j === i));
  }
  dots.innerHTML = urls.map((_, j) => `<button aria-label="Photo ${j + 1}"></button>`).join('');
  dots.querySelectorAll('button').forEach((b, j) => b.onclick = () => set(j));
  set(0);
  dlg.showModal();
  document.getElementById('closeLb').onclick = () => dlg.close();
}

/* Details modal */
function openDetails(car) {
  const dlg = document.getElementById('detailsDlg');
  const hero = document.getElementById('detailsHero');
  const thumbs = document.getElementById('detailsThumbs');
  const title = document.getElementById('detailsTitle');
  const price = document.getElementById('detailsPrice');
  const desc  = document.getElementById('detailsDesc');
  const specs = document.getElementById('detailsSpecs');
  const feats = document.getElementById('detailsFeatures');
  const aEmail = document.getElementById('detailsEmail');
  const aCall  = document.getElementById('detailsCall');

  const photos = (car.photos && car.photos.length ? car.photos : [
    'https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=1200&auto=format&fit=crop'
  ]);

  hero.src = photos[0];
  hero.alt = `${car.year} ${car.make} ${car.model}`;
  thumbs.innerHTML = photos.map((u,i)=>`<img src="${u}" alt="Photo ${i+1}" data-i="${i}" class="${i===0?'active':''}">`).join('');
  thumbs.querySelectorAll('img').forEach(img=>{
    img.onclick = () => {
      thumbs.querySelectorAll('img').forEach(t=>t.classList.remove('active'));
      img.classList.add('active'); hero.src = img.src;
    };
  });

  title.textContent = `${car.year} ${car.make} ${car.model}${car.trim ? ' ' + car.trim : ''}`;
  price.textContent = car.price != null ? car.price.toLocaleString('en-US',{style:'currency',currency:'USD'}) : '—';
  desc.textContent  = car.description || 'No additional description provided.';

  const items = [
    ['Body', car.bodyType],
    ['Mileage', car.mileage != null ? `${(+car.mileage).toLocaleString()} mi` : '—'],
    ['Transmission', car.transmission || '—'],
    ['Fuel', car.fuel || '—'],
    ['Color', car.color || '—'],
    ['VIN', car.vin || '—'],
    ['Location', car.location || '—'],
    ['Condition', car.status === 'sold' ? 'Sold' : (car.condition || 'Used')]
  ];
  specs.innerHTML = items.map(([k,v])=>`<li><b>${k}:</b> ${v}</li>`).join('');

  feats.innerHTML = (car.features && car.features.length)
    ? car.features.map(f=>`<span class="chip">${f}</span>`).join('')
    : '';

  const subject = encodeURIComponent(`Inquiry: ${car.year} ${car.make} ${car.model} (${car.id || ''})`);
  const body = encodeURIComponent(`Hello,\nI'm interested in the ${car.year} ${car.make} ${car.model}.\n\nThanks!`);
  aEmail.href = `mailto:${(car.contact && car.contact.email) || 'sales@example.com'}?subject=${subject}&body=${body}`;
  const phone = (car.contact && car.contact.phone ? car.contact.phone : '').replace(/[^\d+]/g, '');
  aCall.href = phone ? `tel:${phone}` : '#';

  dlg.showModal();
  document.getElementById('detailsClose').onclick = () => dlg.close();
}

/* Hours / Contact + MAP */
const dayKeys = ['sun','mon','tue','wed','thu','fri','sat'];
const dayLabels = { sun:'Sunday', mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday', sat:'Saturday' };
const parseHM = hm => { const [h,m]=hm.split(':').map(Number); return h*60+m; };

function nowInTZ(tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit'
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const w = map.weekday.toLowerCase().slice(0,3);
  const mins = parseInt(map.hour,10)*60 + parseInt(map.minute,10);
  const idx = ['sun','mon','tue','wed','thu','fri','sat'].indexOf(w);
  return { dayKey: dayKeys[idx], dayIndex: idx, minutes: mins };
}

/* DISPLAY-ONLY time */
function fmtTimeHM(hm) {
  const [h, m] = hm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function computeOpenState(schedule, tz) {
  const now = nowInTZ(tz);
  const today = schedule[now.dayKey] || [];
  for (const block of today) {
    const s = parseHM(block.open), e = parseHM(block.close);
    if (now.minutes >= s && now.minutes < e) return { open: true, until: block.close };
  }
  for (let off = 0; off < 7; off++) {
    const idx = (now.dayIndex + off) % 7;
    const key = dayKeys[idx];
    const blocks = schedule[key] || [];
    if (blocks.length) {
      if (off === 0) {
        for (const b of blocks) if (parseHM(b.open) > now.minutes) return { open: false, nextDayKey: key, at: b.open };
      } else {
        return { open: false, nextDayKey: key, at: blocks[0].open };
      }
    }
  }
  return { open: false };
}

function renderContact() {
  const phoneLink = document.getElementById('contactPhone');
  const emailLink = document.getElementById('contactEmail');
  const addrSpan  = document.getElementById('contactAddress');
  const hoursTbody= document.getElementById('hoursList');
  const openBadge = document.getElementById('openBadge');
  const nextOpen  = document.getElementById('nextOpenText');
  const dirLink   = document.getElementById('directionsLink');

  phoneLink.href = `tel:${BUSINESS.phone.replace(/[^\d+]/g,'')}`;
  phoneLink.textContent = BUSINESS.phone;
  emailLink.href = `mailto:${BUSINESS.email}`;
  emailLink.textContent = BUSINESS.email;

  // Show whatever you stored (address string OR "lat,lng")
  addrSpan.textContent = BUSINESS.address;

  // Map & Directions
  const coords = parseLatLng(BUSINESS.address);
  const mapFrame = document.getElementById('mapFrame');
  if (coords) {
    const { lat, lng } = coords;
    if (mapFrame) mapFrame.src =
      `https://www.google.com/maps?ll=${lat},${lng}&q=${lat},${lng}&z=15&output=embed`;
    if (dirLink) dirLink.href =
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  } else {
    if (mapFrame) mapFrame.src =
      `https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.address)}&output=embed`;
    if (dirLink) dirLink.href =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.address)}`;
  }

  // Timezone labels
  const tz1 = document.getElementById('tzLabel');
  const tz2 = document.getElementById('tzLabel2');
  if (tz1) tz1.textContent = BUSINESS.tz;
  if (tz2) tz2.textContent = BUSINESS.tz;

  // Hours table
  hoursTbody.innerHTML = '';
  const now = nowInTZ(BUSINESS.tz);
  dayKeys.forEach((k,i)=>{
    const tr = document.createElement('tr');
    if (i === now.dayIndex) tr.classList.add('today');
    const nameTd = document.createElement('td'); nameTd.textContent = dayLabels[k];
    const timeTd = document.createElement('td'); timeTd.className = 'time';
    const blocks = BUSINESS.hours[k] || [];
    timeTd.textContent = blocks.length
      ? blocks.map(b=>`${fmtTimeHM(b.open)}–${fmtTimeHM(b.close)}`).join(', ')
      : 'Closed';
    tr.append(nameTd, timeTd);
    hoursTbody.appendChild(tr);
  });

  const state = computeOpenState(BUSINESS.hours, BUSINESS.tz);
  if (state.open) {
    openBadge.textContent = 'Open now';
    openBadge.className = 'open-badge open';
    nextOpen.textContent = `Closes today at ${fmtTimeHM(state.until)}.`;
  } else {
    openBadge.textContent = 'Closed';
    openBadge.className = 'open-badge closed';
    nextOpen.textContent = (state.nextDayKey && state.at)
      ? `Opens ${dayLabels[state.nextDayKey]} at ${fmtTimeHM(state.at)}.`
      : 'No hours available.';
  }
}

/* Contact form */
function populateVehicleSelect(list){
  const sel = document.getElementById('cfVehicle'); if(!sel) return;
  sel.innerHTML = `<option value="">(Optional) Select a car</option>`;
  list.forEach(c=>{
    const label = `${c.year} ${c.make} ${c.model}${c.trim?' '+c.trim:''}${c.id?` (#${c.id})`:''}`;
    sel.insertAdjacentHTML('beforeend', `<option value="${label}">${label}</option>`);
  });
}
function wireContactForm(){
  const form = document.getElementById('contactForm'); if(!form) return;
  const status = document.getElementById('cfStatus');
  const btn = document.getElementById('cfSubmit');

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); status.className='cf-status'; status.textContent=''; btn.disabled=true; btn.textContent='Sending…';
    const payload = {
      type:'contact',
      name: document.getElementById('cfName').value.trim(),
      email: document.getElementById('cfEmail').value.trim(),
      phone: document.getElementById('cfPhone').value.trim(),
      vehicle: document.getElementById('cfVehicle').value,
      message: document.getElementById('cfMessage').value.trim(),
      best_time: document.getElementById('cfBestTime').value.trim()
    };
    if(!payload.name || !payload.email || !payload.message){
      status.classList.add('err'); status.textContent='Please fill name, email, and message.';
      btn.disabled=false; btn.textContent='Send'; return;
    }
    if(FORMSPREE_ENDPOINT){
      try{
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error();
        form.reset(); status.classList.add('ok'); status.textContent='Thanks! Your message has been sent.';
      }catch{
        status.classList.add('err'); status.textContent='Could not send right now. Please try again.';
      }finally{ btn.disabled=false; btn.textContent='Send'; }
    } else {
      const subject = encodeURIComponent('Website contact');
      const lines = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        payload.phone?`Phone: ${payload.phone}`:null,
        payload.vehicle?`Vehicle: ${payload.vehicle}`:null,
        payload.best_time?`Preferred time: ${payload.best_time}`:null,
        '', payload.message
      ].filter(Boolean).join('\n');
      window.location.href = `mailto:${BUSINESS.email}?subject=${subject}&body=${encodeURIComponent(lines)}`;
      btn.disabled=false; btn.textContent='Send'; status.classList.add('ok'); status.textContent='Opening your email app…';
    }
  });
}

/* Appointment scheduler */
function populateApptVehicleSelect(list){
  const sel = document.getElementById('apVehicle'); if(!sel) return;
  sel.innerHTML = `<option value="">Select a car</option>`;
  list.forEach(c=>{
    const label = `${c.year} ${c.make} ${c.model}${c.trim?' '+c.trim:''}${c.id?` (#${c.id})`:''}`;
    sel.insertAdjacentHTML('beforeend', `<option value="${label}">${label}</option>`);
  });
}
function slotsForDate(dateStr){
  const [y,m,d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m-1, d, 0, 0, 0));
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: BUSINESS.tz, weekday: 'short' })
              .format(dt).toLowerCase().slice(0,3);
  const dayKey = {sun:'sun',mon:'mon',tue:'tue',wed:'wed',thu:'thu',fri:'fri',sat:'sat'}[wd];
  const blocks = BUSINESS.hours[dayKey] || [];
  const out = [];
  blocks.forEach(b=>{
    let start = parseHM(b.open), end = parseHM(b.close);
    for(let t=start; t+30<=end; t+=30){
      const hh = String(Math.floor(t/60)).padStart(2,'0');
      const mm = String(t%60).padStart(2,'0');
      out.push(`${hh}:${mm}`);
    }
  });

  const now = nowInTZ(BUSINESS.tz);
  const todayKey = dayKeys[now.dayIndex];
  if (dayKey === todayKey) return out.filter(hm => parseHM(hm) > now.minutes + 15);
  return out;
}
function buildApptSlots(){
  const dateEl = document.getElementById('apDate');
  const sel = document.getElementById('apSlot');
  sel.innerHTML = '';
  if(!dateEl.value){ sel.innerHTML = `<option value="">Pick a date first</option>`; return; }
  const slots = slotsForDate(dateEl.value);
  if(!slots.length){ sel.innerHTML = `<option value="">No slots on this date</option>`; return; }
  sel.insertAdjacentHTML('beforeend', `<option value="">Select a time</option>`);
  slots.forEach(hm => sel.insertAdjacentHTML('beforeend', `<option value="${hm}">${fmtTimeHM(hm)}</option>`));
}
function defaultApptDate(){
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS.tz, year:'numeric', month:'2-digit', day:'2-digit' });
  const todayStr = fmt.format(new Date()).replaceAll('/','-');
  let d = new Date(todayStr);
  for(let i=0;i<14;i++){
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), da=String(d.getDate()).padStart(2,'0');
    const iso = `${y}-${m}-${da}`;
    if (slotsForDate(iso).length) return iso;
    d.setDate(d.getDate()+1);
  }
  return todayStr;
}
function wireApptForm(){
  const form = document.getElementById('apptForm'); if(!form) return;
  const dateEl = document.getElementById('apDate');
  const status = document.getElementById('apStatus');
  const btn = document.getElementById('apSubmit');

  dateEl.value = defaultApptDate();
  buildApptSlots();
  dateEl.addEventListener('change', buildApptSlots);

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); status.className='cf-status'; status.textContent=''; btn.disabled=true; btn.textContent='Booking…';
    const payload = {
      type:'appointment',
      name:document.getElementById('apName').value.trim(),
      email:document.getElementById('apEmail').value.trim(),
      phone:document.getElementById('apPhone').value.trim(),
      vehicle:document.getElementById('apVehicle').value,
      date:document.getElementById('apDate').value,
      time:document.getElementById('apSlot').value,
      notes:document.getElementById('apNotes').value.trim(),
      tz:BUSINESS.tz
    };
    if(!payload.name || !payload.email || !payload.vehicle || !payload.date || !payload.time){
      status.classList.add('err'); status.textContent='Please fill name, email, vehicle, date and time.';
      btn.disabled=false; btn.textContent='Book appointment'; return;
    }

    if(FORMSPREE_ENDPOINT){
      try{
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        if(!res.ok) throw new Error();
        form.reset();
        status.classList.add('ok'); status.textContent='Booked! We’ll email a confirmation shortly.';
        document.getElementById('apDate').value = defaultApptDate(); buildApptSlots();
      }catch{
        status.classList.add('err'); status.textContent='Could not book right now. Please try again.';
      }finally{ btn.disabled=false; btn.textContent='Book appointment'; }
    } else {
      const subject = encodeURIComponent(`Appointment request - ${payload.vehicle}`);
      const bodyLines = [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        payload.phone ? `Phone: ${payload.phone}` : null,
        `Vehicle: ${payload.vehicle}`,
        `Requested: ${payload.date} ${fmtTimeHM(payload.time)} (${BUSINESS.tz})`,
        payload.notes ? `Notes: ${payload.notes}` : null
      ].filter(Boolean).join('\n');
      window.location.href = `mailto:${BUSINESS.email}?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
      btn.disabled=false; btn.textContent='Book appointment'; status.classList.add('ok'); status.textContent='Opening your email app…';
    }
  });
}

/* Render all */
function renderAll(){ render(); renderContact(); }

/* Load inventory */
async function load(){
  try{
    const res = await fetch('inventory.json', { cache:'no-store' });
    if(!res.ok) throw new Error();
    const data = await res.json();
    CARS = Array.isArray(data) ? data : (data?.cars || []);
    if (!Array.isArray(CARS)) throw new Error('Inventory format not recognized');
  }catch{
    console.warn('Could not load inventory.json. Using empty list.');
    CARS = [];
  }

  renderAll();
  wireContactForm();
  wireApptForm();
  setInterval(renderContact, 60 * 1000);
}

/* Events */
[q, bodyType, yearMin, yearMax, priceMax, showSold, sortBy].forEach(el => el.addEventListener('input', renderAll));
resetBtn.addEventListener('click', () => {
  q.value=''; bodyType.value=''; yearMin.value=''; yearMax.value=''; priceMax.value='';
  showSold.checked=false; sortBy.value='featuredNew'; renderAll();
});

/* Go! */
load();
