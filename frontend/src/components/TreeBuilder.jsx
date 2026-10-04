import React, { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { 
  Plus, Trash2, Save, GitBranch, MapPin, 
  Camera, ZoomIn, ZoomOut, RotateCcw, Edit3, ArrowLeft, Move, LayoutGrid
} from 'lucide-react';
import { apiFetch, getAuthToken } from '../utils/api';
import { compressImageFile } from '../utils/imageCompressor';

export const displayRelationship = (rel) => (rel === 'Head' ? 'Main' : rel);

/* Long-press / drag tuning for touch devices */
const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 8;

/* Tab definitions — short labels used on very small screens */
const SIDE_TABS = [
  { id: 'Personal', long: 'Personal', short: 'Info' },
  { id: 'Occupation & Contact', long: 'Occupation & Contact', short: 'Work' },
  { id: 'Photo Upload', long: 'Photo Upload', short: 'Photo' },
];

/* ---------- Tidy tree layout ---------- */
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

function useTreeConnectors(members, nodeRefs, canvasRef, zoomLevel, positions) {
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
  }, [members, nodeRefs, canvasRef, zoomLevel, positions]);

  return paths;
}

export default function TreeBuilder({ villages, initialTreeToEdit, onSuccess, onOpenAuth }) {
  const token = getAuthToken();

  const [familyName, setFamilyName] = useState('');
  const [headName, setHeadName] = useState('');
  const [editingTreeId, setEditingTreeId] = useState(null);

  const lastIdRef = useRef(0);
  const generateId = () => {
    const now = Date.now();
    const id = now > lastIdRef.current ? now : lastIdRef.current + 1;
    lastIdRef.current = id;
    return id;
  };

  const [members, setMembers] = useState([
    {
      id: 1, full_name: 'Me', gender: 'Male', relationship: 'Head',
      date_of_birth: '', village_name: villages[0]?.name || '',
      current_address: '', education: '', current_business: '',
      business_address: '', email_address: '', contact_number: '',
      photo_url: '', parent_member_id: null,
    },
  ]);

  const [selectedPersonId, setSelectedPersonId] = useState(1);
  const [activeSideTab, setActiveSideTab] = useState('Personal');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState(null);
  const [error, setError] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [mobileView, setMobileView] = useState('tree');

  const [draggedPositions, setDraggedPositions] = useState({});
  const [draggingId, setDraggingId] = useState(null);

  const nodeRefs = useRef(new Map());
  const canvasRef = useRef(null);
  const dragStateRef = useRef(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    if (initialTreeToEdit) {
      setEditingTreeId(initialTreeToEdit.id);
      setFamilyName(initialTreeToEdit.family_name);
      setHeadName(initialTreeToEdit.head_name);
      if (initialTreeToEdit.members && initialTreeToEdit.members.length > 0) {
        setMembers(initialTreeToEdit.members);
        const h = initialTreeToEdit.members.find((m) => m.relationship === 'Head') || initialTreeToEdit.members[0];
        setSelectedPersonId(h.id);
      }
      if (initialTreeToEdit.positions && typeof initialTreeToEdit.positions === 'object') {
        const loaded = {};
        Object.entries(initialTreeToEdit.positions).forEach(([id, p]) => {
          const key = Number(id);
          if (!Number.isNaN(key) && p && typeof p.x === 'number' && typeof p.y === 'number') {
            loaded[key] = { x: p.x, y: p.y };
          }
        });
        setDraggedPositions(loaded);
      } else {
        setDraggedPositions({});
      }
    }
  }, [initialTreeToEdit]);

  const selectedPerson = members.find((m) => m.id === selectedPersonId) || members[0];

  const autoLayout = useMemo(() => buildTidyLayout(members), [members]);
  const autoPositions = autoLayout.positions;

  const positions = useMemo(() => {
    const merged = { ...autoPositions };
    Object.entries(draggedPositions).forEach(([id, p]) => {
      const key = Number(id);
      merged[key] = p;
    });
    return merged;
  }, [autoPositions, draggedPositions]);

  const canvasSize = useMemo(() => {
    let maxX = 800, maxY = 500;
    Object.values(positions).forEach((p) => {
      if (p.x + 240 > maxX) maxX = p.x + 240;
      if (p.y + 300 > maxY) maxY = p.y + 300;
    });
    return { width: maxX + 120, height: maxY + 120 };
  }, [positions]);

  const connectors = useTreeConnectors(members, nodeRefs, canvasRef, zoomLevel, positions);

  const handlePointerDown = (e, memberId) => {
    if (e.button !== undefined && e.button !== 0) return;
    const pos = positions[memberId];
    if (!pos) return;

    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';

    const ds = {
      id: memberId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
      isTouch,
      longPressActive: !isTouch,
      timer: null,
    };
    dragStateRef.current = ds;
    suppressClickRef.current = false;

    if (isTouch) {
      ds.timer = setTimeout(() => {
        const curr = dragStateRef.current;
        if (!curr || curr !== ds || curr.moved) return;
        curr.longPressActive = true;
        suppressClickRef.current = true;
        setDraggingId(memberId);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(15); } catch (_) { /* ignore */ }
        }
      }, LONG_PRESS_MS);
    } else {
      setDraggingId(memberId);
    }
  };

  useEffect(() => {
    const onPointerMove = (e) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      const scale = zoomLevel > 0 ? zoomLevel : 1;
      const dx = (e.clientX - ds.startX) / scale;
      const dy = (e.clientY - ds.startY) / scale;
      const dist = Math.hypot(dx, dy);

      if (!ds.longPressActive) {
        if (dist > MOVE_CANCEL_PX) {
          if (ds.timer) clearTimeout(ds.timer);
          dragStateRef.current = null;
          setDraggingId(null);
        }
        return;
      }

      if (!ds.moved && dist > 2) {
        ds.moved = true;
        suppressClickRef.current = true;
      }
      setDraggedPositions((prev) => ({
        ...prev,
        [ds.id]: { x: ds.origX + dx, y: ds.origY + dy },
      }));
    };

    const onPointerUp = () => {
      const ds = dragStateRef.current;
      if (ds && ds.timer) clearTimeout(ds.timer);
      dragStateRef.current = null;
      setDraggingId(null);
    };

    const onTouchMove = (e) => {
      const ds = dragStateRef.current;
      if (ds && ds.isTouch && ds.longPressActive && e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [zoomLevel]);

  const handleNodeClick = (id) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelectedPersonId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) setMobileView('edit');
  };

  const handleResetLayout = () => setDraggedPositions({});

  const handleUpdateSelectedPerson = (field, value) => {
    if (!selectedPerson) return;
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === selectedPerson.id) {
          const updated = { ...m, [field]: value };
          if (field === 'full_name' && m.relationship === 'Head') {
            setHeadName(value);
            if (!familyName) setFamilyName(`${value} Family`);
          }
          return updated;
        }
        return m;
      })
    );
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    setUploadingImageId(id);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, photo_url: compressedDataUrl } : m)));
    } catch (err) {
      setError('Failed to compress image. Please choose a valid image file.');
    } finally {
      setUploadingImageId(null);
    }
  };

  const handleAddRelative = (relationType) => {
    const anchorId = selectedPersonId;
    const newId = generateId();
    const anchorSnapshot = members.find((m) => m.id === anchorId);
    if (!anchorSnapshot) return;

    const newGender = relationType === 'Spouse'
      ? (anchorSnapshot.gender === 'Male' ? 'Female' : 'Male')
      : 'Male';

    const base = {
      id: newId,
      full_name: `New ${relationType}`,
      gender: newGender,
      relationship: relationType,
      date_of_birth: '',
      village_name: anchorSnapshot.village_name || villages[0]?.name || '',
      current_address: '', education: '', current_business: '',
      business_address: '', email_address: '', contact_number: '',
      photo_url: '', parent_member_id: null,
    };

    setMembers((prev) => {
      const anchor = prev.find((m) => m.id === anchorId);
      if (!anchor) return prev;

      switch (relationType) {
        case 'Parent':
          return [...prev.map((m) => m.id === anchor.id ? { ...m, parent_member_id: newId } : m), { ...base, parent_member_id: null }];
        case 'Child':
          return [...prev, { ...base, parent_member_id: anchor.id }];
        case 'Sibling':
          return [...prev, { ...base, parent_member_id: anchor.parent_member_id || null }];
        case 'Spouse':
          return [...prev, { ...base, parent_member_id: null, spouse_of_id: anchor.id }];
        default:
          return [...prev, base];
      }
    });

    const anchorPos = positions[anchorId];
    if (anchorPos) {
      setDraggedPositions((prev) => ({
        ...prev,
        [newId]: { x: anchorPos.x + 220, y: anchorPos.y },
      }));
    }

    setSelectedPersonId(newId);
  };

  const handleDeleteSelectedPerson = () => {
    if (members.length <= 1) { setError('Family tree must have at least one person.'); return; }
    const remaining = members.filter((m) => m.id !== selectedPerson.id);
    setMembers(remaining);
    setDraggedPositions((prev) => {
      const cp = { ...prev };
      delete cp[selectedPerson.id];
      return cp;
    });
    setSelectedPersonId(remaining[0].id);
  };

  const handleSubmitTree = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    if (!token) { onOpenAuth(); return; }

    const h = members.find((m) => m.relationship === 'Head') || members[0];
    if (!h || !h.full_name.trim()) { setError('Please fill in the Head of Family name.'); return; }
    if (!h.village_name) { setError('Please choose a Native Village for the Head of Family.'); return; }

    setLoading(true);
    try {
      const finalPositions = {};
      Object.entries(positions).forEach(([id, p]) => {
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
          finalPositions[String(id)] = { x: p.x, y: p.y };
        }
      });

      const payload = {
        family_name: familyName || `${h.full_name} Family`,
        head_name: h.full_name,
        village_name: h.village_name,
        positions: finalPositions,
        members: members.map((m) => ({
          id: m.id,
          parent_member_id: m.parent_member_id,
          spouse_of_id: m.spouse_of_id || null,
          full_name: m.full_name,
          gender: m.gender,
          relationship: m.relationship,
          date_of_birth: m.date_of_birth,
          village_name: m.village_name || h.village_name,
          current_address: m.current_address,
          education: m.education,
          current_business: m.current_business,
          business_address: m.business_address,
          email_address: m.email_address,
          contact_number: m.contact_number,
          photo_url: m.photo_url,
          notes: m.notes,
        })),
      };

      if (editingTreeId) {
        await apiFetch(`/family/trees/${editingTreeId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/family/trees', { method: 'POST', body: JSON.stringify(payload) });
      }
      setSubmittedSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save family tree.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedSuccess) {
    return (
      <div className="max-w-3xl mx-auto my-8 sm:my-12 p-6 sm:p-8 bg-white rounded-3xl border border-saffron-200 shadow-xl text-center space-y-5 mx-4">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
          {editingTreeId ? 'Family Tree Updated Successfully!' : 'Family Tree Submitted Successfully!'}
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Jai Shree Ram! Your family tree for <strong className="text-saffron-700">{familyName}</strong> has been saved and sent for admin review.
        </p>
        <div className="pt-4">
          <button
            onClick={() => {
              setSubmittedSuccess(false);
              setEditingTreeId(null);
              setDraggedPositions({});
              setMembers([{ id: 1, full_name: 'Me', gender: 'Male', relationship: 'Head', date_of_birth: '', village_name: villages[0]?.name || '', current_address: '', education: '', current_business: '', business_address: '', email_address: '', contact_number: '', photo_url: '', parent_member_id: null }]);
              setSelectedPersonId(1);
              setMobileView('tree');
            }}
            className="bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-8 py-3 rounded-xl shadow-md transition-colors"
          >
            Create Another Family Tree
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 7rem)', minHeight: '520px' }}>
      <div className="lg:hidden flex bg-white border-b border-slate-200 shrink-0">
        <button onClick={() => setMobileView('tree')} className={`flex-1 py-2.5 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${mobileView === 'tree' ? 'text-saffron-600 border-b-2 border-saffron-500 bg-saffron-50/40' : 'text-slate-500'}`}>
          <GitBranch className="w-4 h-4" /> Tree ({members.length})
        </button>
        <button onClick={() => setMobileView('edit')} className={`flex-1 py-2.5 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors truncate ${mobileView === 'edit' ? 'text-saffron-600 border-b-2 border-saffron-500 bg-saffron-50/40' : 'text-slate-500'}`}>
          <Edit3 className="w-4 h-4 shrink-0" />
          <span className="truncate">Edit: {selectedPerson?.full_name?.slice(0, 16) || 'Person'}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className={`w-full lg:w-96 lg:shrink-0 bg-white lg:border-r border-slate-200 flex-col overflow-hidden ${mobileView === 'edit' ? 'flex' : 'hidden'} lg:flex`}>
          {/* Compact header on mobile; original on sm+ */}
          <div className="p-3 sm:p-5 bg-gradient-to-r from-saffron-50 to-amber-50 border-b border-saffron-100 shrink-0">
            <button onClick={() => setMobileView('tree')} className="lg:hidden mb-2 inline-flex items-center gap-1 text-xs font-bold text-saffron-700 hover:text-saffron-900">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Tree
            </button>
            <p className="text-[10px] font-bold text-saffron-700 uppercase tracking-widest mb-2">● Currently Editing</p>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative group shrink-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-saffron-300 overflow-hidden flex items-center justify-center text-2xl sm:text-3xl shadow-sm">
                  {selectedPerson?.photo_url ? (<img src={selectedPerson.photo_url} alt={selectedPerson.full_name} className="w-full h-full object-cover" />) : (<span>{selectedPerson?.gender === 'Female' ? '👩' : '👨'}</span>)}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-saffron-500 text-white p-1 sm:p-1.5 rounded-full cursor-pointer shadow-md hover:bg-saffron-600">
                  <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(selectedPerson.id, e.target.files[0])} />
                </label>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base sm:text-xl font-bold text-slate-900 truncate">{selectedPerson?.full_name || 'Person Name'}</h3>
                <span className="inline-block text-[10px] sm:text-xs font-bold text-saffron-800 bg-saffron-100 px-2 py-0.5 rounded-full uppercase mt-0.5 sm:mt-1">{displayRelationship(selectedPerson?.relationship) || 'Member'}</span>
              </div>
            </div>
          </div>

          {/* Tabs — short labels on mobile so they never overlap, full labels from sm+ */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
            {SIDE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSideTab(tab.id)}
                className={`flex-1 py-3 text-center transition-colors whitespace-nowrap px-2 ${activeSideTab === tab.id ? 'bg-white text-saffron-600 border-b-2 border-saffron-500 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span className="hidden sm:inline">{tab.long}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 sm:space-y-4">
            {activeSideTab === 'Personal' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input type="text" value={selectedPerson?.full_name || ''} onChange={(e) => handleUpdateSelectedPerson('full_name', e.target.value)} placeholder="Person's Full Name" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender *</label>
                  <select value={selectedPerson?.gender || 'Male'} onChange={(e) => handleUpdateSelectedPerson('gender', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500">
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Relationship Type *</label>
                  <select value={selectedPerson?.relationship || 'Head'} onChange={(e) => handleUpdateSelectedPerson('relationship', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500">
                    <option value="Head">Head / Me</option><option value="Parent">Parent</option><option value="Spouse">Spouse / Partner</option><option value="Sibling">Sibling</option><option value="Child">Child</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Native Village * (Admin Managed)</label>
                  <select value={selectedPerson?.village_name || (villages[0]?.name || '')} onChange={(e) => handleUpdateSelectedPerson('village_name', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500 font-semibold text-slate-800">
                    {villages.map((v) => (<option key={v.id || v.name} value={v.name}>{v.name}{v.district ? ` (${v.district})` : ''}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                  <input type="date" value={selectedPerson?.date_of_birth || ''} onChange={(e) => handleUpdateSelectedPerson('date_of_birth', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Home Address</label>
                  <input type="text" value={selectedPerson?.current_address || ''} onChange={(e) => handleUpdateSelectedPerson('current_address', e.target.value)} placeholder="Varachha, Surat, Gujarat" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
              </>
            )}

            {activeSideTab === 'Occupation & Contact' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Business / Occupation</label>
                  <input type="text" value={selectedPerson?.current_business || ''} onChange={(e) => handleUpdateSelectedPerson('current_business', e.target.value)} placeholder="Diamond Trading / Agriculture / Software" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Business Address</label>
                  <input type="text" value={selectedPerson?.business_address || ''} onChange={(e) => handleUpdateSelectedPerson('business_address', e.target.value)} placeholder="Office or Shop location" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Education</label>
                  <input type="text" value={selectedPerson?.education || ''} onChange={(e) => handleUpdateSelectedPerson('education', e.target.value)} placeholder="B.Tech, B.Com, CA, Doctor" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Number</label>
                  <input type="tel" value={selectedPerson?.contact_number || ''} onChange={(e) => handleUpdateSelectedPerson('contact_number', e.target.value)} placeholder="+91 9925012345" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                  <input type="email" value={selectedPerson?.email_address || ''} onChange={(e) => handleUpdateSelectedPerson('email_address', e.target.value)} placeholder="name@example.com" className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-saffron-500" />
                </div>
              </>
            )}

            {activeSideTab === 'Photo Upload' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-24 h-24 rounded-2xl bg-saffron-50 border-2 border-saffron-300 mx-auto overflow-hidden flex items-center justify-center text-4xl shadow-md">
                  {selectedPerson?.photo_url ? (<img src={selectedPerson.photo_url} alt="Uploaded Photo" className="w-full h-full object-cover" />) : (<span>{selectedPerson?.gender === 'Female' ? '👩' : '👨'}</span>)}
                </div>
                <label className="inline-flex items-center gap-2 bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-md text-xs">
                  <Camera className="w-4 h-4" /><span>Upload Member Photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(selectedPerson.id, e.target.files[0])} />
                </label>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Photos are automatically compressed and resized for fast loading.</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Add Relative <span className="text-saffron-700">to {selectedPerson?.full_name}</span>:</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => handleAddRelative('Parent')} className="py-2.5 px-3 bg-slate-100 hover:bg-saffron-50 hover:text-saffron-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Add parent</button>
                <button type="button" onClick={() => handleAddRelative('Spouse')} className="py-2.5 px-3 bg-slate-100 hover:bg-saffron-50 hover:text-saffron-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Add partner</button>
                <button type="button" onClick={() => handleAddRelative('Sibling')} className="py-2.5 px-3 bg-slate-100 hover:bg-saffron-50 hover:text-saffron-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Add sibling</button>
                <button type="button" onClick={() => handleAddRelative('Child')} className="py-2.5 px-3 bg-slate-100 hover:bg-saffron-50 hover:text-saffron-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Add child</button>
              </div>
              {selectedPerson?.relationship !== 'Head' && (
                <button type="button" onClick={handleDeleteSelectedPerson} className="w-full mt-2 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold border border-red-200 flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete person</button>
              )}
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0">
            <button onClick={handleSubmitTree} disabled={loading} className="w-full bg-saffron-500 hover:bg-saffron-600 text-white font-bold py-3 rounded-xl shadow-saffron-glow transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60">
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Tree...' : (editingTreeId ? 'Update & Resubmit Tree' : 'Submit Family Tree')}</span>
            </button>
          </div>
        </div>

        <div className={`w-full lg:flex-1 flex-col overflow-hidden ${mobileView === 'tree' ? 'flex' : 'hidden'} lg:flex`}>
          <div className="p-3 sm:p-4 bg-white/90 backdrop-blur-md border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 z-10 shadow-sm shrink-0">
            <div className="min-w-0 flex-1">
              <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="Enter Family Tree Title (e.g. Zazadiya Family)" className="w-full font-serif text-base sm:text-lg font-bold text-slate-900 bg-transparent border-b border-slate-300 focus:outline-none focus:border-saffron-500 px-1 py-0.5" />
              <p className="text-xs text-slate-500 mt-0.5">
                Total Members: <strong className="text-saffron-600 font-bold">{members.length}</strong>
                <span className="hidden sm:inline ml-3 text-slate-400"><Move className="inline w-3 h-3 mr-1" /> Drag any card to rearrange</span>
                <span className="sm:hidden ml-3 text-slate-400">Long-press a card to drag</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleResetLayout} title="Reset positions to auto layout" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-saffron-700 bg-slate-100 hover:bg-saffron-50 border border-slate-200 px-3 py-2 rounded-xl transition-colors">
                <LayoutGrid className="w-3.5 h-3.5" /> Reset Layout
              </button>
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button onClick={() => setZoomLevel(Math.max(0.4, zoomLevel - 0.1))} className="p-2 text-slate-600 hover:text-saffron-600 rounded-lg hover:bg-white" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs font-bold text-slate-700 px-2 min-w-[44px] text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))} className="p-2 text-slate-600 hover:text-saffron-600 rounded-lg hover:bg-white" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                <button onClick={() => setZoomLevel(1)} className="p-2 text-slate-600 hover:text-saffron-600 rounded-lg hover:bg-white border-l border-slate-200 ml-1" title="Reset Zoom"><RotateCcw className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-8 min-h-0">
            <div
              className="transition-all duration-200"
              style={{ width: canvasSize.width * zoomLevel, height: canvasSize.height * zoomLevel }}
            >
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', width: canvasSize.width, height: canvasSize.height }}
                className="transition-transform duration-200"
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
                    const isDragging = draggingId === m.id;
                    return (
                      <div
                        key={m.id}
                        className="absolute"
                        style={{ left: pos.x, top: pos.y, zIndex: isDragging ? 30 : 10, touchAction: 'manipulation', cursor: isDragging ? 'grabbing' : 'grab' }}
                        onPointerDown={(e) => handlePointerDown(e, m.id)}
                      >
                        <CanvasPersonNode
                          person={m}
                          isHead={m.relationship === 'Head'}
                          isSelected={m.id === selectedPersonId}
                          isDragging={isDragging}
                          onClick={() => handleNodeClick(m.id)}
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
            </div>
          </div>

          {selectedPerson && (
            <div className="lg:hidden shrink-0 bg-white border-t border-slate-200 px-3 py-2 flex items-center gap-2 shadow-lg">
              <div className="w-9 h-9 rounded-xl bg-saffron-50 border-2 border-saffron-200 overflow-hidden flex items-center justify-center text-lg shrink-0">
                {selectedPerson.photo_url ? (<img src={selectedPerson.photo_url} alt={selectedPerson.full_name} className="w-full h-full object-cover" />) : (<span>{selectedPerson.gender === 'Female' ? '👩' : '👨'}</span>)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{selectedPerson.full_name}</p>
                <p className="text-[10px] text-saffron-700 font-bold uppercase">{displayRelationship(selectedPerson.relationship)}</p>
              </div>
              <button onClick={() => setMobileView('edit')} className="shrink-0 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-md">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CanvasPersonNode({ person, isHead, isSelected, isDragging, onClick, registerRef }) {
  return (
    <div
      ref={registerRef}
      onClick={onClick}
      className={`relative w-40 sm:w-48 p-3 sm:p-4 rounded-2xl transition-all duration-150 text-center border-2 select-none ${
        isDragging
          ? 'shadow-2xl scale-105 cursor-grabbing ring-4 ring-saffron-300/60'
          : isSelected
          ? 'ring-4 ring-saffron-400/50 scale-105 border-saffron-600 bg-white shadow-xl cursor-grab'
          : isHead
          ? 'bg-gradient-to-b from-saffron-500 to-saffron-600 text-white border-saffron-600 shadow-md hover:scale-105 cursor-grab'
          : 'bg-white text-slate-800 border-saffron-200 hover:border-saffron-400 shadow-sm hover:scale-105 cursor-grab'
      }`}
    >
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 flex items-center justify-center text-2xl shadow-md ${isHead && !isSelected && !isDragging ? 'border-white bg-white/20' : 'border-saffron-200 bg-saffron-50'}`}>
        {person.photo_url ? (<img src={person.photo_url} alt={person.full_name} className="w-full h-full object-cover pointer-events-none" draggable={false} />) : (<span className="pointer-events-none">{person.gender === 'Female' ? '👩' : '👨'}</span>)}
      </div>
      <h5 className={`font-bold text-sm leading-tight truncate pointer-events-none ${isHead && !isSelected && !isDragging ? 'text-white' : 'text-slate-900'}`}>{person.full_name || 'Person'}</h5>
      <p className={`text-xs font-semibold mt-0.5 uppercase pointer-events-none ${isHead && !isSelected && !isDragging ? 'text-yellow-200' : 'text-saffron-700'}`}>{displayRelationship(person.relationship)}</p>
      {person.village_name && (<p className={`text-[10px] mt-1 truncate pointer-events-none ${isHead && !isSelected && !isDragging ? 'text-saffron-100' : 'text-slate-500'}`}>📍 {person.village_name}</p>)}
      {isSelected && !isDragging && (
        <div className="absolute -top-2 -right-2 bg-saffron-500 text-white p-1 rounded-full shadow-md pointer-events-none"><Edit3 className="w-3 h-3" /></div>
      )}
    </div>
  );
}
