import type { StudioData } from "./types";
import { EDITING_STAGES } from "./types";
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const SEED_BOOKING_ID = id(101);
export function createSeed(): StudioData {
  const names = [
    "Vignesh & Karthiga",
    "Sneha & Arun",
    "Karthik & Divya",
    "Ananya Sharma",
    "Aarav & Nisha",
    "Meera & Aditya",
    "Foundry Collective",
    "Riya & Sanjay",
  ];
  const clients = names.map((name, i) => ({
    id: id(i + 1),
    name,
    phone: `+91 9840${125610 + i * 123}`,
    email: `${name.split(" ")[0].toLowerCase()}@${i === 6 ? "foundry.co" : "gmail.com"}`,
    city: "Chennai",
    notes:
      i === 0
        ? "Referred by Meera. Prefers warm, natural tones and candid storytelling."
        : "",
  }));
  const details: [
    string,
    string,
    string,
    number,
    number,
    string,
    StudioData["bookings"][number]["status"],
  ][] = [
    [
      "Wedding",
      "2026-10-14",
      "ITC Grand Chola, Chennai",
      85000,
      60000,
      "2026-10-09",
      "Awaiting Advance",
    ],
    [
      "Engagement",
      "2026-10-20",
      "Taj Coromandel, Chennai",
      45000,
      15000,
      "2026-10-17",
      "Confirmed",
    ],
    [
      "Reception",
      "2026-10-26",
      "The Leela Palace, Chennai",
      65000,
      65000,
      "2026-10-23",
      "Confirmed",
    ],
    [
      "Portrait",
      "2026-11-02",
      "FrameFlow Studio, Adyar",
      12000,
      5000,
      "2026-10-30",
      "Proposal Sent",
    ],
    [
      "Wedding",
      "2026-10-11",
      "The Leela Palace, Chennai",
      120000,
      95000,
      "2026-10-11",
      "Confirmed",
    ],
    [
      "Pre-wedding",
      "2026-10-18",
      "Shore Temple, Mahabalipuram",
      38000,
      20000,
      "2026-10-16",
      "New Enquiry",
    ],
    [
      "Corporate",
      "2026-10-23",
      "Foundry HQ, ECR",
      90000,
      70000,
      "2026-10-08",
      "Editing",
    ],
    [
      "Reception",
      "2026-10-04",
      "Taj Coromandel, Chennai",
      55000,
      55000,
      "2026-10-03",
      "Editing",
    ],
  ];
  const bookings = details.map(
    (
      [
        eventType,
        eventDate,
        venue,
        totalAmount,
        paidAmount,
        paymentDueDate,
        status,
      ],
      i,
    ) => ({
      id: id(101 + i),
      clientId: clients[i].id,
      eventType,
      eventDate: i === 6 ? "2026-10-01" : eventDate,
      startTime: i === 0 || i === 4 ? "07:00" : "16:00",
      endTime: i === 0 || i === 4 ? "15:00" : "20:00",
      venue,
      packageName:
        eventType === "Wedding"
          ? "Premium Wedding"
          : eventType === "Portrait"
            ? "Portrait Essentials"
            : "Signature " + eventType,
      totalAmount,
      paidAmount,
      paymentDueDate,
      status,
      assignedMembers: [
        id(901),
        ...(i === 0 || i === 4 ? [id(902), id(903)] : []),
      ],
      createdAt: "2026-10-06T09:00:00",
      notes:
        i === 0
          ? "Traditional morning ceremony followed by family portraits. Arrive by 6:30 AM for setup."
          : "",
    }),
  );
  const projects = bookings.map((b, i) => ({
    id: id(201 + i),
    bookingId: b.id,
    status: (i >= 6
      ? "Editing"
      : "Upcoming") as StudioData["projects"][number]["status"],
    deadline:
      i === 7
        ? "2026-10-12"
        : i === 6
          ? "2026-10-18"
          : i === 0
            ? "2026-11-10"
            : "2026-11-15",
    editorId: id(903),
    completedStages: i >= 6 ? EDITING_STAGES.slice(0, i === 7 ? 7 : 5) : [],
  }));
  const deliverables = projects.flatMap((p, i) =>
    [
      "500 edited photographs",
      "Couple portraits",
      "Wedding highlight film",
      "Full ceremony video",
      "Instagram teaser reel",
      "40-page wedding album",
      "RAW backup archive",
    ].map((title, j) => ({
      id: id(300 + i * 10 + j),
      projectId: p.id,
      title: i === 6 && j === 2 ? "Brand highlight film" : title,
      description:
        j === 2
          ? "A 3–5 minute cinematic story, with licensed music and clean audio."
          : "Final exports prepared in high resolution and web-friendly formats.",
      status: (i >= 6 && j < (i === 7 ? 5 : 3)
        ? "Approved"
        : i >= 6 && j < 5
          ? "In Progress"
          : "Not Started") as StudioData["deliverables"][number]["status"],
      assigneeId: id(j > 1 ? 903 : 901),
      dueDate: p.deadline,
      clientNotes:
        j === 0 ? "Please include more candid photos of grandparents." : "",
      internalNotes: "",
      checklist: [
        {
          id: id(600 + i * 30 + j * 3),
          title: "Check quality and color consistency",
          done: i >= 6 && j < 3,
        },
        {
          id: id(601 + i * 30 + j * 3),
          title: "Prepare final export",
          done: false,
        },
      ],
    })),
  );
  return {
    clients,
    bookings,
    projects,
    deliverables,
    payments: bookings.map((b, i) => ({
      id: id(701 + i),
      bookingId: b.id,
      amount: b.paidAmount,
      date: "2026-10-07",
      method: "Bank Transfer",
      reference: `FF-2026-${String(i + 1).padStart(3, "0")}`,
      notes: "Opening payment balance",
    })),
    milestones: bookings.flatMap((b, i) => {
      let remaining = b.paidAmount;
      return [
        ["Booking advance", 0.3, "2026-10-07"],
        ["Before event", 0.4, b.paymentDueDate],
        ["Final delivery", 0.3, projects[i].deadline],
      ].map(([title, fraction, dueDate], j) => {
        const amount = Math.round(b.totalAmount * Number(fraction));
        const paidAmount = Math.min(remaining, amount);
        remaining -= paidAmount;
        return {
          id: id(801 + i * 3 + j),
          bookingId: b.id,
          title: String(title),
          amount,
          paidAmount,
          dueDate: String(dueDate),
        };
      });
    }),
    requests: projects.flatMap((p, i) =>
      (i === 6
        ? [
            "Wide shots of the workspace",
            "Team portraits",
            "Capture keynote speaker",
          ]
        : [
            "Bride entry",
            "Candid family photos",
            "Stage portraits",
            "Grandparents",
            "Ring exchange close-up",
            "Do not include photos from the dressing room.",
          ]
      ).map((text, j) => ({
        id: id(1000 + i * 10 + j),
        projectId: p.id,
        text,
        done: i >= 6 && j < 2,
      })),
    ),
    blocks: [
      {
        id: id(1201),
        reason: "Travel · Mahabalipuram",
        start: "2026-10-17T00:00",
        end: "2026-10-18T00:00",
        allDay: true,
        repeat: "Does not repeat",
      },
      {
        id: id(1202),
        reason: "Editing · Focus time",
        start: "2026-10-13T10:00",
        end: "2026-10-13T14:00",
        allDay: false,
        repeat: "Weekly",
      },
    ],
    activities: bookings.flatMap((b, i) => [
      {
        id: id(1300 + i * 3),
        bookingId: b.id,
        text: "Enquiry created",
        createdAt: "2026-10-06T09:00:00",
        kind: "booking" as const,
      },
      {
        id: id(1301 + i * 3),
        bookingId: b.id,
        text: "Proposal sent to client",
        createdAt: "2026-10-07T10:30:00",
        kind: "booking" as const,
      },
      {
        id: id(1302 + i * 3),
        bookingId: b.id,
        text: `₹${b.paidAmount.toLocaleString("en-IN")} received by bank transfer`,
        createdAt: "2026-10-08T11:00:00",
        kind: "payment" as const,
      },
    ]),
    notifications: [
      {
        id: id(1401),
        title: "Payment needs a nudge",
        description: "₹25,000 pending from Vignesh & Karthiga",
        bookingId: bookings[0].id,
        read: false,
        kind: "payment",
      },
      {
        id: id(1402),
        title: "You have a shoot tomorrow",
        description: "Aarav & Nisha · 7:00 AM · The Leela Palace",
        bookingId: bookings[4].id,
        read: false,
        kind: "booking",
      },
      {
        id: id(1403),
        title: "Delivery deadline approaching",
        description: "Riya & Sanjay · 12 October",
        bookingId: bookings[7].id,
        read: false,
        kind: "project",
      },
    ],
    team: [
      {
        id: id(901),
        name: "Arjun Kumar",
        role: "Photographer",
        initials: "AK",
        color: "violet",
      },
      {
        id: id(902),
        name: "Maya Joseph",
        role: "Photographer",
        initials: "MJ",
        color: "amber",
      },
      {
        id: id(903),
        name: "Siddharth Rao",
        role: "Editor",
        initials: "SR",
        color: "blue",
      },
    ],
    settings: {
      name: "Arjun Photography",
      owner: "Arjun Kumar",
      phone: "+91 98401 25610",
      city: "Chennai",
      services: ["Wedding", "Engagement", "Pre-wedding", "Portrait"],
      advance: 30,
      beforeEvent: 40,
      delivery: 30,
      onboarded: false,
    },
  };
}
