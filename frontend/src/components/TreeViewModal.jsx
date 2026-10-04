import React, { useState, useMemo, useRef, useLayoutEffect, useEffect } from 'react';
import { X, MapPin, Briefcase, GraduationCap, Phone, Mail, Home, Printer, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const displayRelationship = (rel) => (rel === 'Head' ? 'Main' : rel);

/* ---------- Tidy tree layout (auto fallback for trees without saved positions) ---------- */
function buildTidyLayout(members) {
  const idSet = new Set(members.map((m) => m.id));
  const byId = new Map(members.map((m) => [m.id, m]));

  const spouseMap = new Map();
  members.forEach((m) => {
    let sid = m.spouse_of_id;
    if (!sid && m.relationship === 'Spouse') {
      const head = members.find((x) => x.relationship === 'Head');
      if (head && head.id !== m.id) sid = head.id;
    }
    if (sid && idSet.has(sid) && sid !== m.id) {
      spouseMap.set(m.id, sid);
      if (!spouseMap.has(sid)) spouseMap.set(sid, m.id);
    }
  });

  const hasParent = (m) => m.parent_member_id != null && idSet.has(m.parent_member_id);

  const partnerOf = new Map();
  const isSecondary = new Set();
  const unitOf = new Map();
  const done = new Set();

  members.forEach((m) => {
    if (unitOf.has(m.id)) return;
    const sid = spouseMap.get(m.id);
    if (!sid) { unitOf.set(m.id, m.id); return; }
    const a = Math.min(m.id, sid), b = Math.max(m.id, sid);
    const key = `${a}:${b}`;
    if (done.has(key)) return;
    done.add(key);

    const A = byId.get(a), B = byId.get(b);
    let primary, secondary;
    if (A.relationship === 'Head') { primary = A; secondary = B; }
    else if (B.relationship === 'Head') { primary = B; secondary = A; }
    else if (hasParent(A) && !hasParent(B)) { primary = A; secondary = B; }
    else if (hasParent(B) && !hasParent(A)) { primary = B; secondary = A; }
    else { primary = A; secondary = B; }

    partnerOf.set(primary.id, secondary.id);
    isSecondary.add(secondary.id);
    unitOf.set(primary.id, primary.id);
    unitOf.set(secondary.id, primary.id);
  });

  const unitParent = new Map();
  const unitChildren = new Map();

  members.forEach((m) => {
    if (isSecondary.has(m.id)) return;
    let parent = null;
    if (hasParent(m)) parent = byId.get(m.parent_member_id);
    else if (partnerOf.has(m.id)) {
      const sec = byId.get(partnerOf.get(m.id));
      if (sec && hasParent(sec)) parent = byId.get(sec.parent_member_id);
    }
    if (!parent) { unitParent.set(m.id, null); return; }
    const pu = unitOf.get(parent.id);
    if (pu == null || pu === m.id) { unitParent.set(m.id, null); return; }
    unitParent.set(m.id, pu);
    if (!unitChildren.has(pu)) unitChildren.set(pu, []);
    unitChildren.get(pu).push(m.id);
  });

  const roots = [];
  members.forEach((m) => {
    if (isSecondary.has(m.id)) return;
    if (!unitParent.has(m.id) || unitParent.get(m.id) == null) roots.push(m.id);
  });

  const NODE_W = 200;
  const NODE_H = 170;
  const COUPLE_GAP = 30;
  const SIBLING_GAP = 50;
  const SUBTREE_GAP = 110;
  const ROW_GAP = 70;
  const ROW_HEIGHT = NODE_H + ROW_GAP;
  const PAD_X = 60;
  const PAD_Y = 40;

  const unitWidth = (uid) => (partnerOf.has(uid) ? NODE_W * 2 + COUPLE_GAP : NODE_W);

  const positions = {};
  const widths = new Map();

  function measure(uid, visited = new Set()) {
    if (visited.has(uid)) return unitWidth(uid);
    visited.add(uid);
    const kids = unitChildren.get(uid) || [];
    const ownW = unitWidth(uid);
    if (kids.length === 0) { widths.set(uid, ownW); return ownW; }
    const kidWidths = kids.map((k) => measure(k, visited));
    const kidSpan = kidWidths.reduce((s, w) => s + w, 0) + SIBLING_GAP * (kids.length - 1);
    const total = Math.max(ownW, kidSpan);
    widths.set(uid, total);
    return total;
  }
  roots.forEach((r) => measure(r));

  function place(uid, depth, leftX) {
    const kids = unitChildren.get(uid) || [];
    const ownW = unitWidth(uid);
    const totalW = widths.get(uid) || ownW;
    const y = PAD_Y + depth * ROW_HEIGHT;

    const unitLeftX = leftX + (totalW - ownW) / 2;
    positions[uid] = { x: unitLeftX, y };
    if (partnerOf.has(uid)) {
      positions[partnerOf.get(uid)] = { x: unitLeftX + NODE_W + COUPLE_GAP, y };
    }

    if (kids.length === 0) return;
    const kidWidths = kids.map((k) => widths.get(k) || unitWidth(k));
    const kidSpan = kidWidths.reduce((s, w) => s + w, 0) + SIBLING_GAP * (kids.length - 1);

    let cursor = leftX + (totalW - kidSpan) / 2;
    kids.forEach((kid, i) => {
      place(kid, depth + 1, cursor);
      cursor += kidWidths[i] + SIBLING_GAP;
    });
  }

  let cursorX = PAD_X;
  roots.forEach((rid) => {
    place(rid, 0, cursorX);
    cursorX += (widths.get(rid) || unitWidth(rid)) + SUBTREE_GAP;
  });

  let maxY = PAD_Y;
  Object.values(positions).forEach((p) => { if (p.y > maxY) maxY = p.y; });
  let floatX = PAD_X;
  const floatY = maxY + ROW_HEIGHT;
  members.forEach((m) => {
    if (positions[m.id]) return;
    if (isSecondary.has(m.id)) return;
    positions[m.id] = { x: floatX, y: floatY };
    if (partnerOf.has(m.id)) {
      positions[partnerOf.get(m.id)] = { x: floatX + NODE_W + COUPLE_GAP, y: floatY };
    }
    floatX += unitWidth(m.id) + SIBLING_GAP;
  });

  return { positions, partnerOf, isSecondary, spouseMap };
}

function useTreeConnectors(members, nodeRefs, canvasRef, positions, zoomLevel) {
  const [paths, setPaths] = useState([]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const measure = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const scale = zoomLevel > 0 ? zoomLevel : 1;

      const pos = new Map();
      nodeRefs.current.forEach((el, id) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        pos.set(id, {
          cx: (r.left + r.width / 2 - canvasRect.left) / scale,
          top: (r.top - canvasRect.top) / scale,
          bottom: (r.bottom - canvasRect.top) / scale,
        });
      });

      const spouseOfMap = new Map();
      members.forEach((m) => {
        if (m.spouse_of_id) {
          spouseOfMap.set(m.id, m.spouse_of_id);
          if (!spouseOfMap.has(m.spouse_of_id)) spouseOfMap.set(m.spouse_of_id, m.id);
        } else if (m.relationship === 'Spouse') {
          const head = members.find((x) => x.relationship === 'Head');
          if (head && head.id !== m.id) {
            spouseOfMap.set(m.id, head.id);
            if (!spouseOfMap.has(head.id)) spouseOfMap.set(head.id, m.id);
          }
        }
      });

      const childrenByParent = new Map();
      members.forEach((m) => {
        if (m.parent_member_id == null) return;
        if (!childrenByParent.has(m.parent_member_id)) childrenByParent.set(m.parent_member_id, []);
        childrenByParent.get(m.parent_member_id).push(m.id);
      });

      const newPaths = [];

      childrenByParent.forEach((childIds, parentId) => {
        const p = pos.get(parentId);
        if (!p) return;

        let sourceX = p.cx;
        const spouseId = spouseOfMap.get(parentId);
        if (spouseId) {
          const s = pos.get(spouseId);
          if (s) sourceX = (p.cx + s.cx) / 2;
        }

        const sourceY = p.bottom;
        const elbowY = sourceY + 40;

        childIds.forEach((cid) => {
          const c = pos.get(cid);
          if (!c) return;
          const childX = c.cx;
          const childTop = c.top;
          const dx = childX - sourceX;
          const absDx = Math.abs(dx);

          if (absDx < 2) {
            newPaths.push(`M ${sourceX} ${sourceY} L ${childX} ${childTop}`);
            return;
          }

          const r = 18;
          const vDist1 = elbowY - sourceY;
          const vDist2 = childTop - elbowY;
          const r1 = Math.max(4, Math.min(r, vDist1 * 0.6, absDx * 0.5));
          const r2 = Math.max(4, Math.min(r, vDist2 * 0.6, absDx * 0.5));
          const hSign = dx > 0 ? 1 : -1;

          newPaths.push([
            `M ${sourceX} ${sourceY}`,
            `L ${sourceX} ${elbowY - r1}`,
            `Q ${sourceX} ${elbowY} ${sourceX + hSign * r1} ${elbowY}`,
            `L ${childX - hSign * r2} ${elbowY}`,
            `Q ${childX} ${elbowY} ${childX} ${elbowY + r2}`,
            `L ${childX} ${childTop}`,
          ].join(' '));
        });
      });

      setPaths(newPaths);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    nodeRefs.current.forEach((el) => { if (el) ro.observe(el); });

    return () => ro.disconnect();
  }, [members, nodeRefs, canvasRef, positions, zoomLevel]);

  return paths;
}

