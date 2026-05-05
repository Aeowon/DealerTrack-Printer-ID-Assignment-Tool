document.addEventListener('DOMContentLoaded', function() {

function getTabAndFrame(cb) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs[0]) { cb(null, null); return; }
    chrome.webNavigation.getAllFrames({ tabId: tabs[0].id }, function(frames) {
      var dmsFrame = (frames || []).find(function(f) {
        return f.url && f.url.indexOf('dms10a.dealertrackdms') !== -1;
      });
      cb(tabs[0].id, dmsFrame || null);
    });
  });
}

function run(func, args, cb) {
  getTabAndFrame(function(tabId, frame) {
    if (!tabId || !frame) { cb(null); return; }
    chrome.scripting.executeScript({
      target: { tabId: tabId, frameIds: [frame.frameId] },
      func: func,
      args: args,
      world: 'MAIN'
    }, function(results) {
      if (chrome.runtime.lastError || !results || !results[0]) { cb(null); return; }
      cb(results[0].result);
    });
  });
}

function previewFn(args) {
  var gridEl = document.querySelector('[puiwdgt="grid"]');
  if (!gridEl || !gridEl.grid || !gridEl.grid.dataArray) return null;
  var rows = gridEl.grid.dataArray;
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function matches(val, find) {
    if (!find) return true;
    return val.toUpperCase().indexOf(find.toUpperCase()) !== -1;
  }
  function calcNew(oldVal, find, rep) {
    if (!find) return rep.toUpperCase();
    try { return oldVal.replace(new RegExp(escRe(find), 'gi'), rep).toUpperCase(); }
    catch(e) { return rep.toUpperCase(); }
  }
  var out = [];
  rows.forEach(function(row, i) {
    var oldVal = row[5] || '';
    if (matches(oldVal, args.find)) {
      out.push({ id: 'Row '+(i+1), old: oldVal, nv: calcNew(oldVal, args.find, args.replace) });
    }
  });
  return out;
}

function replaceFn(args) {
  var gridEl = document.querySelector('[puiwdgt="grid"]');
  if (!gridEl || !gridEl.grid || !gridEl.grid.dataArray) return null;
  var rows = gridEl.grid.dataArray;
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function matches(val, find) {
    if (!find) return true;
    return val.toUpperCase().indexOf(find.toUpperCase()) !== -1;
  }
  function calcNew(oldVal, find, rep) {
    if (!find) return rep.toUpperCase();
    try { return oldVal.replace(new RegExp(escRe(find), 'gi'), rep).toUpperCase(); }
    catch(e) { return rep.toUpperCase(); }
  }
  var count = 0;
  for (var i = 0; i < rows.length; i++) {
    var oldVal = rows[i][5] || '';
    if (matches(oldVal, args.find)) {
      gridEl.grid.setDataValue(i + 1, '$PRID', calcNew(oldVal, args.find, args.replace));
      count++;
    }
  }
  gridEl.grid.refresh();
  return count;
}

function clearFn() {
  var gridEl = document.querySelector('[puiwdgt="grid"]');
  if (!gridEl || !gridEl.grid || !gridEl.grid.dataArray) return null;
  var rows = gridEl.grid.dataArray;
  for (var i = 0; i < rows.length; i++) {
    gridEl.grid.setDataValue(i + 1, '$PRID', '');
  }
  gridEl.grid.refresh();
  return rows.length;
}

function exportFn() {
  var gridEl = document.querySelector('[puiwdgt="grid"]');
  if (!gridEl || !gridEl.grid || !gridEl.grid.dataArray) return null;
  return gridEl.grid.dataArray.map(function(row) { return row[5] || ''; });
}

var fi = document.getElementById('fi');
var ri = document.getElementById('ri');
var pv = document.getElementById('pv');
var doBtn = document.getElementById('doBtn');
var clearBtn = document.getElementById('clearBtn');
var exportBtn = document.getElementById('exportBtn');
var importBtn = document.getElementById('importBtn');
var importFile = document.getElementById('importFile');
var status = document.getElementById('status');
var err = document.getElementById('err');

function vals() {
  return { find: fi.value, replace: ri.value };
}

function preview() {
  run(previewFn, [vals()], function(rows) {
    err.style.display = rows === null ? 'block' : 'none';
    if (rows === null || rows.length === 0) {
      pv.textContent = rows === null ? '' : 'No matching fields.';
      doBtn.disabled = true; doBtn.className = ''; doBtn.textContent = 'Replace All (0)'; return;
    }
    doBtn.disabled = false; doBtn.className = 'on';
    doBtn.textContent = 'Replace All (' + rows.length + ')';
    pv.innerHTML = rows.map(function(r) {
      return '<div style="border-bottom:1px solid #eee;padding:1px 0"><b>' + r.id + '</b>: ' +
        '<span class="clickable-val" data-val="' + (r.old||'').replace(/"/g, '&quot;') + '" style="color:#c00;cursor:pointer" title="Click to search">' + (r.old||'(empty)') + '</span>' +
        ' &rarr; <b style="color:#060">' + (r.nv||'(empty)') + '</b></div>';
    }).join('');
    pv.querySelectorAll('.clickable-val').forEach(function(el) {
      el.addEventListener('click', function() {
        fi.value = this.getAttribute('data-val');
        fi.dispatchEvent(new Event('input'));
      });
    });
  });
}

doBtn.addEventListener('click', function() {
  doBtn.disabled = true; doBtn.textContent = 'Working...';
  run(replaceFn, [vals()], function(count) {
    if (count !== null) { status.textContent = '\u2713 Updated ' + count + ' field(s).'; preview(); }
  });
});

clearBtn.addEventListener('click', function() {
  if (!confirm('Clear ALL Printer ID fields?')) return;
  run(clearFn, [], function(count) {
    if (count !== null) { status.textContent = '\u2713 Cleared ' + count + ' field(s).'; preview(); }
  });
});

exportBtn.addEventListener('click', function() {
  run(exportFn, [], function(values) {
    if (!values) { status.textContent = 'Export failed - grid not found.'; return; }
    var blob = new Blob([values.join('\n')], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'printer-ids.txt';
    a.click();
    status.textContent = '\u2713 Exported ' + values.length + ' row(s).';
  });
});

importBtn.addEventListener('click', function() {
  importFile.click();
});

importFile.addEventListener('change', function() {
  var file = importFile.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var lines = e.target.result.split('\n').map(function(l) { return l.trim().toUpperCase(); });
    run(function(lines) {
      var gridEl = document.querySelector('[puiwdgt="grid"]');
      if (!gridEl || !gridEl.grid || !gridEl.grid.dataArray) return null;
      var count = Math.min(lines.length, gridEl.grid.dataArray.length);
      for (var i = 0; i < count; i++) {
        gridEl.grid.setDataValue(i + 1, '$PRID', lines[i]);
      }
      gridEl.grid.refresh();
      return count;
    }, [lines], function(count) {
      if (count !== null) { status.textContent = '\u2713 Imported ' + count + ' row(s).'; preview(); }
      importFile.value = '';
    });
  };
  reader.readAsText(file);
});

fi.addEventListener('input', preview);
ri.addEventListener('input', preview);

preview();

}); // end DOMContentLoaded