(function () {
  var $ = function (id) { return document.getElementById(id); };
  var tip = $('tip');
  var fmtTime = function (s) {
    var h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return h ? h + 'h ' + m + 'm' : m + 'm';
  };
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
    var vals = days.map(function (d) { return key === 'minutes' ? d.seconds / 60 : d[key]; });
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
    tiles.appendChild(tile('Total plays', s.plays.toLocaleString(), today.plays + ' today'));
    tiles.appendChild(tile('Players (est.)', s.players.toLocaleString(), today.players + ' today'));
    tiles.appendChild(tile('Total play time', fmtTime(s.seconds), fmtTime(today.seconds) + ' today'));
    tiles.appendChild(tile('Avg per play', s.plays ? fmtTime(s.seconds / s.plays) : '-', 'minutes per session'));
    chart($('c-plays'), s.days, 'plays', '#3f8f8a', 'plays', function (v) { return Math.round(v); });
    chart($('c-time'), s.days, 'minutes', '#e3685b', 'minutes', function (v) { return Math.round(v); });
    var t = $('table');
    t.innerHTML = '<tr><th>Day</th><th>Plays</th><th>Players</th><th>Minutes</th></tr>';
    s.days.slice().reverse().forEach(function (d) {
      var tr = document.createElement('tr');
      [d.day, d.plays, d.players, Math.round(d.seconds / 60)].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      t.appendChild(tr);
    });
    $('out').classList.remove('hidden');
  }
  function load(key) {
    $('status').textContent = 'Loading…';
    $('help').classList.add('hidden');
    fetch('api/stats?key=' + encodeURIComponent(key), { cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) { return { r: r, body: body }; });
    }).then(function (x) {
      if (x.r.status === 200) {
        try { localStorage.setItem('word-trail-stats-key', key); } catch (e) {}
        $('status').textContent = 'Updated ' + new Date().toLocaleTimeString();
        render(x.body);
        return;
      }
      if (x.r.status === 404) throw { msg: 'The stats function was not found. Make sure the api folder is part of the deployment (Root Directory = word-trail).', help: true };
      var msg = x.body && x.body.error ? x.body.error : 'Could not load stats (' + x.r.status + ').';
      throw { msg: msg, help: x.r.status === 503 };
    }).catch(function (e) {
      $('out').classList.add('hidden');
      $('status').textContent = e && e.msg ? e.msg : 'Could not load stats. Are you online?';
      if (e && e.help) $('help').classList.remove('hidden');
    });
  }
  $('login').addEventListener('submit', function (e) { e.preventDefault(); load($('key').value); });
  try { var k = localStorage.getItem('word-trail-stats-key'); if (k) { $('key').value = k; load(k); } } catch (e) {}
})();
