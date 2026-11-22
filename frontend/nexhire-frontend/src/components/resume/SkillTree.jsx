import { hierarchy, tree as treeLayout } from "d3-hierarchy";
import { AlertTriangle, CheckCircle2, ChevronRight, CircleDot } from "lucide-react";
import { useMemo, useState } from "react";

const NODE_WIDTH = 172;
const NODE_HEIGHT = 38;
const ROW_GAP = 10;
const COLUMN_GAP = 56;
const PADDING = 12;

const KIND_STYLES = {
  root: "border-accent bg-accent font-semibold text-white",
  section: "border-accent/50 bg-accent-soft font-semibold text-accent-dark",
  project: "border-line bg-surface font-medium",
  experience: "border-line bg-surface font-medium",
  skill_group: "border-line bg-surface font-medium",
  education: "border-line bg-surface",
  technology: "border-line bg-paper text-muted",
  skill: "border-line bg-paper text-muted",
};

const STATUS_ICONS = {
  verified: [CheckCircle2, "text-accent", "Verified"],
  developing: [CircleDot, "text-warn", "Developing"],
  weak: [AlertTriangle, "text-danger", "Weak"],
};

function initiallyOpen(root) {
  // Show the resume's main structure first; deeper detail opens on demand.
  return new Set([root.id, ...root.children.map((section) => section.id)]);
}

function linkPath(source, target) {
  const startX = source.y + NODE_WIDTH;
  const endX = target.y;
  const middleX = (startX + endX) / 2;
  return `M${startX},${source.x} C${middleX},${source.x} ${middleX},${target.x} ${endX},${target.x}`;
}

function SkillTree({ data, selectedId, onSelect }) {
  const [open, setOpen] = useState(() => initiallyOpen(data));

  const layout = useMemo(() => {
    const root = hierarchy(data, (node) => (open.has(node.id) ? node.children : null));
    treeLayout().nodeSize([NODE_HEIGHT + ROW_GAP, NODE_WIDTH + COLUMN_GAP])(root);
    const nodes = root.descendants();
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x));
    const maxY = Math.max(...nodes.map((n) => n.y));
    const offset = PADDING + NODE_HEIGHT / 2 - minX;
    nodes.forEach((n) => {
      n.x += offset;
      n.y += PADDING;
    });
    return {
      nodes,
      links: root.links(),
      width: maxY + NODE_WIDTH + PADDING * 2,
      height: maxX - minX + NODE_HEIGHT + PADDING * 2,
    };
  }, [data, open]);

  const handleClick = (node) => {
    onSelect(node);
    if (!node.children?.length || node.id === data.id) return;
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(node.id)) next.delete(node.id);
      else next.add(node.id);
      return next;
    });
  };

  return (
    <div className="overflow-auto rounded-lg bg-paper/50" tabIndex={0} aria-label="Resume tree, scrollable">
      <div className="relative" style={{ width: layout.width, height: layout.height }}>
        <svg className="absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
          {layout.links.map(({ source, target }) => (
            <path key={target.data.id} className="tree-link" d={linkPath(source, target)} fill="none" stroke="#c9c5b8" strokeWidth="1.5" />
          ))}
        </svg>
        <ul role="tree" aria-label="Resume structure">
          {layout.nodes.map((point) => {
            const node = point.data;
            const hasChildren = node.children.length > 0;
            const isOpen = open.has(node.id);
            const status = STATUS_ICONS[node.status];
            const StatusIcon = status?.[0];
            return (
              <li key={node.id} role="none" className="tree-node absolute"
                style={{ left: point.y, top: point.x - NODE_HEIGHT / 2, width: NODE_WIDTH, height: NODE_HEIGHT }}>
                <button
                  type="button"
                  role="treeitem"
                  aria-level={point.depth + 1}
                  aria-selected={selectedId === node.id}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  title={status ? `${node.label}: ${status[2]}` : node.label}
                  aria-label={status ? `${node.label}, ${status[2]}` : node.label}
                  onClick={() => handleClick(node)}
                  className={`flex h-full w-full items-center gap-1 rounded-lg border px-3 text-left text-[13px] transition-shadow hover:shadow-sm ${
                    KIND_STYLES[node.kind] || KIND_STYLES.skill
                  } ${selectedId === node.id ? "ring-2 ring-accent ring-offset-1" : ""}`}
                >
                  {StatusIcon && <StatusIcon size={14} className={`shrink-0 ${status[1]}`} aria-hidden="true" />}
                  <span className="min-w-0 flex-1 truncate">{node.label}</span>
                  {hasChildren && node.kind !== "root" && (
                    <>
                      {!isOpen && <span className="text-[11px] tabular-nums opacity-70">{node.children.length}</span>}
                      <ChevronRight size={13} className={`shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default SkillTree;
