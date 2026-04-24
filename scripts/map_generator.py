"""
Parse seed.sql and generate an SVG world map for the MUD game.

Usage:
    uv run main.py [--input ../../data/seed.sql] [--output ../../docs/world-map.svg]
"""

from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
from collections import deque
from dataclasses import dataclass
from pathlib import Path

# ── Data Models ──────────────────────────────────────────────────────────────

@dataclass
class Scene:
    id: str
    name: str
    description: str
    safe_zone: bool
    environment: str
    level_min: int
    level_max: int
    exits: dict[str, str]


@dataclass
class SceneEntity:
    scene_id: str
    template_id: str
    entity_type: str
    quantity: int
    tags: list[str]
    visible: bool


# ── SQL Parser ───────────────────────────────────────────────────────────────

def parse_sql_string(s: str) -> str:
    return s.replace("''", "'")


def extract_scenes(sql: str) -> list[Scene]:
    pattern = re.compile(
        r"\('([^']+)',\s*"
        r"'((?:[^']|'')*)',\s*"
        r"'((?:[^']|'')*)',\s*"
        r"(true|false),\s*"
        r"'([^']+)',\s*"
        r"(\d+),\s*"
        r"(\d+),\s*"
        r"'(\{[^']*\})'\)"
    )
    scenes = []
    for m in pattern.finditer(sql):
        scenes.append(Scene(
            id=m.group(1),
            name=parse_sql_string(m.group(2)),
            description=parse_sql_string(m.group(3)),
            safe_zone=m.group(4) == "true",
            environment=m.group(5),
            level_min=int(m.group(6)),
            level_max=int(m.group(7)),
            exits=json.loads(m.group(8).replace('\\"', '"')),
        ))
    return scenes


def extract_scene_entities(sql: str) -> list[SceneEntity]:
    pattern = re.compile(
        r"\('([^']+)',\s*"
        r"'([^']+)',\s*"
        r"'([^']+)',\s*"
        r"(\d+),\s*"
        r"ARRAY\[([^\]]*)\]::text\[\],\s*"
        r"(true|false)\)"
    )
    entities = []
    for m in pattern.finditer(sql):
        tags_raw = m.group(5).strip()
        tags = [t.strip().strip("'") for t in tags_raw.split(",") if t.strip()] if tags_raw else []
        entities.append(SceneEntity(
            scene_id=m.group(1),
            template_id=m.group(2),
            entity_type=m.group(3),
            quantity=int(m.group(4)),
            tags=tags,
            visible=m.group(6) == "true",
        ))
    return entities


# ── Grid Layout Engine ───────────────────────────────────────────────────────

DIR_OFFSETS: dict[str, tuple[int, int]] = {
    "north": (0, -1), "south": (0, 1),
    "east": (1, 0), "west": (-1, 0),
    "up": (0, -1), "down": (0, 1),
}

CELL_W = 200
CELL_H = 110


def detect_buildings(scenes: list[Scene]) -> dict[str, list[str]]:
    """
    Detect all multi-floor groups: scenes connected by up/down within the same area.

    Returns {anchor_id: [floor_ids from bottom to top]}.
    The anchor is the lowest floor (has no 'down' to another in-area floor).
    """
    scene_map = {s.id: s for s in scenes}

    up_target: dict[str, str] = {}
    down_target: dict[str, str] = {}
    for s in scenes:
        prefix = s.id.split("_")[0]
        for d, t in s.exits.items():
            if t not in scene_map:
                continue
            t_prefix = t.split("_")[0]
            if prefix != t_prefix:
                continue
            if d == "up":
                up_target[s.id] = t
            elif d == "down":
                down_target[s.id] = t

    visited: set[str] = set()
    buildings: dict[str, list[str]] = {}

    for s in scenes:
        if s.id in visited:
            continue
        if s.id not in up_target:
            continue
        if s.id in down_target:
            continue

        chain = [s.id]
        visited.add(s.id)
        current = s.id
        while current in up_target:
            nxt = up_target[current]
            if nxt in visited:
                break
            chain.append(nxt)
            visited.add(nxt)
            current = nxt

        if len(chain) >= 2:
            buildings[chain[0]] = chain

    return buildings


