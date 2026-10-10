export const BOOKING_STATUSES = [
  "New Enquiry",
  "Proposal Sent",
  "Awaiting Advance",
  "Confirmed",
  "Shoot Completed",
  "Editing",
  "Ready for Delivery",
  "Completed",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export const EVENT_TYPES = [
  "Wedding",
  "Pre-wedding",
  "Engagement",
  "Reception",
  "Corporate",
  "Portrait",
  "Event",
] as const;
export const DELIVERABLE_STATUSES = [
  "Not Started",
  "In Progress",
  "Ready for Review",
  "Approved",
  "Delivered",
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];
export const EDITING_STAGES = [
  "Media Backup",
  "Culling",
  "Photo Selection",
  "Color Correction",
  "Retouching",
  "Album Design",
  "Video Editing",
  "Client Review",
  "Final Export",
  "Delivery",
];
export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  notes: string;
}
export interface Booking {
  id: string;
  clientId: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  packageName: string;
  totalAmount: number;
  paidAmount: number;
  paymentDueDate: string;
  status: BookingStatus;
  assignedMembers: string[];
  createdAt: string;
  notes: string;
}
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  notes: string;
}
export interface PaymentMilestone {
  id: string;
  bookingId: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
}
export interface Project {
  id: string;
  bookingId: string;
  status: "Upcoming" | "Editing" | "Ready for Delivery" | "Delivered";
  deadline: string;
  editorId: string;
  completedStages: string[];
}
export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: DeliverableStatus;
  assigneeId: string;
  dueDate: string;
  clientNotes: string;
  internalNotes: string;
  completedAt?: string;
  checklist: { id: string; title: string; done: boolean }[];
}
export interface ClientRequest {
  id: string;
  projectId: string;
  text: string;
  done: boolean;
}
export interface CalendarBlock {
  id: string;
  reason: string;
  start: string;
  end: string;
  allDay: boolean;
  repeat: string;
}
export interface Activity {
  id: string;
  bookingId: string;
  text: string;
  createdAt: string;
  kind: "booking" | "payment" | "project" | "note";
}
export interface Notification {
  id: string;
  title: string;
  description: string;
  bookingId?: string;
  read: boolean;
  kind: string;
}
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
}
export interface StudioSettings {
  name: string;
  owner: string;
  phone: string;
  city: string;
  services: string[];
  advance: number;
  beforeEvent: number;
  delivery: number;
  onboarded: boolean;
}
export interface StudioData {
  clients: Client[];
  bookings: Booking[];
  payments: Payment[];
  milestones: PaymentMilestone[];
  projects: Project[];
  deliverables: Deliverable[];
  requests: ClientRequest[];
  blocks: CalendarBlock[];
  activities: Activity[];
  notifications: Notification[];
  team: TeamMember[];
  settings: StudioSettings;
}
export interface BookingInput {
  clientName: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  packageName: string;
  totalAmount: number;
  advance: number;
  paymentDueDate: string;
  memberId: string;
  notes: string;
}
