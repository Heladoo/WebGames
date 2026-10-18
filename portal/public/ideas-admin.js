(function () {
  var $ = function (id) { return document.getElementById(id); };
  var key = '';
  // English names of the picture ids (src/pictures.ts), so the owner can read an idea at a glance
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
  function card(idea, actions) {
    var c = el('div', 'idea');
    if (idea.pics.length) c.appendChild(el('div', 'meta', 'Pictures: ' + idea.pics.map(function (p) { return PICS[p] || p; }).join(' + ')));
    if (idea.text) c.appendChild(el('div', 'text', idea.text));
    var meta = [];
    meta.push(idea.names.length ? 'Names: ' + idea.names.join(', ') : 'No names');
    if (idea.t) meta.push(new Date(idea.t).toLocaleString());
    if (idea.hearts != null) meta.push('♥ ' + idea.hearts);
    c.appendChild(el('div', 'meta', meta.join(' · ')));
    var row = el('div', 'row');
    actions.forEach(function (a) {
      var b = el('button', a[2] || '', a[0]);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (a[1] === 'remove' && !confirm('Take this idea off the board? Its hearts are lost.')) return;
        b.disabled = true;
        act(a[1], idea.id);
      });
      row.appendChild(b);
    });
    c.appendChild(row);
    return c;
  }
  function render(data) {
    var p = $('pending'), a = $('approved');
    p.textContent = ''; a.textContent = '';
    $('pending-title').textContent = 'Waiting for you (' + data.pending.length + ')';
    $('approved-title').textContent = 'On the board (' + data.approved.length + ')';
    if (!data.pending.length) p.appendChild(el('p', 'msg', 'Nothing new.'));
    data.pending.forEach(function (i) { p.appendChild(card(i, [['Approve', 'approve'], ['Reject', 'reject', 'no']])); });
    if (!data.approved.length) a.appendChild(el('p', 'msg', 'No approved ideas yet.'));
    data.approved.forEach(function (i) { a.appendChild(card(i, [['Remove from board', 'remove', 'ghost']])); });
    $('out').classList.remove('hidden');
  }
  function load() {
    $('status').textContent = 'Loading…';
    fetch('api/ideas?key=' + encodeURIComponent(key), { cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) { return { r: r, body: body }; });
    }).then(function (x) {
      if (x.r.status !== 200) throw new Error(x.body && x.body.error ? x.body.error : 'Could not load ideas (' + x.r.status + ').');
      try { localStorage.setItem('dorothy-games-stats-key', key); } catch (e) {}
      $('status').textContent = 'Updated ' + new Date().toLocaleTimeString();
      render(x.body);
    }).catch(function (e) {
      $('out').classList.add('hidden');
      $('status').textContent = e && e.message ? e.message : 'Could not load ideas. Are you online?';
    });
  }
  function act(type, idea) {
    fetch('api/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: type, key: key, idea: idea }),
    }).then(function (r) {
      if (!r.ok) $('status').textContent = 'That did not work (' + r.status + ').';
      load();
    }).catch(function () { $('status').textContent = 'Could not reach the server.'; });
  }
  $('login').addEventListener('submit', function (e) { e.preventDefault(); key = $('key').value; load(); });
  try { var k = localStorage.getItem('dorothy-games-stats-key'); if (k) { $('key').value = k; key = k; load(); } } catch (e) {}
})();