def compute_layout(
    scenes: list[Scene],
    buildings: dict[str, list[str]] | None = None,
) -> dict[str, tuple[float, float]]:
    """
    Fully automatic grid layout.

    1. Collapse multi-floor buildings into single nodes
    2. BFS initial placement following exit directions
    3. Float-space constraint relaxation
    4. Grid snapping with collision resolution
    5. Local search (swap / shift) to maximize constraint satisfaction
    6. Expand buildings back: all floors share the same position
    """
    from collections import deque
    import random

    if buildings is None:
        buildings = {}

    scene_map = {s.id: s for s in scenes}

    # Map each floor to its building anchor
    floor_to_anchor: dict[str, str] = {}
    for anchor, floors in buildings.items():
        for f in floors:
            floor_to_anchor[f] = anchor

    areas: dict[str, list[Scene]] = {}
    for s in scenes:
        prefix = s.id.split("_")[0]
        areas.setdefault(prefix, []).append(s)

    all_pos: dict[str, tuple[float, float]] = {}
    area_offset_x = 0.0

    for prefix, area_scenes in areas.items():
        id_set = {s.id for s in area_scenes}

        # Collapse buildings: use only anchors as representative nodes
        building_floors_in_area: set[str] = set()
        for anchor, floors in buildings.items():
            if anchor.split("_")[0] == prefix:
                for f in floors[1:]:  # skip anchor (keep it)
                    building_floors_in_area.add(f)

        # Layout IDs: exclude non-anchor building floors
        ids = [s.id for s in area_scenes if s.id not in building_floors_in_area]

        # Collect directional constraints, remapping building floors to anchors
        # Skip up/down within buildings
        constraints: list[tuple[str, str, int, int]] = []
        for s in area_scenes:
            src = floor_to_anchor.get(s.id, s.id)
            for d, t in s.exits.items():
                if t not in id_set:
                    continue
                tgt = floor_to_anchor.get(t, t)
                if src == tgt:
                    continue  # skip intra-building up/down
                dx, dy = DIR_OFFSETS.get(d, (1, 0))
                constraints.append((src, tgt, dx, dy))

        # Phase 1: BFS initialization — start from most-connected node
        ids_set = set(ids)
        adj: dict[str, list[tuple[str, str]]] = {sid: [] for sid in ids}
        for s in area_scenes:
            src = floor_to_anchor.get(s.id, s.id)
            if src not in ids_set:
                continue
            for d, t in s.exits.items():
                if t not in id_set:
                    continue
                tgt = floor_to_anchor.get(t, t)
                if tgt not in ids_set or src == tgt:
                    continue
                adj[src].append((d, tgt))

        start_id = max(ids, key=lambda sid: len(adj[sid]))
        fpos: dict[str, list[float]] = {start_id: [0.0, 0.0]}

        queue: deque[str] = deque([start_id])
        visited = {start_id}
        while queue:
            sid = queue.popleft()
            for d, target in adj[sid]:
                if target in visited:
                    continue
                visited.add(target)
                queue.append(target)
                dx, dy = DIR_OFFSETS.get(d, (1, 0))
                fpos[target] = [fpos[sid][0] + dx, fpos[sid][1] + dy]

        for sid in ids:
            if sid not in fpos:
                fpos[sid] = [0.0, 0.0]

        # Phase 2: Constraint relaxation in float space
        for iteration in range(800):
            rate = 0.15 * (1.0 - iteration / 800)
            for src, tgt, dx, dy in constraints:
                err_x = dx - (fpos[tgt][0] - fpos[src][0])
                err_y = dy - (fpos[tgt][1] - fpos[src][1])
                fpos[src][0] -= err_x * rate
                fpos[src][1] -= err_y * rate
                fpos[tgt][0] += err_x * rate
                fpos[tgt][1] += err_y * rate

        # Phase 3: Grid snap with clustering
        def _snap_axis(vals: list[tuple[float, str]]) -> dict[str, int]:
            vals.sort(key=lambda x: x[0])
            mapping: dict[str, int] = {}
            grid_idx = 0
            prev_v = None
            for v, sid in vals:
                if prev_v is not None and v - prev_v > 0.35:
                    grid_idx += 1
                mapping[sid] = grid_idx
                prev_v = v
            return mapping

        x_assign = _snap_axis([(fpos[s][0], s) for s in ids])
        y_assign = _snap_axis([(fpos[s][1], s) for s in ids])

        grid_pos: dict[str, tuple[int, int]] = {}
        for sid in ids:
            grid_pos[sid] = (x_assign[sid], y_assign[sid])

        # Resolve collisions
        occupied: dict[tuple[int, int], str] = {}
        for sid in ids:
            gp = grid_pos[sid]
            if gp not in occupied:
                occupied[gp] = sid
            else:
                # Try nearby cells, preferring constraint-compatible positions
                best_cell = None
                best_score = -1
                for r in range(1, 15):
                    for ox in range(-r, r + 1):
                        for oy in range(-r, r + 1):
                            c = (gp[0] + ox, gp[1] + oy)
                            if c in occupied:
                                continue
                            # Score by how many constraints this satisfies
                            score = 0
                            for src, tgt, dx, dy in constraints:
                                if src == sid:
                                    tp = grid_pos.get(tgt, c)
                                    if tp[0] - c[0] == dx and tp[1] - c[1] == dy:
                                        score += 1
                                elif tgt == sid:
                                    sp = grid_pos.get(src, c)
                                    if c[0] - sp[0] == dx and c[1] - sp[1] == dy:
                                        score += 1
                            if best_cell is None or score > best_score:
                                best_cell = c
                                best_score = score
                    if best_cell is not None:
                        break
                if best_cell:
                    grid_pos[sid] = best_cell
                    occupied[best_cell] = sid

        # Phase 4: Local search — try swaps and shifts to improve score
        def _score(gp: dict[str, tuple[int, int]]) -> int:
            s = 0
            for src, tgt, dx, dy in constraints:
                sp, tp = gp[src], gp[tgt]
                if tp[0] - sp[0] == dx and tp[1] - sp[1] == dy:
                    s += 1
            return s

        best_score = _score(grid_pos)
        rng = random.Random(42)  # deterministic
        improved = True
        rounds = 0
        while improved and rounds < 50:
            improved = False
            rounds += 1
            # Try swapping all pairs
            for i in range(len(ids)):
                for j in range(i + 1, len(ids)):
                    a, b = ids[i], ids[j]
                    grid_pos[a], grid_pos[b] = grid_pos[b], grid_pos[a]
                    ns = _score(grid_pos)
                    if ns > best_score:
                        best_score = ns
                        improved = True
                    else:
                        grid_pos[a], grid_pos[b] = grid_pos[b], grid_pos[a]

            # Try shifting individual nodes to adjacent empty cells
            occ_set = set(grid_pos.values())
            for sid in ids:
                old = grid_pos[sid]
                for ddx, ddy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nc = (old[0] + ddx, old[1] + ddy)
                    if nc in occ_set:
                        continue
                    occ_set.discard(old)
                    grid_pos[sid] = nc
                    occ_set.add(nc)
                    ns = _score(grid_pos)
                    if ns > best_score:
                        best_score = ns
                        improved = True
                        break
                    else:
                        occ_set.discard(nc)
                        grid_pos[sid] = old
                        occ_set.add(old)

        # Convert to pixel coordinates with variable row heights for buildings
        if grid_pos:
            min_c = min(c for c, r in grid_pos.values())
            min_r = min(r for c, r in grid_pos.values())
            max_r = max(r for c, r in grid_pos.values())

            # Compute height of each row (buildings may be taller than NODE_H)
            row_height: dict[int, float] = {}
            for r in range(min_r, max_r + 1):
                max_h = NODE_H
                for sid, (gc, gr) in grid_pos.items():
                    if gr == r and sid in buildings:
                        bh = FLOOR_STRIP_H * len(buildings[sid]) + 6
                        max_h = max(max_h, bh)
                row_height[r] = max_h

            ROW_GAP = CELL_H - NODE_H  # gap between rows
            # Cumulative y offset for each row
            row_y: dict[int, float] = {}
            cum_y = 0.0
            for r in range(min_r, max_r + 1):
                row_y[r] = cum_y
                cum_y += row_height[r] + ROW_GAP

            for sid, (c, r) in grid_pos.items():
                px = (c - min_c) * CELL_W + area_offset_x
                py = row_y[r]
                all_pos[sid] = (px, py)
                # Expand building floors: all get same position as anchor
                if sid in buildings:
                    for floor_id in buildings[sid][1:]:
                        all_pos[floor_id] = (px, py)
            max_c = max(c - min_c for c, r in grid_pos.values())
            area_offset_x += (max_c + 1) * CELL_W + 180

    return all_pos


