(function () {
  var $ = function (id) { return document.getElementById(id); };
  var tip = $('tip');
  var pendingTile = null;
  var currentKey = '';
  var nice = function (max) {
    if (max <= 4) return 4;
    var p = Math.pow(10, Math.floor(Math.log10(max)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) if (steps[i] * p * 4 >= max) return steps[i] * p * 4;
    return max;
  };
  function tile(label, value, sub) {
    var d = document.createElement('div');
    d.className = 'tile';
    [['label', label], ['value', value], ['sub', sub || '']].forEach(function (x) {
      var s = document.createElement('div'); s.className = x[0]; s.textContent = x[1]; d.appendChild(s);
    });
    return d;
  }
  function chart(el, days, key, color, label, fmt) {
    el.innerHTML = '';
    var vals = days.map(function (d) { return d[key]; });
    var top = nice(Math.max.apply(null, vals.concat([1])));
    var ay = document.createElement('div'); ay.className = 'axis-y';
    [top, top / 2, 0].forEach(function (v) { var s = document.createElement('span'); s.textContent = Math.round(v); ay.appendChild(s); });
    el.appendChild(ay);
    days.forEach(function (d, i) {
      var w = document.createElement('div'); w.className = 'bar-wrap';
      var b = document.createElement('div'); b.className = 'bar';
      b.style.height = (vals[i] / top * 100) + '%';
      b.style.background = color;
      w.appendChild(b);
      w.addEventListener('mousemove', function (e) {
        tip.style.display = 'block';
        tip.textContent = d.day + ': ' + fmt(vals[i]) + ' ' + label;
        tip.style.left = Math.min(e.clientX + 12, innerWidth - 200) + 'px';
        tip.style.top = (e.clientY - 34) + 'px';
      });
      w.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      w.setAttribute('aria-label', d.day + ': ' + fmt(vals[i]) + ' ' + label);
      el.appendChild(w);
    });
    var ax = document.createElement('div'); ax.className = 'axis-x';
    [days[0].day.slice(5), days[days.length - 1].day.slice(5)].forEach(function (t) { var s = document.createElement('span'); s.textContent = t; ax.appendChild(s); });
    el.appendChild(ax);
  }
  function render(s) {
    var tiles = $('tiles'); tiles.innerHTML = '';
    var today = s.days[s.days.length - 1];
    tiles.appendChild(tile('Total visits', s.plays.toLocaleString(), today.plays + ' today'));
    tiles.appendChild(tile('Visitors (est.)', s.players.toLocaleString(), today.players + ' today'));
    var opened = Object.keys(s.opens).reduce(function (a, k) { return a + s.opens[k]; }, 0);
    tiles.appendChild(tile('Games opened', opened.toLocaleString(), 'taps on a game box'));
    pendingTile = tile('Ideas waiting', String(s.pendingIdeas), 'to read below');
    tiles.appendChild(pendingTile);
    chart($('c-plays'), s.days, 'plays', '#3f8f8a', 'visits', function (v) { return Math.round(v); });
    var t = $('table');
    t.innerHTML = '<tr><th>Day</th><th>Visits</th><th>Visitors</th></tr>';
    s.days.slice().reverse().forEach(function (d) {
      var tr = document.createElement('tr');
      [d.day, d.plays, d.players].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      t.appendChild(tr);
    });
    var o = $('opens');
    o.innerHTML = '<tr><th>Game</th><th>Opened</th></tr>';
    Object.keys(s.opens).sort(function (a, b) { return s.opens[b] - s.opens[a]; }).forEach(function (k) {
      var tr = document.createElement('tr');
      [k, s.opens[k]].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      o.appendChild(tr);
    });
    $('out').classList.remove('hidden');
  }

  // ---- game ideas from players: shown only here, to the owner
  var PICS = {
    dog: 'dog', cat: 'cat', dino: 'dinosaur', robot: 'robot', fish: 'fish', bird: 'bird',
    sea: 'sea', forest: 'forest', space: 'space', city: 'city', farm: 'farm', snow: 'snow',
    build: 'building', cook: 'cooking', drive: 'driving', fly: 'flying', grow: 'growing', music: 'music',
  };
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text; // player text: never innerHTML
    return e;
  }
  function ideaCard(idea, actions) {
    var c = el('div', 'idea');
    if (idea.pic) c.appendChild(el('div', 'meta', 'Icon: ' + (PICS[idea.pic] || idea.pic)));
    if (idea.text) c.appendChild(el('div', 'text', idea.text));
    var m = el('div', 'meta');
    m.dir = 'ltr';
    m.appendChild(document.createTextNode(idea.name ? 'From: ' : 'No name'));
    if (idea.name) m.appendChild(el('bdi', '', idea.name)); // its own text direction, so Hebrew doesn't scramble the line
    var rest = [];
    if (idea.t) rest.push(new Date(idea.t).toLocaleString());
    if (idea.hearts != null) rest.push('♥ ' + idea.hearts);
    if (rest.length) m.appendChild(document.createTextNode(' · ' + rest.join(' · ')));
    c.appendChild(m);
    var row = el('div', 'row');
    actions.forEach(function (a) {
      var b = el('button', a[2] || '', a[0]);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (a[1] === 'remove' && !confirm('Take this idea off the board? Its hearts are lost.')) return;
        b.disabled = true;
        ideaAction(a[1], idea.id);
      });
      row.appendChild(b);
    });
    c.appendChild(row);
    return c;
  }
  function renderIdeas(data) {
    var p = $('pending'), a = $('approved');
    p.textContent = ''; a.textContent = '';
    $('pending-title').textContent = 'Game ideas waiting for you (' + data.pending.length + ')';
    $('approved-title').textContent = 'On the board (' + data.approved.length + ')';
    if (pendingTile) pendingTile.querySelector('.value').textContent = String(data.pending.length);
    if (!data.pending.length) p.appendChild(el('p', 'msg', 'Nothing new.'));
    data.pending.forEach(function (i) { p.appendChild(ideaCard(i, [['Approve', 'approve'], ['Reject', 'reject', 'no']])); });
    if (!data.approved.length) a.appendChild(el('p', 'msg', 'No approved ideas yet.'));
    data.approved.forEach(function (i) { a.appendChild(ideaCard(i, [['Remove from board', 'remove', 'ghost']])); });
  }
  function loadIdeas() {
    fetch('api/ideas?key=' + encodeURIComponent(currentKey), { cache: 'no-store' })
      .then(function (r) { return r.json().then(function (b) { if (!r.ok) throw new Error(b && b.error); return b; }); })
      .then(renderIdeas)
      .catch(function (e) {
        $('pending').textContent = '';
        $('pending').appendChild(el('p', 'msg', (e && e.message) || 'Could not load the ideas.'));
      });
  }
  function ideaAction(type, idea) {
    fetch('api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: type, key: currentKey, idea: idea }),
    }).then(function (r) {
      if (!r.ok) $('status').textContent = 'That did not work (' + r.status + ').';
      loadIdeas();
    }).catch(function () { $('status').textContent = 'Could not reach the server.'; });
  }
  function load(key) {
    currentKey = key;
    $('status').textContent = 'Loading…';
    $('help').classList.add('hidden');
    fetch('api/stats?key=' + encodeURIComponent(key), { cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) { return { r: r, body: body }; });
    }).then(function (x) {
      if (x.r.status === 200) {
        try { localStorage.setItem('dorothy-games-stats-key', key); } catch (e) {}
        $('status').textContent = 'Updated ' + new Date().toLocaleTimeString();
        render(x.body);
        loadIdeas();
        return;
      }
      if (x.r.status === 404) throw { msg: 'The stats function was not found. Make sure the api folder is part of the deployment (Root Directory = portal).', help: true };
      var msg = x.body && x.body.error ? x.body.error : 'Could not load stats (' + x.r.status + ').';
      throw { msg: msg, help: x.r.status === 503 };
    }).catch(function (e) {
      $('out').classList.add('hidden');
      $('status').textContent = e && e.msg ? e.msg : 'Could not load stats. Are you online?';
      if (e && e.help) $('help').classList.remove('hidden');
    });
  }
  $('login').addEventListener('submit', function (e) { e.preventDefault(); load($('key').value); });
  try { var k = localStorage.getItem('dorothy-games-stats-key'); if (k) { $('key').value = k; load(k); } } catch (e) {}
})();
