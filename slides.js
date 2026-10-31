/* ============================================================
   AR & VR — منطق العرض (slides.js)
   - تنقل: الأسهم / المسافة / أزرار على الشاشة / السحب باللمس
   - عدّاد الشرائح + شريط التقدّم
   - ملاحظات المُحاضر + ملء الشاشة + الطباعة
   - خلفية جسيمات تفاعلية
   ============================================================ */
(function () {
  'use strict';

  /* ---------- عناصر ---------- */
  var deck      = document.getElementById('deck');
  var slides    = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var btnPrev   = document.getElementById('btnPrev');
  var btnNext   = document.getElementById('btnNext');
  var cNow      = document.getElementById('cNow');
  var cAll      = document.getElementById('cAll');
  var bar       = document.getElementById('progressBar');
  var notesBox  = document.getElementById('notesPanel');
  var notesBody = document.getElementById('notesBody');
  var notesIdx  = document.getElementById('notesSlide');
  var btnNotes  = document.getElementById('btnNotes');
  var btnNotesClose = document.getElementById('btnNotesClose');
  var btnFull   = document.getElementById('btnFull');
  var btnPrint  = document.getElementById('btnPrint');
  var kbdHint   = document.getElementById('kbdHint');

  var TOTAL = slides.length;
  var index = 0;

  /* ---------- شريط تنسيق الرقم ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  cAll.textContent = pad(TOTAL);

  /* ---------- الانتقال ---------- */
  function goTo(n, silent) {
    n = Math.max(0, Math.min(TOTAL - 1, n));
    if (n === index && silent !== 'init') { render(); return; }
    index = n;
    render();
  }

  function render() {
    slides.forEach(function (s, i) {
      var active = (i === index);
      s.classList.toggle('is-active', active);
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    cNow.textContent = pad(index + 1);
    bar.style.width = (((index + 1) / TOTAL) * 100).toFixed(2) + '%';

    btnPrev.disabled = (index === 0);
    btnNext.disabled = (index === TOTAL - 1);

    notesIdx.textContent = pad(index + 1);
    notesBody.textContent = slides[index].getAttribute('data-notes') || '—';

    if (history.replaceState) {
      history.replaceState(null, '', '#' + (index + 1));
    }
  }

  function next() { if (index < TOTAL - 1) goTo(index + 1); }
  function prev() { if (index > 0) goTo(index - 1); }

  /* ---------- الأزرار ---------- */
  btnNext.addEventListener('click', next);
  btnPrev.addEventListener('click', prev);

  /* ---------- لوحة المفاتيح ---------- */
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (typing) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
      case 'Spacebar':
      case 'Enter':
        e.preventDefault(); next(); break;

      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
      case 'Backspace':
        e.preventDefault(); prev(); break;

      case 'Home':
        e.preventDefault(); goTo(0); break;

      case 'End':
        e.preventDefault(); goTo(TOTAL - 1); break;

      case 'n': case 'N':
        e.preventDefault(); toggleNotes(); break;

      case 'f': case 'F':
        e.preventDefault(); toggleFullscreen(); break;

      case 'p': case 'P':
        e.preventDefault(); window.print(); break;

      case 'Escape':
        if (notesBox.classList.contains('is-open')) { closeNotes(); }
        break;
    }
  });

  /* ---------- السحب باللمس (الجوال) ---------- */
  var touchX = null, touchY = null;
  deck.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });

  deck.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchX;
    var dy = t.clientY - touchY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) next(); else prev();   // في RTL: السحب لليسار = التالي
    }
    touchX = touchY = null;
  }, { passive: true });

  /* ---------- ملاحظات المُحاضر ---------- */
  function openNotes() {
    notesBox.classList.add('is-open');
    notesBox.setAttribute('aria-hidden', 'false');
    btnNotes.setAttribute('aria-pressed', 'true');
  }
  function closeNotes() {
    notesBox.classList.remove('is-open');
    notesBox.setAttribute('aria-hidden', 'true');
    btnNotes.setAttribute('aria-pressed', 'false');
  }
  function toggleNotes() {
    notesBox.classList.contains('is-open') ? closeNotes() : openNotes();
  }
  btnNotes.addEventListener('click', toggleNotes);
  btnNotesClose.addEventListener('click', closeNotes);

  /* ---------- ملء الشاشة ---------- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      (document.documentElement.requestFullscreen || function () {}).call(document.documentElement);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  btnFull.addEventListener('click', toggleFullscreen);

  /* ---------- الطباعة ---------- */
  btnPrint.addEventListener('click', function () { window.print(); });

  /* ---------- تجهيز الطباعة: انتظر تحميل الخطوط أولاً ---------- */
  var printReady = false;
  window.addEventListener('beforeprint', function () {
    if (printReady || !document.fonts || !document.fonts.ready) return;
    printReady = true;
    try {
      document.fonts.ready.then(function () {
        /* إعادة تخطيط الشريحة بعد وصول الخطوط ثم اطبع من جديد */
        render();
      });
    } catch (e) { /* تجاهل */ }
  });
  /* إعادة رسم الشريحة الحالية بعد تحميل الخطوط (لتفادي قفزات التخطيط) */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      slides.forEach(function (s) { s.style.visibility = ''; });
      render();
    });
  }

  /* ---------- إخفاء تلميح لوحة المفاتيح بعد النشاط ---------- */
  var hintTimer = setTimeout(function () {
    if (kbdHint) kbdHint.style.opacity = '0';
  }, 6000);
  document.addEventListener('keydown', function () {
    clearTimeout(hintTimer);
    if (kbdHint) kbdHint.style.opacity = '0';
  }, { once: true });

  /* ---------- رابط مباشر لشرريحة (#3) ---------- */
  function fromHash() {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    return (isFinite(n) && n >= 1 && n <= TOTAL) ? n - 1 : 0;
  }
  window.addEventListener('hashchange', function () { goTo(fromHash()); });

  /* ---------- خلفية الجسيمات ---------- */
  (function particles() {
    var canvas = document.getElementById('fx');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    }

    function build() {
      var count = Math.round(Math.min(70, Math.max(26, (W * H) / 26000)));
      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.6 + 0.6,
          c: Math.random() > 0.62 ? '124,77,255' : '0,229,255'
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (!reduce) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < -20) n.x = W + 20; if (n.x > W + 20) n.x = -20;
          if (n.y < -20) n.y = H + 20; if (n.y > H + 20) n.y = -20;
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + n.c + ',0.55)';
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 17000) {
            var o = (1 - d2 / 17000) * 0.16;
            ctx.strokeStyle = 'rgba(0,229,255,' + o.toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
          }
        }
      }

      if (!reduce) requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    if (!reduce) requestAnimationFrame(frame);
    else frame();
  })();

  /* ---------- تهيئة ---------- */
  goTo(fromHash(), 'init');
})();