# ── SVG Renderer ─────────────────────────────────────────────────────────────

AREA_COLORS = {
    "jz": {"fill": "#e8f4f8", "stroke": "#4a90a4", "node": "#4a90a4", "node_fill": "#d4eef6", "label": "江州鱼埠"},
    "yx": {"fill": "#f5eef8", "stroke": "#8e6aad", "node": "#8e6aad", "node_fill": "#ead8f5", "label": "云栖城"},
}
DEFAULT_AREA = {"fill": "#f0f0f0", "stroke": "#888", "node": "#888", "node_fill": "#ddd", "label": "未知区域"}

ENV_ICONS = {"river": "🌊", "sky": "☁️", "mountain": "⛰️"}
DANGER_COLOR = "#e74c3c"
NODE_W = 140
NODE_H = 56
PADDING = 100

DIR_LABELS = {
    "north": "北", "south": "南", "east": "东", "west": "西",
    "up": "上", "down": "下",
}

FLOOR_STRIP_H = 38   # height of each floor strip inside building box (2 lines)


def _render_building(
    svg: ET.Element,
    floors: list[str],
    scene_map: dict[str, Scene],
    x: float, y: float,
    colors: dict[str, str],
    npc_counts: dict[str, int],
    item_counts: dict[str, int],
    mob_scenes: set[str],
) -> None:
    """Render a multi-floor building as a single tall box with floor strips.

    Each floor has two lines:
      Line 1: floor name (with env icon)
      Line 2: Lv + NPC/item/mob icons
    """
    n = len(floors)
    box_h = FLOOR_STRIP_H * n + 6

    # Building grows downward: top floor starts at cell y, lower floors extend below
    box_y = y

    g = ET.SubElement(svg, "g", {"filter": "url(#shadow)"})

    ET.SubElement(g, "rect", {
        "x": f"{x:.1f}", "y": f"{box_y:.1f}",
        "width": str(NODE_W), "height": f"{box_h}",
        "rx": "10", "fill": colors["node_fill"],
        "stroke": colors["node"], "stroke-width": "2",
    })

    # Draw floors from top (highest) to bottom (anchor/ground)
    for i, fid in enumerate(reversed(floors)):
        scene = scene_map.get(fid)
        if not scene:
            continue

        strip_y = box_y + 3 + i * FLOOR_STRIP_H

        # Separator line between floors
        if i > 0:
            ET.SubElement(g, "line", {
                "x1": f"{x + 8:.1f}", "y1": f"{strip_y:.1f}",
                "x2": f"{x + NODE_W - 8:.1f}", "y2": f"{strip_y:.1f}",
                "stroke": colors["node"], "stroke-opacity": "0.2",
                "stroke-dasharray": "4,3",
            })

        # Line 1: floor name
        env_icon = ENV_ICONS.get(scene.environment, "")
        floor_label = f"{env_icon}{scene.name}" if env_icon else scene.name
        danger_mark = " ⚠️" if not scene.safe_zone else ""

        ET.SubElement(g, "text", {
            "x": f"{x + NODE_W / 2:.1f}", "y": f"{strip_y + 15:.1f}",
            "text-anchor": "middle", "font-size": "11", "font-weight": "600",
            "fill": DANGER_COLOR if not scene.safe_zone else colors["node"],
        }).text = floor_label + danger_mark

        # Line 2: stats
        parts = [f"Lv.{scene.level_min}-{scene.level_max}"]
        npcs = npc_counts.get(fid, 0)
        items = item_counts.get(fid, 0)
        if npcs:
            parts.append(f"👤{npcs}")
        if items:
            parts.append(f"📦{items}")
        if fid in mob_scenes:
            parts.append("⚔️")

        ET.SubElement(g, "text", {
            "x": f"{x + NODE_W / 2:.1f}", "y": f"{strip_y + 30:.1f}",
            "text-anchor": "middle", "font-size": "9", "fill": "#888",
        }).text = "  ".join(parts)

    # ↕ indicator
    ET.SubElement(g, "text", {
        "x": f"{x + NODE_W + 4:.1f}", "y": f"{box_y + box_h / 2 + 4:.1f}",
        "font-size": "12", "fill": colors["node"], "opacity": "0.6",
    }).text = f"↕{n}F"


