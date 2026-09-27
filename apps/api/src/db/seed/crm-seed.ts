import type { TX } from "$/db";
import {
  type ArtistType,
  type BookingStatus,
  contactQueriesTable,
  followUpsTable,
  type LeadSource,
  type LeadStatus,
  leadActivitiesTable,
  leadNotesTable,
  leadsTable,
  studioBookingsTable,
  waBroadcastListMembersTable,
  waBroadcastListsTable,
  waTemplatesTable,
} from "$/db/schema";
import { istDate } from "$/lib/utils/time";

const H = 3_600_000;
const D = 24 * H;

function istDayOffset(days: number) {
  return new Date(Date.now() + days * D).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
}

type LeadSeed = {
  name: string;
  phone: string;
  city: string;
  source: LeadSource;
  status: LeadStatus;
  priority?: "low" | "medium" | "high";
  tags: string[];
  daysAgo: number;
};

const leads: LeadSeed[] = [
  {
    name: "Jaskaran Singh",
    phone: "919814000101",
    city: "Amritsar",
    source: "booking",
    status: "new",
    tags: ["studio", "raagi"],
    daysAgo: 1,
    priority: "high",
  },
  {
    name: "Bhai Manpreet Singh Jatha",
    phone: "919814000102",
    city: "Patiala",
    source: "booking",
    status: "contacted",
    tags: ["studio", "kirtani_jatha"],
    daysAgo: 3,
  },
  {
    name: "Simran Kaur",
    phone: "919814000103",
    city: "Ludhiana",
    source: "booking",
    status: "shortlisted",
    tags: ["studio", "singer"],
    daysAgo: 6,
    priority: "high",
  },
  {
    name: "Harpreet Singh",
    phone: "919814000104",
    city: "Jalandhar",
    source: "booking",
    status: "recorded",
    tags: ["studio", "raagi"],
    daysAgo: 21,
  },
  {
    name: "Gurbani Youth Band",
    phone: "919814000105",
    city: "Mohali",
    source: "booking",
    status: "follow_up",
    tags: ["studio", "band"],
    daysAgo: 4,
  },
  {
    name: "Navjot Kaur",
    phone: "919814000106",
    city: "Ludhiana",
    source: "query",
    status: "new",
    tags: ["query"],
    daysAgo: 0,
  },
  {
    name: "Gurdwara Singh Sabha Committee",
    phone: "919814000107",
    city: "Ludhiana",
    source: "query",
    status: "follow_up",
    tags: ["query", "event"],
    daysAgo: 5,
    priority: "high",
  },
  {
    name: "Rajinder Singh Bedi",
    phone: "919814000108",
    city: "Delhi",
    source: "query",
    status: "contacted",
    tags: ["query", "event"],
    daysAgo: 8,
  },
  {
    name: "Amarjit Kaur",
    phone: "919814000109",
    city: "Toronto",
    source: "query",
    status: "closed",
    tags: ["query", "nri"],
    daysAgo: 40,
    priority: "low",
  },
  {
    name: "Kulwant Singh",
    phone: "919814000110",
    city: "Bathinda",
    source: "whatsapp",
    status: "new",
    tags: ["whatsapp"],
    daysAgo: 2,
  },
  {
    name: "Tejinder Pal Singh",
    phone: "919814000111",
    city: "Ludhiana",
    source: "whatsapp",
    status: "contacted",
    tags: ["whatsapp", "raagi"],
    daysAgo: 12,
  },
  {
    name: "Sukhmani Sewa Society",
    phone: "919814000112",
    city: "Khanna",
    source: "event",
    status: "follow_up",
    tags: ["event"],
    daysAgo: 9,
  },
  {
    name: "Baljeet Singh",
    phone: "919814000113",
    city: "Moga",
    source: "manual",
    status: "recorded",
    tags: ["studio", "raagi"],
    daysAgo: 35,
  },
  {
    name: "Ravneet Kaur",
    phone: "919814000114",
    city: "Chandigarh",
    source: "booking",
    status: "new",
    tags: ["studio", "singer"],
    daysAgo: 0,
  },
  {
    name: "Bhai Satnam Singh Ragi",
    phone: "919814000115",
    city: "Anandpur Sahib",
    source: "booking",
    status: "shortlisted",
    tags: ["studio", "raagi"],
    daysAgo: 10,
  },
  {
    name: "Inderjit Singh",
    phone: "919814000116",
    city: "Phagwara",
    source: "manual",
    status: "closed",
    tags: ["studio"],
    daysAgo: 50,
    priority: "low",
  },
  {
    name: "Mehakdeep Kaur",
    phone: "919814000117",
    city: "Ludhiana",
    source: "query",
    status: "new",
    tags: ["query", "learning"],
    daysAgo: 1,
  },
  {
    name: "Khalsa College Gurmat Sangeet Dept.",
    phone: "919814000118",
    city: "Amritsar",
    source: "event",
    status: "contacted",
    tags: ["event", "education"],
    daysAgo: 15,
  },
  {
    name: "Parminder Singh",
    phone: "919814000119",
    city: "Sangrur",
    source: "whatsapp",
    status: "follow_up",
    tags: ["whatsapp", "studio"],
    daysAgo: 6,
  },
  {
    name: "Arshdeep Singh",
    phone: "919814000120",
    city: "Ludhiana",
    source: "booking",
    status: "contacted",
    tags: ["studio", "singer"],
    daysAgo: 2,
  },
];

