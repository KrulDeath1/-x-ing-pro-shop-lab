// Temporary test harness (run in the app page): replays Blueprint's "Track Flare Explained" (2012) appendix drillings
// through our simulator. Rows: [lowToPAP, highToPAP, lowRG, totalDiff, intDiff, flareOil, flareDry, label]
window.BP = {
  rows: [
    // Study 1 (pin distance, VAL 30): Omen
    [0.74,6.54,2.471,.062,.005,1.6,1.6,'Om 1.1/50'],[1.77,6.47,2.474,.057,.005,3.4,2.5,'Om 2.25/50'],[2.94,6.58,2.478,.053,.007,4.2,3.4,'Om 3.4/50'],[4.32,6.00,2.480,.051,.010,4.0,3.4,'Om 4.5/50'],[5.80,5.40,2.480,.051,.011,2.6,3.0,'Om 5.6/50'],
    // 508A
    [0.66,6.21,2.516,.052,.003,1.2,1.0,'508 1.1/50'],[1.60,5.88,2.519,.049,.007,2.6,1.8,'508 2.25/50'],[2.73,5.55,2.523,.046,.011,3.4,2.5,'508 3.4/50'],[4.15,5.16,2.526,.044,.015,3.3,2.9,'508 4.5/50'],[5.83,4.74,2.526,.045,.018,2.5,3.0,'508 5.6/50'],
    [0.65,6.59,2.516,.056,.010,1.1,0.9,'508 1.1/90'],[1.58,6.61,2.520,.052,.012,2.5,2.1,'508 2.25/90'],[2.75,6.44,2.523,.048,.015,3.2,2.8,'508 3.4/90'],[4.30,6.12,2.526,.045,.018,3.0,3.2,'508 4.5/90'],[6.04,5.76,2.526,.046,.018,2.0,2.8,'508 5.6/90'],
    // 919C
    [0.49,6.26,2.527,.055,.014,0.9,0.7,'919 1.1/50'],[1.33,5.67,2.530,.051,.016,2.1,1.7,'919 2.25/50'],[2.38,5.15,2.534,.047,.020,3.1,2.0,'919 3.4/50'],[3.72,4.72,2.537,.045,.025,3.5,2.6,'919 4.5/50'],[5.52,4.36,2.538,.046,.028,3.3,3.2,'919 5.6/50'],
    [0.43,6.65,2.528,.057,.020,0.9,0.7,'919 1.1/90'],[1.35,6.62,2.531,.053,.023,2.0,1.7,'919 2.25/90'],[2.50,6.52,2.535,.049,.026,2.5,2.3,'919 3.4/90'],[4.12,6.37,2.538,.046,.029,2.3,2.7,'919 4.5/90'],[6.13,6.20,2.538,.046,.029,1.5,2.2,'919 5.6/90'],
    // Study 2 (VAL), 50 DA
    [3.09,6.15,2.475,.059,.010,4.8,3.5,'Om V10 3.4'],[2.79,6.67,2.480,.048,.005,3.8,3.1,'Om V50 3.4'],[5.68,5.26,2.477,.059,.014,3.5,3.8,'Om V10 5.6'],[5.90,5.81,2.483,.045,.008,1.9,2.3,'Om V50 5.6'],[5.88,5.90,2.483,.048,.009,1.3,1.6,'Om V90 5.6'],
    [5.66,4.74,2.521,.053,.020,3.5,3.7,'508 V10 5.6'],[6.18,5.29,2.530,.036,.010,1.2,1.8,'508 V70 5.6'],
    [2.67,5.11,2.531,.053,.024,3.9,2.4,'919 V10 3.4'],[5.42,4.40,2.532,.053,.030,4.0,3.6,'919 V10 5.6'],[6.17,4.62,2.541,.037,.021,2.1,2.7,'919 V70 5.6'],
    // Study 3 (DA, 5 3/4)
    [5.95,5.37,2.480,.052,.011,2.2,2.9,'Om D10 V30'],[6.08,5.95,2.484,.044,.007,1.4,1.5,'Om D10 V55'],
    [5.95,3.93,2.526,.042,.010,2.1,2.1,'508 D10 V30'],[6.22,5.71,2.526,.046,.018,1.6,2.4,'508 D90 V30'],[6.47,6.28,2.529,.038,.014,0.5,0.7,'508 D90 V55'],
    [5.63,2.23,2.537,.040,.015,2.5,2.0,'919 D10 V30'],[5.59,3.36,2.537,.044,.023,3.2,2.8,'919 D30 V30'],[5.72,4.33,2.537,.046,.028,3.2,3.2,'919 D50 V30'],[6.01,5.26,2.537,.047,.030,2.5,2.9,'919 D70 V30'],[6.33,6.19,2.537,.046,.028,1.1,1.6,'919 D90 V30'],
    [5.82,1.74,2.542,.033,.014,1.7,1.5,'919 D10 V55'],[6.23,4.37,2.542,.038,.024,2.3,2.5,'919 D50 V55'],[6.56,6.55,2.542,.039,.025,0.1,0.1,'919 D90 V55'],
  ],
  run(opt = {}) {
    const d = window.__dbg(), { V, R } = d, K = opt.K ?? 1, mirror = opt.mirror ?? 1;
    const base = d.last.state.lane, pat = d.ALL_PATTERNS.find(p => p.n === (opt.pat || '2025 PBA Chameleon'));
    const lane = { ...base, pat, grid: pat.grid, len: pat.d, eff: pat.eff, calib: opt.calib ?? 1, cond: 'fresh' };
    const ball = { core: 'asym', cover: opt.cover || 'solid', grit: opt.grit || '2000', rg: 2.5, diff: 0.05, intdiff: 0.01, weight: 15 };
    const fr = d.makeFriction(lane, ball, null); if (opt.pen != null) fr.trackPen = opt.pen;
    const out = [];
    for (const r of this.rows) {
      const [lo, hi, rg, td, id, fo, fd, lab] = r;
      const a = lo / R, b = hi / R, sa = Math.sin(a);
      const eLow = [sa, 0, Math.cos(a)];
      let c = -Math.cos(b) / sa; c = Math.max(-1, Math.min(1, c));
      const e1 = [Math.cos(a), 0, -sa], e2 = [0, mirror, 0];
      const eHigh = V.norm(V.add(V.sc(e1, c), V.sc(e2, Math.sqrt(1 - c * c))));
      const eInt = V.cross(eLow, eHigh);
      const ks = [[eLow, rg / 12], [eHigh, (rg + td * K) / 12], [eInt, (rg + (td - id) * K) / 12]];
      const I = [[0,0,0],[0,0,0],[0,0,0]], Inv = [[0,0,0],[0,0,0],[0,0,0]];
      for (const [e, k] of ks) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { I[i][j] += k * k * e[i] * e[j]; Inv[i][j] += e[i] * e[j] / (k * k); }
      const tilt = opt.tilt ?? 20, rot = opt.rot ?? 60, th = tilt * d.D2R, ph = rot * d.D2R, axis = [-Math.cos(th) * Math.cos(ph), -Math.cos(th) * Math.sin(ph), Math.sin(th)];
      const cfg = { mph: opt.mph ?? 18, rpm: opt.rpm ?? 300, tilt, rot, laydown: opt.lay ?? 10, inert: { I, Inv }, fr, q0: d.qFromTo([0, 0, 1], axis) };
      if (opt.boards) { const run = d.simulate(cfg, opt.alpha ?? 1.0, true); const at = y => { const p = d.interpAtY(run.pts, y); return p ? +p.b.toFixed(1) : null; }; const st = d.motionStats(run, opt.alpha ?? 1); out.push({ lab, b49: at(49), b55: at(55), b60: at(60), bp: +st.bpBoard.toFixed(1), bpFt: +st.bpFt.toFixed(1), entry: +st.entry.toFixed(2), v49: +(Math.hypot(d.interpAtY(run.pts, 49)?.vx ?? 0, d.interpAtY(run.pts, 49)?.vy ?? 0) / 1.4667).toFixed(2), gutter: run.gutter }); continue; }
      const run = d.simulate(cfg, opt.alpha ?? 1.0, true), pts = run.pts;
      const loc = p => p.wl; // simulate() records the spin axis already in ball-local coordinates
      const avg = (y0, y1) => { let s = [0, 0, 0]; for (const p of pts) if (p.py >= y0 && p.py <= y1 && p.wl) s = V.add(s, loc(p)); return V.norm(s); };
      const tEnd = pts.at(-1).py, L = lane.len;
      // ~1 revolution of averaging at each end (300 rpm, ~26 ft/s => ~5 ft per rev)
      const a0 = avg(0, 3), aO = avg(L - 2.5, L + 2.5), aP = avg(Math.min(tEnd, 60) - 5, 60);
      const ang = (u, v) => Math.acos(Math.max(-1, Math.min(1, V.dot(u, v)))) * R;
      const so = ang(a0, aO), sd = ang(aO, aP);
      out.push({ lab, bpO: fo, bpD: fd, bpT: +(fo + fd).toFixed(1), simO: +so.toFixed(1), simD: +sd.toFixed(1), simT: +(so + sd).toFixed(1) });
    }
    const err = out.reduce((s, o) => s + (o.simT - o.bpT) ** 2, 0) / out.length;
    const mo = out.reduce((s, o) => s + o.simT, 0) / out.length, mb = out.reduce((s, o) => s + o.bpT, 0) / out.length;
    let sxy = 0, sxx = 0, syy = 0; for (const o of out) { sxy += (o.simT - mo) * (o.bpT - mb); sxx += (o.simT - mo) ** 2; syy += (o.bpT - mb) ** 2; }
    return { rmse: +Math.sqrt(err).toFixed(2), corr: +(sxy / Math.sqrt(sxx * syy)).toFixed(3), meanSim: +mo.toFixed(2), meanBP: +mb.toFixed(2), out };
  }
};
'BP loaded';