def _port(x: float, y: float, direction: str, h: float = NODE_H) -> tuple[float, float]:
    """Get the connection port on a node's edge for a given direction."""
    cx, cy = x + NODE_W / 2, y + h / 2
    if direction in ("north", "up"):
        return cx, y
    elif direction in ("south", "down"):
        return cx, y + h
    elif direction == "east":
        return x + NODE_W, cy
    elif direction == "west":
        return x, cy
    return cx, cy


def _orthogonal_path(
    x1: float, y1: float, dir1: str,
    x2: float, y2: float, dir2: str,
) -> str:
    """Generate an orthogonal SVG path between two ports."""
    GAP = 16  # extend from port before bending

    # Extend from port in the exit direction
    def extend(px: float, py: float, d: str) -> tuple[float, float]:
        if d in ("north", "up"):
            return px, py - GAP
        elif d in ("south", "down"):
            return px, py + GAP
        elif d == "east":
            return px + GAP, py
        elif d == "west":
            return px - GAP, py
        return px, py

    ex1, ey1 = extend(x1, y1, dir1)
    ex2, ey2 = extend(x2, y2, dir2)

    # Connect with at most 2 bends (L or Z shape)
    # Midpoint approach: go to midpoint then turn
    points = [(x1, y1), (ex1, ey1)]

    # Determine if we need horizontal-first or vertical-first routing
    h1 = dir1 in ("east", "west")
    h2 = dir2 in ("east", "west")

    if h1 and h2:
        # Both horizontal: use vertical midpoint
        mx = (ex1 + ex2) / 2
        points += [(mx, ey1), (mx, ey2)]
    elif not h1 and not h2:
        # Both vertical: use horizontal midpoint
        my = (ey1 + ey2) / 2
        points += [(ex1, my), (ex2, my)]
    elif h1 and not h2:
        # Source horizontal, target vertical
        points += [(ex2, ey1)]
    else:
        # Source vertical, target horizontal
        points += [(ex1, ey2)]

    points += [(ex2, ey2), (x2, y2)]

    parts = [f"M {points[0][0]:.1f} {points[0][1]:.1f}"]
    for px, py in points[1:]:
        parts.append(f"L {px:.1f} {py:.1f}")
    return " ".join(parts)