export async function crmSeed(tx: TX, packageIds: number[], adminId: number) {
  console.info("Seeding CRM data...");
  const inserted = await tx
    .insert(leadsTable)
    .values(
      leads.map((l) => ({
        name: l.name,
        phone: l.phone,
        city: l.city,
        source: l.source,
        status: l.status,
        priority: l.priority ?? "medium",
        tags: l.tags,
        assignedTo: adminId,
        createdAt: new Date(Date.now() - l.daysAgo * D - 3 * H),
        lastContactedAt:
          l.status === "new"
            ? null
            : new Date(Date.now() - Math.max(0, l.daysAgo - 1) * D),
      })),
    )
    .returning();
  const byName = new Map(inserted.map((l) => [l.name, l]));
  const lead = (name: string) => {
    const l = byName.get(name);
    if (!l) throw new Error(`seed lead ${name} missing`);
    return l;
  };

  // Activities: every lead gets a "created" entry.
  await tx.insert(leadActivitiesTable).values(
    inserted.map((l) => ({
      leadId: l.id,
      kind: "created" as const,
      message: `Lead created from ${l.source}`,
      createdAt: l.createdAt,
    })),
  );

  // Studio bookings
  type B = {
    who: string;
    artistType: ArtistType;
    pkg: number | null;
    status: BookingStatus;
    title: string;
    preferred: number;
    time: string;
    scheduleDay?: number;
    scheduleTime?: string;
    duration: number;
    sample?: string;
    remark?: string;
  };
  const bookings: B[] = [
    {
      who: "Jaskaran Singh",
      artistType: "raagi",
      pkg: packageIds[0] ?? null,
      status: "pending",
      title: "Shabad: Mere Man Lochai",
      preferred: 5,
      time: "11:00",
      duration: 2,
      sample: "https://youtube.com/@jaskaransingh",
    },
    {
      who: "Ravneet Kaur",
      artistType: "singer",
      pkg: null,
      status: "pending",
      title: "Devotional single",
      preferred: 7,
      time: "15:00",
      duration: 3,
    },
    {
      who: "Bhai Manpreet Singh Jatha",
      artistType: "kirtani_jatha",
      pkg: packageIds[1] ?? null,
      status: "under_review",
      title: "Kirtan album – 6 shabads",
      preferred: 10,
      time: "10:00",
      duration: 8,
    },
    {
      who: "Simran Kaur",
      artistType: "singer",
      pkg: packageIds[2] ?? null,
      status: "scheduled",
      title: "Shabad with mix & master",
      preferred: 2,
      time: "14:00",
      scheduleDay: 2,
      scheduleTime: "14:00",
      duration: 4,
      remark: "Beautiful voice. Bring harmonium tuned.",
    },
    {
      who: "Bhai Satnam Singh Ragi",
      artistType: "raagi",
      pkg: packageIds[0] ?? null,
      status: "scheduled",
      title: "Raag Asa shabad",
      preferred: 0,
      time: "11:00",
      scheduleDay: 0,
      scheduleTime: "11:00",
      duration: 2,
    },
    {
      who: "Harpreet Singh",
      artistType: "raagi",
      pkg: packageIds[3] ?? null,
      status: "completed",
      title: "Music video – Gurpurab special",
      preferred: -14,
      time: "10:00",
      scheduleDay: -14,
      scheduleTime: "10:00",
      duration: 6,
    },
    {
      who: "Gurbani Youth Band",
      artistType: "band",
      pkg: null,
      status: "rejected",
      title: "Fusion track",
      preferred: 3,
      time: "17:00",
      duration: 3,
      remark: "Please share a devotional track sample and re-apply.",
    },
    {
      who: "Arshdeep Singh",
      artistType: "singer",
      pkg: packageIds[0] ?? null,
      status: "approved",
      title: "First shabad recording",
      preferred: 12,
      time: "12:00",
      duration: 2,
    },
  ];
  const bookingRows = await tx
    .insert(studioBookingsTable)
    .values(
      bookings.map((b) => {
        const l = lead(b.who);
        const scheduledStart =
          b.scheduleDay !== undefined && b.scheduleTime
            ? istDate(istDayOffset(b.scheduleDay), b.scheduleTime)
            : null;
        return {
          leadId: l.id,
          name: l.name,
          phone: l.phone,
          city: l.city,
          artistType: b.artistType,
          experience: "5+ years of kirtan seva",
          sampleLink: b.sample ?? null,
          about: "Would love to record Gurbani professionally.",
          packageId: b.pkg,
          instrumentIds: b.pkg ? [] : [1, 2],
          engineerId: 1,
          addonIds: b.pkg ? [] : [1, 2],
          durationHours: b.duration,
          projectTitle: b.title,
          preferredDate: istDayOffset(b.preferred),
          preferredStartTime: b.time,
          scheduledStart,
          scheduledEnd: scheduledStart
            ? new Date(scheduledStart.getTime() + b.duration * H)
            : null,
          status: b.status,
          adminRemark: b.remark ?? null,
          createdAt: l.createdAt,
        };
      }),
    )
    .returning();
  await tx.insert(leadActivitiesTable).values(
    bookingRows.flatMap((b) => [
      {
        leadId: b.leadId as number,
        kind: "booking_received" as const,
        message: `Studio request #${b.id}: ${b.projectTitle}`,
        createdAt: b.createdAt,
      },
      ...(b.status !== "pending"
        ? [
            {
              leadId: b.leadId as number,
              kind: "booking_status" as const,
              message: `Studio request #${b.id} ${b.status.replace("_", " ")}`,
              adminId,
              createdAt: new Date(b.createdAt.getTime() + 6 * H),
            },
          ]
        : []),
    ]),
  );

  // Contact queries
  const queries = [
    {
      who: "Navjot Kaur",
      subject: "Kirtan for Sukhmani Sahib path",
      message:
        "Sat Sri Akal ji, we'd like Bhai Sahib to do kirtan at our home Sukhmani Sahib path next month. Is he available?",
    },
    {
      who: "Gurdwara Singh Sabha Committee",
      subject: "Gurpurab samagam booking",
      message:
        "Our committee invites Bhai Sahib for the Gurpurab samagam. Please share available dates.",
    },
    {
      who: "Rajinder Singh Bedi",
      subject: "Anand Karaj kirtan in Delhi",
      message: "Looking for kirtan at an Anand Karaj in Delhi in December.",
    },
    {
      who: "Amarjit Kaur",
      subject: "Canada tour",
      message: "Is there any plan for a Canada kirtan tour next year?",
    },
    {
      who: "Mehakdeep Kaur",
      subject: "Harmonium classes",
      message:
        "Does Bhai Sahib teach harmonium to children? My daughter is 10.",
    },
  ];
  await tx.insert(contactQueriesTable).values(
    queries.map((q, i) => {
      const l = lead(q.who);
      return {
        leadId: l.id,
        name: l.name,
        phone: l.phone,
        subject: q.subject,
        message: q.message,
        isRead: i > 1,
        createdAt: l.createdAt,
      };
    }),
  );
  await tx.insert(leadActivitiesTable).values(
    queries.map((q) => ({
      leadId: lead(q.who).id,
      kind: "query_received" as const,
      message: `Query: ${q.subject}`,
      createdAt: lead(q.who).createdAt,
    })),
  );

  // Remarks
  const notes: [string, string][] = [
    [
      "Bhai Manpreet Singh Jatha",
      "Spoke on phone. Jatha has 3 members, wants to record 6 shabads. Checking studio full-day availability.",
    ],
    [
      "Simran Kaur",
      "Very talented. Sent sample on WhatsApp; approved for a recording slot.",
    ],
    [
      "Gurdwara Singh Sabha Committee",
      "Committee president called. Wants confirmation within a week.",
    ],
    [
      "Harpreet Singh",
      "Session done. Video edit delivered. Asked to tag our page when publishing.",
    ],
    [
      "Rajinder Singh Bedi",
      "Date clashes with Canada samagam. Suggested alternate jatha.",
    ],
    [
      "Sukhmani Sewa Society",
      "Annual samagam in Khanna, needs kirtan on evening of 2nd Sunday.",
    ],
  ];
  await tx.insert(leadNotesTable).values(
    notes.map(([who, body], i) => ({
      leadId: lead(who).id,
      adminId,
      body,
      createdAt: new Date(Date.now() - (i + 1) * 20 * H),
    })),
  );

  // Follow-ups: overdue, today, upcoming, done
  const fu: [
    string,
    number,
    number,
    "call" | "whatsapp" | "visit" | "meeting",
    string,
    "pending" | "done",
  ][] = [
    [
      "Jaskaran Singh",
      0,
      11,
      "call",
      "Review studio request & call back",
      "pending",
    ],
    [
      "Navjot Kaur",
      0,
      16,
      "whatsapp",
      "Share available dates for path",
      "pending",
    ],
    [
      "Gurdwara Singh Sabha Committee",
      -1,
      12,
      "call",
      "Confirm Gurpurab samagam date",
      "pending",
    ],
    [
      "Sukhmani Sewa Society",
      -2,
      10,
      "meeting",
      "Meet committee at Khanna",
      "pending",
    ],
    [
      "Bhai Manpreet Singh Jatha",
      1,
      11,
      "call",
      "Confirm album day slot",
      "pending",
    ],
    [
      "Parminder Singh",
      2,
      17,
      "whatsapp",
      "Send studio application link",
      "pending",
    ],
    [
      "Gurbani Youth Band",
      3,
      12,
      "call",
      "Discuss devotional track re-application",
      "pending",
    ],
    [
      "Kulwant Singh",
      4,
      10,
      "whatsapp",
      "Share upcoming programme list",
      "pending",
    ],
    [
      "Khalsa College Gurmat Sangeet Dept.",
      6,
      15,
      "visit",
      "Visit department for workshop plan",
      "pending",
    ],
    [
      "Mehakdeep Kaur",
      1,
      18,
      "call",
      "Reply about harmonium classes",
      "pending",
    ],
    ["Harpreet Singh", -10, 12, "call", "Feedback on video", "done"],
    ["Tejinder Pal Singh", -5, 11, "whatsapp", "Sent studio info", "done"],
  ];
  await tx.insert(followUpsTable).values(
    fu.map(([who, day, hour, type, title, status]) => ({
      leadId: lead(who).id,
      dueAt: istDate(istDayOffset(day), `${String(hour).padStart(2, "0")}:00`),
      type,
      title,
      status,
      completedAt:
        status === "done" ? istDate(istDayOffset(day), "18:00") : null,
    })),
  );

  // WhatsApp templates & lists
  await tx.insert(waTemplatesTable).values([
    {
      name: "Gurpurab greetings",
      category: "broadcast",
      body: "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh {{name}} ji 🙏\n\nGurpurab diyan lakh lakh vadhaiyan! Join us for kirtan this week.\n{{link}}",
    },
    {
      name: "Studio application follow-up",
      category: "followup",
      body: "Sat Sri Akal {{name}} ji 🙏 Thank you for applying to record at our studio. Could you share a short sample (voice note or YouTube link) so we can schedule your free session?",
    },
    {
      name: "Share new release",
      category: "share",
      body: "Sat Sri Akal {{name}} ji 🙏 Bhai Gurpreet Singh Ji Shimla Wale's new shabad is out now. Please listen and share with sangat:\n{{link}}",
    },
    {
      name: "Session reminder",
      category: "followup",
      body: "Sat Sri Akal {{name}} ji, a reminder of your studio session tomorrow at Ghanta Ghar, Ludhiana. Please arrive 15 minutes early with your instruments tuned. 🙏",
    },
  ]);
  const lists = await tx
    .insert(waBroadcastListsTable)
    .values([
      {
        name: "Raagi Jathas",
        description: "Raagis and kirtani jathas we work with",
      },
      {
        name: "Studio Clients",
        description: "Everyone who applied to record at the studio",
      },
      {
        name: "Gurpurab Updates",
        description: "Committees, sangat and event contacts",
      },
    ])
    .returning();
  const [raagi, studio, gurpurab] = lists;
  const members: { listId: number; leadId: number }[] = [];
  for (const l of inserted) {
    if (raagi && (l.tags.includes("raagi") || l.tags.includes("kirtani_jatha")))
      members.push({ listId: raagi.id, leadId: l.id });
    if (studio && l.tags.includes("studio"))
      members.push({ listId: studio.id, leadId: l.id });
    if (gurpurab && (l.tags.includes("event") || l.tags.includes("query")))
      members.push({ listId: gurpurab.id, leadId: l.id });
  }
  if (members.length)
    await tx.insert(waBroadcastListMembersTable).values(members);
}
