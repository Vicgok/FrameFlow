import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  FolderKanban,
  Link2,
  PackageCheck,
  Search,
  Send,
} from "lucide-react";
import { useStudio } from "../data/store";
import { EDITING_STAGES } from "../data/types";
import { clientFor, dateLabel, daysUntil } from "../data/utils";
import {
  Avatar,
  Badge,
  Empty,
  Field,
  Modal,
  Panel,
  Progress,
} from "../components/ui";
import { ClientRequests, DeliverableList } from "../components/workflow";
import { useActions } from "../components/actions";
export function Projects() {
  const { data } = useStudio(),
    navigate = useNavigate();
  const [filter, setFilter] = useState("All projects"),
    [query, setQuery] = useState("");
  const items = data.projects.filter((p) => {
    const b = data.bookings.find((b) => b.id === p.bookingId)!;
    return (
      (filter === "All projects" || p.status === filter) &&
      `${clientFor(data, b).name} ${b.eventType}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">FROM CAPTURE TO CLIENT</div>
          <h1>
            Projects
            <span className="heading-count">{data.projects.length}</span>
          </h1>
          <p>Great images deserve an equally thoughtful handoff.</p>
        </div>
        <Badge tone="violet">
          {data.projects.filter((p) => p.status === "Editing").length} in
          post-production
        </Badge>
      </div>
      <div className="booking-toolbar">
        <div className="type-tabs">
          {[
            "All projects",
            "Upcoming",
            "Editing",
            "Ready for Delivery",
            "Delivered",
          ].map((s) => (
            <button
              key={s}
              className={filter === s ? "active" : ""}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="input-with-icon compact-input">
          <Search size={16} />
          <input
            aria-label="Search projects"
            placeholder="Find a project..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="project-grid">
        {items.map((p, i) => {
          const b = data.bookings.find((b) => b.id === p.bookingId)!;
          const deliverables = data.deliverables.filter(
              (d) => d.projectId === p.id,
            ),
            done = deliverables.filter((d) =>
              ["Approved", "Delivered"].includes(d.status),
            ).length;
          const editor = data.team.find((t) => t.id === p.editorId)!;
          return (
            <button
              className="project-card"
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div className={`project-cover cover-${i % 4}`}>
                <div className="cover-line" />
                <Camera size={32} strokeWidth={1.2} />
                <span>
                  {b.eventType.toUpperCase()}
                  <small>{dateLabel(b.eventDate, "d MMMM yyyy")}</small>
                </span>
                <Badge>{p.status}</Badge>
              </div>
              <div className="project-card-body">
                <h3>{clientFor(data, b).name}</h3>
                <p>{b.packageName}</p>
                <div className="project-progress-label">
                  <span>
                    {done} of {deliverables.length} deliverables ready
                  </span>
                  <strong>{p.completedStages.length * 10}%</strong>
                </div>
                <Progress value={p.completedStages.length * 10} />
                <div className="project-card-bottom">
                  <span>
                    <Avatar name={editor.name} small color={editor.color} />
                    {editor.name.split(" ")[0]}
                  </span>
                  <small
                    className={daysUntil(p.deadline) <= 2 ? "amber-text" : ""}
                  >
                    <Clock3 size={13} />
                    Due {dateLabel(p.deadline, "d MMM")}
                  </small>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {!items.length && (
        <Empty title="No projects match this view">
          Your next booking will get a project automatically.
        </Empty>
      )}
    </div>
  );
}
export function ProjectDetail() {
  const { id } = useParams();
  const { data, updateStatus, mutate, addActivity, toast } = useStudio();
  const navigate = useNavigate();
  const [handoff, setHandoff] = useState(false);
  const project = data.projects.find((p) => p.id === id);
  if (!project)
    return (
      <Empty
        title="Project not found"
        action={
          <button className="btn" onClick={() => navigate("/projects")}>
            All projects
          </button>
        }
      />
    );
  const b = data.bookings.find((b) => b.id === project.bookingId)!;
  const items = data.deliverables.filter((d) => d.projectId === project.id),
    ready = items.filter((d) =>
      ["Approved", "Delivered"].includes(d.status),
    ).length;
  return (
    <div className="page-enter">
      <button className="back-link" onClick={() => navigate("/projects")}>
        <ArrowLeft size={15} />
        All projects
      </button>
      <div className="page-heading detail-heading">
        <div>
          <div className="eyebrow">THE EDITING WORKSPACE</div>
          <h1>
            {clientFor(data, b).name}
            <Badge>{project.status}</Badge>
          </h1>
          <p>
            {b.eventType} · {project.status === "Upcoming" ? "Shoot" : "Shot"}{" "}
            {dateLabel(b.eventDate)} · {b.venue}
          </p>
        </div>
        <div className="button-row">
          <button className="btn" onClick={() => navigate(`/bookings/${b.id}`)}>
            View booking
            <ArrowRight size={15} />
          </button>
          {project.status !== "Delivered" && (
            <button
              className="btn primary"
              onClick={() =>
                project.status === "Ready for Delivery"
                  ? setHandoff(true)
                  : updateStatus(b.id, "Ready for Delivery")
              }
            >
              <PackageCheck size={16} />
              {project.status === "Ready for Delivery"
                ? "Prepare handoff"
                : "Ready for Delivery"}
            </button>
          )}
        </div>
      </div>
      <div className="project-detail-summary">
        <div>
          <span>PROJECT PROGRESS</span>
          <strong>{project.completedStages.length * 10}%</strong>
          <Progress value={project.completedStages.length * 10} />
        </div>
        <Field label="Delivery deadline">
          <input
            type="date"
            value={project.deadline}
            onChange={(e) => {
              mutate(
                (d) =>
                  (d.projects.find((p) => p.id === project.id)!.deadline =
                    e.target.value),
              );
              addActivity(b.id, "Project deadline updated", "project");
              toast("Delivery deadline saved.");
            }}
          />
        </Field>
        <Field label="Assigned editor">
          <select
            value={project.editorId}
            onChange={(e) => {
              mutate(
                (d) =>
                  (d.projects.find((p) => p.id === project.id)!.editorId =
                    e.target.value),
              );
              addActivity(
                b.id,
                `Editor assigned · ${data.team.find((t) => t.id === e.target.value)!.name}`,
                "project",
              );
              toast("Editor assigned.");
            }}
          >
            {data.team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.role}
              </option>
            ))}
          </select>
        </Field>
        <div>
          <span>DELIVERABLES READY</span>
          <strong>
            {ready}
            <small> / {items.length}</small>
          </strong>
        </div>
      </div>
      <div className="workspace-columns">
        <div>
          <Panel
            title="Editing workflow"
            subtitle="A steady path from raw files to a finished story."
            action={
              <Badge tone="violet">
                {project.completedStages.length} / 10 complete
              </Badge>
            }
          >
            <div className="editing-stage-grid">
              {EDITING_STAGES.map((stage, i) => (
                <label
                  key={stage}
                  className={`editing-stage ${project.completedStages.includes(stage) ? "done" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={project.completedStages.includes(stage)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      mutate((d) => {
                        const p = d.projects.find((p) => p.id === project.id)!;
                        p.completedStages = checked
                          ? [...p.completedStages, stage]
                          : p.completedStages.filter((s) => s !== stage);
                      });
                      addActivity(
                        b.id,
                        `${stage} ${checked ? "completed" : "reopened"}`,
                        "project",
                      );
                      toast(`${stage} ${checked ? "completed" : "reopened"}.`);
                    }}
                  />
                  <span className="stage-number">
                    {project.completedStages.includes(stage) ? (
                      <Check size={14} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <strong>{stage}</strong>
                </label>
              ))}
            </div>
          </Panel>
          <DeliverableList projectId={project.id} />
        </div>
        <div>
          <ClientRequests projectId={project.id} />
          <Panel
            title="The final handoff"
            subtitle="A considered finish to a beautiful story."
          >
            <div className="handoff-card">
              <span className="attention-icon violet">
                <PackageCheck size={24} />
              </span>
              <h3>
                {ready === items.length
                  ? "Your story is ready to share."
                  : "Make every detail delivery-ready."}
              </h3>
              <p>
                {ready} of {items.length} deliverables approved. Review the
                checklist, then prepare a client handoff.
              </p>
              <button className="btn" onClick={() => setHandoff(true)}>
                Preview client handoff
                <ArrowUpRightIcon />
              </button>
            </div>
          </Panel>
        </div>
      </div>
      {handoff && (
        <Modal
          title="A beautiful finish"
          subtitle={`${clientFor(data, b).name} · Client handoff preview`}
          onClose={() => setHandoff(false)}
          wide
        >
          <div className="modal-body">
            <div className="handoff-preview">
              <Camera size={34} />
              <span>YOUR STORY, BEAUTIFULLY CAPTURED</span>
              <h2>{clientFor(data, b).name}</h2>
              <p>
                {dateLabel(b.eventDate, "d MMMM yyyy")} · {b.venue}
              </p>
            </div>
            <div className="handoff-items">
              {items.map((d) => (
                <div key={d.id}>
                  <PackageCheck size={16} />
                  <strong>{d.title}</strong>
                  <Badge>{d.status}</Badge>
                </div>
              ))}
            </div>
            <p className="muted small-text">
              Client gallery and file hosting are previewed here. No files or
              links will be sent.
            </p>
            {ready < items.length && (
              <div className="inline-info">
                <Clock3 size={17} />
                {items.length - ready} deliverables still need approval. You can
                finish those, or confirm the handoff for this prototype.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setHandoff(false)}>
              Back to project
            </button>
            <button
              className="btn primary"
              onClick={() => {
                updateStatus(b.id, "Completed");
                setHandoff(false);
                toast(
                  "Client handoff confirmed. Project and booking completed.",
                );
              }}
            >
              <Check size={16} />
              Confirm delivery
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={15} />;
}
export function Deliverables() {
  const { data } = useStudio(),
    { open } = useActions();
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All deliverables"),
    [projectFilter, setProjectFilter] = useState("all");
  const items = data.deliverables.filter(
    (d) =>
      `${d.title} ${
        clientFor(
          data,
          data.bookings.find(
            (b) =>
              b.id ===
              data.projects.find((p) => p.id === d.projectId)!.bookingId,
          )!,
        ).name
      }`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All deliverables" ||
        (filter === "In progress" &&
          ["In Progress", "Ready for Review"].includes(d.status)) ||
        (filter === "Approved" && d.status === "Approved") ||
        (filter === "Delivered" && d.status === "Delivered") ||
        (filter === "Not started" && d.status === "Not Started")) &&
      (projectFilter === "all" || d.projectId === projectFilter),
  );
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">EVERY PROMISE, IN ONE PLACE</div>
          <h1>Deliverables</h1>
          <p>Keep the final details as thoughtful as the shoot itself.</p>
        </div>
      </div>
      <div className="booking-toolbar">
        <div className="type-tabs">
          {[
            "All deliverables",
            "Not started",
            "In progress",
            "Approved",
            "Delivered",
          ].map((s) => (
            <button
              className={s === filter ? "active" : ""}
              key={s}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-row">
        <div className="input-with-icon">
          <Search size={16} />
          <input
            placeholder="Search deliverables or clients..."
            aria-label="Search deliverables"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by project"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="all">All projects</option>
          {data.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {
                clientFor(
                  data,
                  data.bookings.find((b) => b.id === p.bookingId)!,
                ).name
              }
            </option>
          ))}
        </select>
        <span className="filter-count">{items.length} deliverables</span>
      </div>
      <div className="deliverables-grid">
        {items.map((d) => {
          const p = data.projects.find((p) => p.id === d.projectId)!;
          const b = data.bookings.find((b) => b.id === p.bookingId)!;
          const member = data.team.find((t) => t.id === d.assigneeId)!;
          return (
            <button
              className="deliverable-card"
              key={d.id}
              onClick={() => open({ kind: "deliverable", id: d.id })}
            >
              <div>
                <span className="attention-icon violet">
                  <PackageCheck size={19} />
                </span>
                <Badge>{d.status}</Badge>
              </div>
              <h3>{d.title}</h3>
              <p>
                {clientFor(data, b).name} · {b.eventType}
              </p>
              {d.clientNotes && (
                <span className="attached-note">Client notes attached</span>
              )}
              <footer>
                <span>
                  <Avatar name={member.name} small color={member.color} />
                  {member.name.split(" ")[0]}
                </span>
                <span>
                  <CalendarDays size={13} />
                  {dateLabel(d.dueDate, "d MMM")}
                </span>
              </footer>
            </button>
          );
        })}
      </div>
      {!items.length && (
        <Empty title="Nothing in this view">
          Try another status or project.
        </Empty>
      )}
    </div>
  );
}