def generate_svg(
    scenes: list[Scene],
    entities: list[SceneEntity],
    pos: dict[str, tuple[float, float]],
    buildings: dict[str, list[str]] | None = None,
) -> str:
    scene_map = {s.id: s for s in scenes}
    if buildings is None:
        buildings = {}

    # Set of all building floor IDs (non-anchor) — skip individual rendering
    building_floors: set[str] = set()
    for anchor, floors in buildings.items():
        for f in floors:
            building_floors.add(f)

    # Entity counts per scene
    npc_counts: dict[str, int] = {}
    item_counts: dict[str, int] = {}
    mob_scenes: set[str] = set()
    for e in entities:
        if e.entity_type == "npc":
            if "怪物" in e.tags or e.template_id.startswith("mob_"):
                mob_scenes.add(e.scene_id)
            else:
                npc_counts[e.scene_id] = npc_counts.get(e.scene_id, 0) + 1
        elif e.entity_type == "item":
            item_counts[e.scene_id] = item_counts.get(e.scene_id, 0) + e.quantity

    # Compute node heights (buildings are taller)
    def _node_h(sid: str) -> float:
        if sid in buildings:
            return FLOOR_STRIP_H * len(buildings[sid]) + 8
        return NODE_H

    # Normalize positions — buildings now grow downward, no special upward offset needed
    if pos:
        min_x = min(p[0] for p in pos.values())
        min_y = min(p[1] for p in pos.values())
        pos = {sid: (p[0] - min_x + PADDING, p[1] - min_y + PADDING) for sid, p in pos.items()}

    canvas_w = max(p[0] for p in pos.values()) + NODE_W + PADDING + 30 if pos else 800
    canvas_h = max(p[1] + _node_h(sid) for sid, p in pos.items()) + PADDING if pos else 600

    # Group by area
    areas: dict[str, list[str]] = {}
    for s in scenes:
        prefix = s.id.split("_")[0]
        areas.setdefault(prefix, []).append(s.id)

    svg = ET.Element("svg", {
        "xmlns": "http://www.w3.org/2000/svg",
        "viewBox": f"0 0 {canvas_w:.0f} {canvas_h:.0f}",
        "width": f"{canvas_w:.0f}",
        "height": f"{canvas_h:.0f}",
        "font-family": "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    })

    style = ET.SubElement(svg, "style")
    style.text = """
        .node-label { font-size: 13px; font-weight: 600; }
        .node-sub { font-size: 10px; fill: #666; }
        .edge-path { stroke-width: 2; fill: none; }
        .area-label { font-size: 18px; font-weight: 700; fill-opacity: 0.4; }
        .legend-text { font-size: 11px; fill: #555; }
    """

    defs = ET.SubElement(svg, "defs")
    filt = ET.SubElement(defs, "filter", {"id": "shadow", "x": "-5%", "y": "-5%", "width": "115%", "height": "115%"})
    ET.SubElement(filt, "feDropShadow", {"dx": "1", "dy": "2", "stdDeviation": "3", "flood-opacity": "0.12"})

    # Area backgrounds
    for prefix, scene_ids in areas.items():
        colors = AREA_COLORS.get(prefix, DEFAULT_AREA)
        xs = [pos[sid][0] for sid in scene_ids if sid in pos]
        if not xs:
            continue
        # Compute actual top/bottom accounting for building downward extension
        tops: list[float] = []
        bottoms: list[float] = []
        for sid in scene_ids:
            if sid not in pos:
                continue
            sy = pos[sid][1]
            if sid in buildings:
                bh = FLOOR_STRIP_H * len(buildings[sid]) + 6
                tops.append(sy)
                bottoms.append(sy + bh)
            else:
                tops.append(sy)
                bottoms.append(sy + NODE_H)
        pad = 50
        rx = min(xs) - pad
        ry = min(tops) - pad - 26
        rw = max(xs) - min(xs) + NODE_W + pad * 2
        rh = max(bottoms) - min(tops) + pad * 2 + 26
        ET.SubElement(svg, "rect", {
            "x": f"{rx:.0f}", "y": f"{ry:.0f}",
            "width": f"{rw:.0f}", "height": f"{rh:.0f}",
            "rx": "16", "fill": colors["fill"], "stroke": colors["stroke"],
            "stroke-width": "2", "stroke-dasharray": "8,4", "fill-opacity": "0.5",
        })
        ET.SubElement(svg, "text", {
            "x": f"{rx + 16:.0f}", "y": f"{ry + 22:.0f}",
            "class": "area-label", "fill": colors["stroke"],
        }).text = colors.get("label", prefix)

    # Draw orthogonal edges (skip intra-building connections)
    intra_building_pairs: set[tuple[str, str]] = set()
    floor_to_anchor: dict[str, str] = {}
    for anchor, floors in buildings.items():
        floor_set = set(floors)
        for f in floors:
            floor_to_anchor[f] = anchor
            if f in scene_map:
                for d, t in scene_map[f].exits.items():
                    if t in floor_set:
                        intra_building_pairs.add((f, t))

    drawn_edges: set[tuple[str, str]] = set()
    for s in scenes:
        prefix_a = s.id.split("_")[0]
        for direction, target in s.exits.items():
            if target not in pos or s.id not in pos:
                continue
            # Skip edges within the same building
            if (s.id, target) in intra_building_pairs:
                continue
            edge_key = tuple(sorted([s.id, target]))
            if edge_key in drawn_edges:
                continue
            drawn_edges.add(edge_key)  # type: ignore[arg-type]

            colors = AREA_COLORS.get(prefix_a, DEFAULT_AREA)
            prefix_b = target.split("_")[0]
            is_cross = prefix_a != prefix_b

            # For building floors, use the anchor's position
            src_id = floor_to_anchor.get(s.id, s.id)
            tgt_id = floor_to_anchor.get(target, target)
            ax, ay = pos[src_id]
            bx, by = pos[tgt_id]

            # Find reverse direction
            rev_dir = "south"
            if target in scene_map:
                for rdir, rtarget in scene_map[target].exits.items():
                    if rtarget == s.id:
                        rev_dir = rdir
                        break

            def _building_port(scene_id: str, anchor_id: str, px: float, py: float, d: str) -> tuple[float, float]:
                """Port on building box at the correct floor strip, or regular node."""
                if anchor_id not in buildings:
                    return _port(px, py, d)
                floors = buildings[anchor_id]
                n = len(floors)
                bh = FLOOR_STRIP_H * n + 6
                box_top = py  # building grows downward from cell y
                # For N/S on the whole box, use full box port
                if d in ("north", "up"):
                    return px + NODE_W / 2, box_top
                if d in ("south", "down"):
                    return px + NODE_W / 2, box_top + bh
                # For E/W, connect at the specific floor strip center
                if scene_id in floors:
                    floor_idx_from_top = (n - 1) - floors.index(scene_id)
                    strip_center_y = box_top + 3 + floor_idx_from_top * FLOOR_STRIP_H + FLOOR_STRIP_H / 2
                else:
                    strip_center_y = box_top + bh / 2
                if d == "east":
                    return px + NODE_W, strip_center_y
                if d == "west":
                    return px, strip_center_y
                return px + NODE_W / 2, strip_center_y

            px1, py1 = _building_port(s.id, src_id, ax, ay, direction)
            px2, py2 = _building_port(target, tgt_id, bx, by, rev_dir)

            path_d = _orthogonal_path(px1, py1, direction, px2, py2, rev_dir)

            # Determine if this is an up/down edge (vertical transport)
            is_vertical = direction in ("up", "down")

            ET.SubElement(svg, "path", {
                "d": path_d,
                "class": "edge-path",
                "stroke": "#e67e22" if is_vertical else colors["stroke"],
                "stroke-opacity": "0.6" if is_vertical or is_cross else "0.4",
                "stroke-dasharray": "4,4" if is_vertical else ("6,3" if is_cross else "none"),
                "stroke-width": "2.5" if is_vertical else "2",
            })

            # Add ↕ label on vertical edges
            if is_vertical:
                mid_x = (px1 + px2) / 2
                mid_y = (py1 + py2) / 2
                ET.SubElement(svg, "text", {
                    "x": f"{mid_x + 8:.1f}", "y": f"{mid_y:.1f}",
                    "font-size": "10", "fill": "#e67e22", "opacity": "0.8",
                }).text = "↕"

    # Draw nodes
    rendered_buildings: set[str] = set()
    for s in scenes:
        if s.id not in pos:
            continue

        # Skip building floors that aren't anchors (they're rendered as stacked cards)
        if s.id in building_floors and s.id not in buildings:
            continue

        x, y = pos[s.id]
        prefix = s.id.split("_")[0]
        colors = AREA_COLORS.get(prefix, DEFAULT_AREA)

        # Check if this is a building anchor
        if s.id in buildings:
            _render_building(svg, buildings[s.id], scene_map, x, y, colors,
                             npc_counts, item_counts, mob_scenes)
            continue

        g = ET.SubElement(svg, "g", {"filter": "url(#shadow)"})
        border_color = DANGER_COLOR if not s.safe_zone else colors["node"]
        ET.SubElement(g, "rect", {
            "x": f"{x:.1f}", "y": f"{y:.1f}",
            "width": str(NODE_W), "height": str(NODE_H),
            "rx": "10", "fill": colors["node_fill"],
            "stroke": border_color,
            "stroke-width": "2.5" if not s.safe_zone else "2",
        })

        env_icon = ENV_ICONS.get(s.environment, "")
        name_text = f"{env_icon} {s.name}" if env_icon else s.name
        ET.SubElement(g, "text", {
            "x": f"{x + NODE_W / 2:.1f}", "y": f"{y + 20:.1f}",
            "text-anchor": "middle", "class": "node-label", "fill": colors["node"],
        }).text = name_text

        parts = [f"Lv.{s.level_min}-{s.level_max}"]
        npcs = npc_counts.get(s.id, 0)
        items = item_counts.get(s.id, 0)
        if npcs:
            parts.append(f"👤×{npcs}")
        if items:
            parts.append(f"📦×{items}")
        if s.id in mob_scenes:
            parts.append("⚔️")

        ET.SubElement(g, "text", {
            "x": f"{x + NODE_W / 2:.1f}", "y": f"{y + 38:.1f}",
            "text-anchor": "middle", "class": "node-sub",
        }).text = "  ".join(parts)

        if not s.safe_zone:
            ET.SubElement(g, "text", {
                "x": f"{x + NODE_W - 8:.1f}", "y": f"{y + 14:.1f}",
                "text-anchor": "end", "font-size": "10",
            }).text = "⚠️"

    # Compass rose (top-right corner)
    cx, cy = canvas_w - 55, 60
    cg = ET.SubElement(svg, "g", {"opacity": "0.5"})
    ET.SubElement(cg, "circle", {
        "cx": f"{cx}", "cy": f"{cy}", "r": "28",
        "fill": "white", "stroke": "#999", "stroke-width": "1",
    })
    for label, dx, dy in [("北", 0, -16), ("南", 0, 22), ("东", 20, 4), ("西", -20, 4)]:
        ET.SubElement(cg, "text", {
            "x": f"{cx + dx}", "y": f"{cy + dy}",
            "text-anchor": "middle", "font-size": "11", "font-weight": "600", "fill": "#555",
        }).text = label
    # Arrow pointing north
    ET.SubElement(cg, "path", {
        "d": f"M {cx} {cy - 4} L {cx - 4} {cy + 4} L {cx + 4} {cy + 4} Z",
        "fill": "#e74c3c",
    })

    # Legend
    lx, ly = 16, canvas_h - 68
    lg = ET.SubElement(svg, "g")
    ET.SubElement(lg, "rect", {
        "x": f"{lx}", "y": f"{ly}", "width": "240", "height": "58",
        "rx": "8", "fill": "white", "stroke": "#ccc", "fill-opacity": "0.9",
    })
    for text, dy in [
        ("实线 = 同区域  虚线 = 跨区域", 18),
        ("⚠️ 红框 = 危险区域（非安全区）", 34),
        ("⚔️ = 怪物  👤 = NPC  📦 = 物品", 50),
    ]:
        ET.SubElement(lg, "text", {
            "x": f"{lx + 10}", "y": f"{ly + dy}",
            "class": "legend-text",
        }).text = text

    ET.indent(svg, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(svg, encoding="unicode")


def generate_overview_svg(
    scenes: list[Scene],
) -> str:
    """Generate overview SVG: area boxes containing scene names, cross-area links between scenes."""
    scene_map = {s.id: s for s in scenes}

    # Group scenes by area
    areas: dict[str, list[Scene]] = {}
    for s in scenes:
        prefix = s.id.split("_")[0]
        areas.setdefault(prefix, []).append(s)

    area_list = list(areas.keys())

    # Find cross-area connections
    cross_links: list[tuple[str, str, str, str, str]] = []
    cross_scene_ids: set[str] = set()
    seen: set[tuple[str, str]] = set()
    for s in scenes:
        prefix_a = s.id.split("_")[0]
        for d, t in s.exits.items():
            if t not in scene_map:
                continue
            prefix_b = t.split("_")[0]
            if prefix_a != prefix_b:
                key = tuple(sorted([s.id, t]))
                if key not in seen:
                    seen.add(key)  # type: ignore[arg-type]
                    cross_links.append((prefix_a, s.id, d, prefix_b, t))
                    cross_scene_ids.add(s.id)
                    cross_scene_ids.add(t)

    # Layout constants
    SCENE_LINE_H = 18
    AREA_PAD_X = 16
    AREA_PAD_TOP = 36
    AREA_PAD_BOT = 12
    AREA_W = 180
    GAP = 240
    PAD = 80

    # Compute area box heights based on scene count
    area_heights: dict[str, float] = {}
    for prefix, area_scenes in areas.items():
        area_heights[prefix] = AREA_PAD_TOP + len(area_scenes) * SCENE_LINE_H + AREA_PAD_BOT

    max_h = max(area_heights.values()) if area_heights else 200

    area_pos: dict[str, tuple[float, float]] = {}
    for i, prefix in enumerate(area_list):
        area_pos[prefix] = (PAD + i * (AREA_W + GAP), PAD)

    canvas_w = PAD * 2 + len(area_list) * AREA_W + max(0, len(area_list) - 1) * GAP
    canvas_h = PAD * 2 + max_h

    # Track scene label positions for drawing cross-area links
    scene_label_pos: dict[str, tuple[float, float]] = {}

    svg = ET.Element("svg", {
        "xmlns": "http://www.w3.org/2000/svg",
        "viewBox": f"0 0 {canvas_w:.0f} {canvas_h:.0f}",
        "width": f"{canvas_w:.0f}",
        "height": f"{canvas_h:.0f}",
        "font-family": "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    })

    style = ET.SubElement(svg, "style")
    style.text = """
        .area-title { font-size: 15px; font-weight: 700; }
        .scene-name { font-size: 11px; fill: #444; }
        .scene-name-cross { font-size: 11px; font-weight: 600; }
        .link-line { stroke-width: 2; fill: none; }
    """

    defs = ET.SubElement(svg, "defs")
    filt = ET.SubElement(defs, "filter", {"id": "shadow", "x": "-5%", "y": "-5%", "width": "115%", "height": "115%"})
    ET.SubElement(filt, "feDropShadow", {"dx": "1", "dy": "2", "stdDeviation": "3", "flood-opacity": "0.12"})

    # Draw area boxes with scene lists
    for prefix in area_list:
        x, y = area_pos[prefix]
        colors = AREA_COLORS.get(prefix, DEFAULT_AREA)
        h = area_heights[prefix]

        g = ET.SubElement(svg, "g", {"filter": "url(#shadow)"})
        ET.SubElement(g, "rect", {
            "x": f"{x:.0f}", "y": f"{y:.0f}",
            "width": str(AREA_W), "height": f"{h:.0f}",
            "rx": "12", "fill": colors["fill"],
            "stroke": colors["node"], "stroke-width": "2.5",
        })
        ET.SubElement(g, "text", {
            "x": f"{x + AREA_W / 2:.0f}", "y": f"{y + 24:.0f}",
            "text-anchor": "middle", "class": "area-title",
            "fill": colors["node"],
        }).text = colors.get("label", prefix)

        # Scene list
        for j, s in enumerate(areas[prefix]):
            sy = y + AREA_PAD_TOP + j * SCENE_LINE_H + 12
            is_cross = s.id in cross_scene_ids
            cls = "scene-name-cross" if is_cross else "scene-name"
            fill = colors["node"] if is_cross else "#444"
            marker = "● " if is_cross else "· "

            ET.SubElement(svg, "text", {
                "x": f"{x + AREA_PAD_X:.0f}", "y": f"{sy:.0f}",
                "class": cls, "fill": fill,
            }).text = marker + s.name

            # Store position for cross-area links
            scene_label_pos[s.id] = (x, sy - 4)  # left edge, vertically centered

    # Draw cross-area connections between specific scenes
    for pa, sa, d, pb, sb in cross_links:
        ax, ay = scene_label_pos[sa]
        bx, by = scene_label_pos[sb]
        pa_x = area_pos[pa][0]
        pb_x = area_pos[pb][0]

        # Connect from right edge of A's box to left edge of B's box
        if pa_x < pb_x:
            x1 = pa_x + AREA_W
            x2 = pb_x
        else:
            x1 = pa_x
            x2 = pb_x + AREA_W

        mx = (x1 + x2) / 2
        path_d = f"M {x1:.0f} {ay:.0f} L {mx:.0f} {ay:.0f} L {mx:.0f} {by:.0f} L {x2:.0f} {by:.0f}"

        colors_a = AREA_COLORS.get(pa, DEFAULT_AREA)
        ET.SubElement(svg, "path", {
            "d": path_d, "class": "link-line",
            "stroke": colors_a["stroke"],
            "stroke-opacity": "0.6",
            "stroke-dasharray": "6,3",
        })

        # Small dots at endpoints
        for dx, dy in [(x1, ay), (x2, by)]:
            ET.SubElement(svg, "circle", {
                "cx": f"{dx:.0f}", "cy": f"{dy:.0f}", "r": "3",
                "fill": colors_a["stroke"],
            })

    # Compass rose (top-right)
    cx, cy = canvas_w - 45, 50
    cg = ET.SubElement(svg, "g", {"opacity": "0.5"})
    ET.SubElement(cg, "circle", {
        "cx": f"{cx}", "cy": f"{cy}", "r": "26",
        "fill": "white", "stroke": "#999", "stroke-width": "1",
    })
    for label, ddx, ddy in [("北", 0, -14), ("南", 0, 20), ("东", 18, 4), ("西", -18, 4)]:
        ET.SubElement(cg, "text", {
            "x": f"{cx + ddx}", "y": f"{cy + ddy}",
            "text-anchor": "middle", "font-size": "11", "font-weight": "600", "fill": "#555",
        }).text = label
    ET.SubElement(cg, "path", {
        "d": f"M {cx} {cy - 3} L {cx - 4} {cy + 3} L {cx + 4} {cy + 3} Z",
        "fill": "#e74c3c",
    })

    ET.indent(svg, space="  ")
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(svg, encoding="unicode")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate SVG world map from seed SQL files")
    parser.add_argument("--input", "-i",
        default=str(Path(__file__).resolve().parent.parent / "supabase"),
        help="Path to a .sql file or a directory containing .sql files")
    parser.add_argument("--output-dir", "-o",
        default=str(Path(__file__).resolve().parent.parent / "docs"),
        help="Output directory for SVG files")
    args = parser.parse_args()

    input_path = Path(args.input)
    if input_path.is_dir():
        sql_files = sorted(input_path.glob("*.sql"))
        if not sql_files:
            print(f"❌ No .sql files found in {input_path}")
            return
        sql = "\n".join(f.read_text(encoding="utf-8") for f in sql_files)
        print(f"📂 Loaded {len(sql_files)} SQL files from {input_path}")
    elif input_path.is_file():
        sql = input_path.read_text(encoding="utf-8")
        print(f"📂 Loaded {input_path.name}")
    else:
        print(f"❌ Input not found: {input_path}")
        return

    scenes = extract_scenes(sql)
    entities = extract_scene_entities(sql)

    if not scenes:
        print("❌ No scenes found in SQL file(s).")
        return

    buildings = detect_buildings(scenes)
    if buildings:
        bcount = sum(len(f) for f in buildings.values())
        print(f"📍 Found {len(scenes)} scenes ({bcount} in {len(buildings)} buildings), {len(entities)} entity placements")
    else:
        print(f"📍 Found {len(scenes)} scenes, {len(entities)} entity placements")

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Group by area
    areas: dict[str, list[Scene]] = {}
    for s in scenes:
        prefix = s.id.split("_")[0]
        areas.setdefault(prefix, []).append(s)

    # 1. Per-area detail maps
    for prefix, area_scenes in areas.items():
        area_entities = [e for e in entities if e.scene_id.split("_")[0] == prefix]
        area_buildings = {k: v for k, v in buildings.items() if k.split("_")[0] == prefix}
        area_pos = compute_layout(area_scenes, area_buildings)
        area_svg = generate_svg(area_scenes, area_entities, area_pos, area_buildings)

        area_label = AREA_COLORS.get(prefix, DEFAULT_AREA).get("label", prefix)
        area_path = out_dir / f"map-{prefix}.svg"
        area_path.write_text(area_svg, encoding="utf-8")
        print(f"  🗺️  {area_label} -> {area_path.name}")

    # 2. Combined detail map (all areas)
    all_pos = compute_layout(scenes, buildings)
    all_svg = generate_svg(scenes, entities, all_pos, buildings)
    all_path = out_dir / "world-map.svg"
    all_path.write_text(all_svg, encoding="utf-8")
    print(f"  🗺️  完整地图 -> {all_path.name}")

    # 3. Overview map (area-to-area connections only)
    overview_svg = generate_overview_svg(scenes)
    overview_path = out_dir / "world-overview.svg"
    overview_path.write_text(overview_svg, encoding="utf-8")
    print(f"  🌐 总览地图 -> {overview_path.name}")

    print(f"\n✅ All maps saved to {out_dir}/")


if __name__ == "__main__":
    main()
