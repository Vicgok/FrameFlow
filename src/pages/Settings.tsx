import { useState } from "react";
import {
  ArrowDownToLine,
  Check,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useStudio } from "../data/store";
import { EVENT_TYPES } from "../data/types";
import { Avatar, Badge, Field, Modal, Panel } from "../components/ui";
export function SettingsPage() {
  const { data, mutate, reset, toast } = useStudio();
  const [settings, set] = useState(data.settings),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState("");
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "frameflow-studio-backup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Workspace backup downloaded.");
  }
  return (
    <div className="page-enter settings-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">MAKE ROOM FOR YOUR WAY OF WORKING</div>
          <h1>Studio settings</h1>
          <p>A few thoughtful defaults make every new booking easier.</p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            settings.advance + settings.beforeEvent + settings.delivery !==
            100
          ) {
            setError("Payment percentages must add up to 100%.");
            return;
          }
          mutate((d) => (d.settings = { ...settings, onboarded: true }));
          setError("");
          toast("Studio settings saved.");
        }}
      >
        <Panel
          title="Studio profile"
          subtitle="The name and people behind the work."
        >
          <div className="settings-form">
            <div className="settings-avatar">
              <Avatar name={settings.owner} />
              <div>
                <strong>{settings.owner}</strong>
                <small>Studio owner</small>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Studio name">
                <input
                  required
                  value={settings.name}
                  onChange={(e) => set((s) => ({ ...s, name: e.target.value }))}
                />
              </Field>
              <Field label="Owner name">
                <input
                  required
                  value={settings.owner}
                  onChange={(e) =>
                    set((s) => ({ ...s, owner: e.target.value }))
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  required
                  type="tel"
                  value={settings.phone}
                  onChange={(e) =>
                    set((s) => ({ ...s, phone: e.target.value }))
                  }
                />
              </Field>
              <Field label="City">
                <input
                  required
                  value={settings.city}
                  onChange={(e) => set((s) => ({ ...s, city: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        </Panel>
        <Panel
          title="Photography services"
          subtitle="The kinds of stories your studio captures."
        >
          <div className="settings-services">
            {EVENT_TYPES.map((s) => (
              <label key={s} className="check-row">
                <input
                  type="checkbox"
                  checked={settings.services.includes(s)}
                  onChange={(e) =>
                    set((v) => ({
                      ...v,
                      services: e.target.checked
                        ? [...v.services, s]
                        : v.services.filter((t) => t !== s),
                    }))
                  }
                />
                {s}
              </label>
            ))}
          </div>
        </Panel>
        <Panel
          title="Default payment milestones"
          subtitle="Applied to new bookings. Existing schedules stay as agreed."
        >
          <div className="settings-form payment-defaults">
            {(["advance", "beforeEvent", "delivery"] as const).map((key, i) => (
              <Field
                key={key}
                label={
                  [
                    "Booking advance (%)",
                    "Before event (%)",
                    "Before delivery (%)",
                  ][i]
                }
              >
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={settings[key]}
                  onChange={(e) =>
                    set((s) => ({ ...s, [key]: Number(e.target.value) }))
                  }
                />
              </Field>
            ))}
          </div>
        </Panel>
        {error && <p className="form-error">{error}</p>}
        <div className="settings-save">
          <button className="btn primary">
            <Save size={16} />
            Save changes
          </button>
        </div>
      </form>
      <Panel
        title="Your prototype workspace"
        subtitle="Your data is saved in this browser."
      >
        <div className="settings-data">
          <div className="inline-info">
            <ShieldCheck size={20} />
            <span>
              Bookings, payments, projects, and calendar blocks persist locally.
              Download a backup before clearing browser data.
            </span>
          </div>
          <div className="button-row">
            <button className="btn" onClick={exportData}>
              <ArrowDownToLine size={16} />
              Download backup
            </button>
            <button className="btn danger" onClick={() => setConfirm(true)}>
              <RefreshCw size={15} />
              Reset demo workspace
            </button>
          </div>
        </div>
      </Panel>
      <Panel
        title="Your team"
        subtitle="The people behind every finished story."
      >
        <div className="settings-team">
          {data.team.map((t) => (
            <div key={t.id}>
              <Avatar name={t.name} color={t.color} />
              <span>
                <strong>{t.name}</strong>
                <small>{t.role}</small>
              </span>
              <Badge tone="neutral">Team member</Badge>
            </div>
          ))}
        </div>
      </Panel>
      {confirm && (
        <Modal
          title="Start fresh with the sample studio?"
          subtitle="This replaces this browser’s bookings, payments, and projects with the original demo data."
          onClose={() => setConfirm(false)}
        >
          <div className="modal-body">
            <p>Download a backup first if you want to keep your changes.</p>
          </div>
          <div className="modal-footer">
            <button className="btn" onClick={() => setConfirm(false)}>
              Keep my workspace
            </button>
            <button
              className="btn danger"
              onClick={() => {
                reset();
                setConfirm(false);
                set(createSeedSettings());
              }}
            >
              Reset demo
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
  function createSeedSettings() {
    return {
      name: "Arjun Photography",
      owner: "Arjun Kumar",
      phone: "+91 98401 25610",
      city: "Chennai",
      services: ["Wedding", "Engagement", "Pre-wedding", "Portrait"],
      advance: 30,
      beforeEvent: 40,
      delivery: 30,
      onboarded: true,
    };
  }
}