export default function TreeViewModal({ tree, onClose }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const nodeRefs = useRef(new Map());
  const canvasRef = useRef(null);
  const pinchRef = useRef({ active: false, startDist: 0, startZoom: 1 });

  const members = tree?.members || [];

  // Prefer saved positions from the builder; fall back to auto layout.
  const positions = useMemo(() => {
    const auto = buildTidyLayout(members).positions;
    const saved = tree?.positions;
    if (!saved || typeof saved !== 'object') return auto;

    const merged = { ...auto };
    Object.entries(saved).forEach(([id, p]) => {
      const key = Number(id);
      if (!Number.isNaN(key) && p && typeof p.x === 'number' && typeof p.y === 'number') {
        merged[key] = { x: p.x, y: p.y };
      }
    });
    return merged;
  }, [members, tree?.positions]);

  const canvasSize = useMemo(() => {
    let maxX = 800, maxY = 500;
    Object.values(positions).forEach((p) => {
      if (p.x + 240 > maxX) maxX = p.x + 240;
      if (p.y + 300 > maxY) maxY = p.y + 300;
    });
    return { width: maxX + 120, height: maxY + 120 };
  }, [positions]);

  const connectors = useTreeConnectors(members, nodeRefs, canvasRef, positions, zoomLevel);

  // Reset zoom when tree changes
  useEffect(() => { setZoomLevel(1); }, [tree?.id]);

  // Wheel zoom (Ctrl/Cmd + scroll on desktop)
  const handleWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoomLevel((prev) => {
      const next = prev - e.deltaY * 0.0015;
      return Math.min(2.0, Math.max(0.3, next));
    });
  };

  // Pinch-to-zoom (mobile, two-finger)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const [a, b] = e.touches;
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      pinchRef.current = { active: true, startDist: dist, startZoom: zoomLevel };
    }
  };

  const handleTouchMove = (e) => {
    if (pinchRef.current.active && e.touches.length === 2) {
      e.preventDefault();
      const [a, b] = e.touches;
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const ratio = dist / pinchRef.current.startDist;
      const next = Math.min(2.0, Math.max(0.3, pinchRef.current.startZoom * ratio));
      setZoomLevel(next);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      pinchRef.current.active = false;
    }
  };

  if (!tree) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-8 shadow-2xl relative border border-saffron-200 my-auto space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-serif leading-none text-saffron-600">ॐ</span>
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 px-2.5 py-0.5 rounded-full border border-saffron-200">Zazadiya Parivaar Tree</span>
              {tree.status && (<span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${tree.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{tree.status}</span>)}
            </div>
            <h2 className="font-serif text-xl sm:text-3xl font-bold text-slate-900 mt-2 truncate">{tree.family_name}</h2>
            <p className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-saffron-500" /><span>Village: <strong className="text-slate-800">{tree.village_name}</strong></span></span>
              <span className="hidden sm:inline">•</span>
              <span>Head: <strong className="text-slate-800">{tree.head_name}</strong></span>
            </p>
          </div>
          <div className="flex items-center gap-2 print:hidden shrink-0">
            <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-saffron-600 rounded-xl hover:bg-saffron-50 border border-slate-200" title="Print"><Printer className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Zoom toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
          <p className="text-xs text-slate-500">
            Tip: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono">Ctrl</kbd> + scroll to zoom • pinch with two fingers on mobile.
          </p>
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 shrink-0">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.3, z - 0.1))}
              className="p-2 text-slate-600 hover:text-saffron-600 rounded-lg hover:bg-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="text-xs font-bold text-slate-700 px-2 min-w-[52px] text-center hover:text-saffron-600"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
              className="p-2 text-slate-600 hover:text-saffron-600 rounded-lg hover:bg-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-2 text-slate-600 hover:text-saffron-600 rounded-lg hover:bg-white border-l border-slate-200 ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="py-6 px-2 sm:px-4 bg-gradient-to-b from-saffron-50/60 to-amber-50/40 rounded-3xl border border-saffron-100 overflow-auto"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'pan-x pan-y' }}
        >
          {members.length === 0 ? (
            <p className="text-center text-sm text-slate-400 italic py-6">No members in this tree.</p>
          ) : (
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
              className="transition-transform duration-150"
            >
              <div ref={canvasRef} className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
                <svg className="absolute inset-0 pointer-events-none" width={canvasSize.width} height={canvasSize.height} style={{ overflow: 'visible', zIndex: 0 }}>
                  {connectors.map((d, i) => (
                    <path key={i} d={d} fill="none" stroke="#ff8544" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                  ))}
                </svg>

                {members.map((m) => {
                  const pos = positions[m.id];
                  if (!pos) return null;
                  return (
                    <div
                      key={m.id}
                      className="absolute"
                      style={{ left: pos.x, top: pos.y, zIndex: 10 }}
                    >
                      <ViewPersonNode
                        person={m}
                        isHead={m.relationship === 'Head'}
                        isSelected={m.id === selectedMember?.id}
                        onClick={() => setSelectedMember(m)}
                        registerRef={(el) => {
                          if (el) nodeRefs.current.set(m.id, el);
                          else nodeRefs.current.delete(m.id);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selectedMember && (
          <div className="fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedMember(null)}>
            <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative border-2 border-saffron-400 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-16 h-16 rounded-2xl bg-saffron-50 border-2 border-saffron-200 overflow-hidden flex items-center justify-center text-3xl shadow-sm shrink-0">
                  {selectedMember.photo_url ? (<img src={selectedMember.photo_url} alt={selectedMember.full_name} className="w-full h-full object-cover" />) : (<span>{selectedMember.gender === 'Female' ? '👩' : '👨'}</span>)}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold bg-saffron-100 text-saffron-800 px-2.5 py-0.5 rounded-full uppercase">{displayRelationship(selectedMember.relationship)}</span>
                  <h4 className="font-serif text-xl font-bold text-slate-900 mt-1 truncate">{selectedMember.full_name}</h4>
                  <p className="text-xs text-slate-500 font-medium truncate">Native Village: {selectedMember.village_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-slate-400 font-medium">Date of Birth</p><p className="font-bold text-slate-900 text-sm mt-0.5">{selectedMember.date_of_birth || 'N/A'}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-slate-400 font-medium">Business / Occupation</p><p className="font-bold text-slate-900 text-sm mt-0.5">{selectedMember.current_business || 'N/A'}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-slate-400 font-medium">Education</p><p className="font-bold text-slate-900 text-sm mt-0.5">{selectedMember.education || 'N/A'}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-slate-400 font-medium">Contact Number</p><p className="font-bold text-saffron-700 text-sm mt-0.5">{selectedMember.contact_number || 'N/A'}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-slate-400 font-medium">Email Address</p><p className="font-bold text-slate-900 text-sm mt-0.5 truncate">{selectedMember.email_address || 'N/A'}</p></div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><p className="text-slate-400 font-medium">Current Address</p><p className="font-bold text-slate-900 text-sm mt-0.5">{selectedMember.current_address || 'N/A'}</p></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewPersonNode({ person, isHead, isSelected, onClick, registerRef }) {
  return (
    <div
      ref={registerRef}
      onClick={onClick}
      className={`relative w-40 sm:w-48 p-3 sm:p-4 rounded-2xl transition-all duration-150 text-center border-2 select-none cursor-pointer ${
        isSelected
          ? 'ring-4 ring-saffron-400/50 scale-105 border-saffron-600 bg-white shadow-xl'
          : isHead
          ? 'bg-gradient-to-b from-saffron-500 to-saffron-600 text-white border-saffron-600 shadow-md hover:scale-105'
          : 'bg-white text-slate-800 border-saffron-200 hover:border-saffron-400 shadow-sm hover:scale-105'
      }`}
    >
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 flex items-center justify-center text-2xl shadow-md ${isHead && !isSelected ? 'border-white bg-white/20' : 'border-saffron-200 bg-saffron-50'}`}>
        {person.photo_url ? (<img src={person.photo_url} alt={person.full_name} className="w-full h-full object-cover pointer-events-none" draggable={false} />) : (<span className="pointer-events-none">{person.gender === 'Female' ? '👩' : '👨'}</span>)}
      </div>
      <h5 className={`font-bold text-sm leading-tight truncate pointer-events-none ${isHead && !isSelected ? 'text-white' : 'text-slate-900'}`}>{person.full_name}</h5>
      <p className={`text-xs font-semibold mt-0.5 uppercase pointer-events-none ${isHead && !isSelected ? 'text-yellow-200' : 'text-saffron-700'}`}>{displayRelationship(person.relationship)}</p>
      {person.current_business && (<p className={`text-[10px] mt-1 line-clamp-1 pointer-events-none ${isHead && !isSelected ? 'text-saffron-100' : 'text-slate-500'}`}>💼 {person.current_business}</p>)}
    </div>
  );
}