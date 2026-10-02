import type { TX } from "$/db";
import {
  contactQueriesTable,
  followUpsTable,
  type KirtanBookingStatus,
  type KirtanEventType,
  type KirtanRequirement,
  kirtanBookingsTable,
  type LeadSource,
  type LeadStatus,
  leadActivitiesTable,
  leadNotesTable,
  leadsTable,
  type SangatSize,
  type VenueType,
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
    source: "kirtan_booking",
    status: "new",
    tags: ["kirtan", "sukhmani_sahib", "amritsar"],
    daysAgo: 1,
    priority: "high",
  },
  {
    name: "Gurdwara Guru Nanak Darbar, Ulhasnagar",
    phone: "919814000102",
    city: "Ulhasnagar",
    source: "kirtan_booking",
    status: "contacted",
    tags: ["kirtan", "prabhat_pheri", "ulhasnagar"],
    daysAgo: 3,
    priority: "high",
  },
  {
    name: "Simran Kaur",
    phone: "919814000103",
    city: "Ludhiana",
    source: "kirtan_booking",
    status: "confirmed",
    tags: ["kirtan", "anand_karaj", "ludhiana"],
    daysAgo: 6,
    priority: "high",
  },
  {
    name: "Harpreet Singh",
    phone: "919814000104",
    city: "Jalandhar",
    source: "kirtan_booking",
    status: "completed",
    tags: ["kirtan", "akhand_path_bhog", "jalandhar"],
    daysAgo: 21,
  },
  {
    name: "Mumbai Sikh Sangat Trust",
    phone: "919814000105",
    city: "Mumbai",
    source: "kirtan_booking",
    status: "follow_up",
    tags: ["kirtan", "silent_kirtan", "mumbai"],
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
    status: "completed",
    tags: ["kirtan", "griha_pravesh"],
    daysAgo: 35,
  },
  {
    name: "Ravneet Kaur",
    phone: "919814000114",
    city: "Delhi",
    source: "kirtan_booking",
    status: "new",
    tags: ["kirtan", "birthday_anniversary", "delhi"],
    daysAgo: 0,
  },
  {
    name: "Gurdwara Sri Guru Singh Sabha, Amritsar",
    phone: "919814000115",
    city: "Amritsar",
    source: "kirtan_booking",
    status: "confirmed",
    tags: ["kirtan", "gurpurab", "amritsar"],
    daysAgo: 10,
  },
  {
    name: "Inderjit Singh",
    phone: "919814000116",
    city: "Phagwara",
    source: "manual",
    status: "closed",
    tags: ["kirtan"],
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
    tags: ["whatsapp", "kirtan"],
    daysAgo: 6,
  },
  {
    name: "Arshdeep Singh",
    phone: "919814000120",
    city: "Ludhiana",
    source: "kirtan_booking",
    status: "closed",
    tags: ["kirtan", "business_opening", "ludhiana"],
    daysAgo: 2,
  },
];

export async function crmSeed(tx: TX, adminId: number) {
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

  // Kirtan bookings
  type B = {
    who: string;
    eventType: KirtanEventType;
    subject: string;
    status: KirtanBookingStatus;
    day: number;
    time: string;
    duration: number;
    venueType: VenueType;
    venueName?: string;
    address: string;
    state: string;
    sangat: SangatSize;
    requirements: KirtanRequirement[];
    confirmed?: boolean;
    message?: string;
    remark?: string;
  };
  const bookings: B[] = [
    {
      who: "Jaskaran Singh",
      eventType: "sukhmani_sahib",
      subject: "Sukhmani Sahib path & kirtan at home",
      status: "new",
      day: 9,
      time: "10:00",
      duration: 2,
      venueType: "home",
      address: "House 42, Ranjit Avenue",
      state: "Punjab",
      sangat: "under_50",
      requirements: ["need_sound"],
      message:
        "Path is for our new home. Family would love Bhai Sahib's kirtan.",
    },
    {
      who: "Ravneet Kaur",
      eventType: "birthday_anniversary",
      subject: "Kirtan on parents' 50th anniversary",
      status: "new",
      day: 18,
      time: "17:00",
      duration: 2,
      venueType: "banquet_hall",
      venueName: "Grand Banquets",
      address: "Rajouri Garden",
      state: "Delhi",
      sangat: "50_200",
      requirements: ["sound_available", "langar_arranged"],
    },
    {
      who: "Gurdwara Guru Nanak Darbar, Ulhasnagar",
      eventType: "prabhat_pheri",
      subject: "Gurpurab Prabhat Pheri & Silent Kirtan",
      status: "contacted",
      day: 30,
      time: "03:00",
      duration: 2,
      venueType: "gurdwara",
      venueName: "Gurdwara Guru Nanak Darbar",
      address: "Camp No. 3",
      state: "Maharashtra",
      sangat: "500_plus",
      requirements: ["silent_kirtan_headphones", "live_stream"],
      message:
        "Like last year's record event, we want daily Prabhat Pheri before Guru Nanak Jayanti.",
    },
    {
      who: "Simran Kaur",
      eventType: "anand_karaj",
      subject: "Anand Karaj kirtan",
      status: "confirmed",
      day: 2,
      time: "09:30",
      duration: 3,
      venueType: "gurdwara",
      venueName: "Gurdwara Dukh Niwaran Sahib",
      address: "Model Town",
      state: "Punjab",
      sangat: "200_500",
      requirements: ["sound_available", "langar_arranged"],
      confirmed: true,
      remark: "Laavan at 10:30. Family will arrange transport from Ludhiana.",
    },
    {
      who: "Gurdwara Sri Guru Singh Sabha, Amritsar",
      eventType: "gurpurab",
      subject: "Gurpurab evening kirtan darbar",
      status: "confirmed",
      day: 0,
      time: "19:00",
      duration: 3,
      venueType: "gurdwara",
      venueName: "Gurdwara Sri Guru Singh Sabha",
      address: "Lawrence Road",
      state: "Punjab",
      sangat: "500_plus",
      requirements: ["sound_available", "live_stream"],
      confirmed: true,
    },
    {
      who: "Harpreet Singh",
      eventType: "akhand_path_bhog",
      subject: "Akhand Path bhog kirtan",
      status: "completed",
      day: -14,
      time: "10:00",
      duration: 2,
      venueType: "home",
      address: "Urban Estate Phase 2",
      state: "Punjab",
      sangat: "50_200",
      requirements: ["need_sound"],
      confirmed: true,
    },
    {
      who: "Mumbai Sikh Sangat Trust",
      eventType: "silent_kirtan",
      subject: "Silent Kirtan for Amritvela samagam",
      status: "contacted",
      day: 45,
      time: "04:00",
      duration: 2,
      venueType: "open_ground",
      venueName: "Shivaji Park",
      address: "Dadar West",
      state: "Maharashtra",
      sangat: "500_plus",
      requirements: ["silent_kirtan_headphones"],
    },
    {
      who: "Arshdeep Singh",
      eventType: "business_opening",
      subject: "Kirtan for new showroom opening",
      status: "declined",
      day: 3,
      time: "11:00",
      duration: 1,
      venueType: "other",
      venueName: "Arsh Motors",
      address: "Ferozepur Road",
      state: "Punjab",
      sangat: "under_50",
      requirements: [],
      remark:
        "Jatha already booked at Amritsar that day. Shared alternate dates.",
    },
  ];
  const bookingRows = await tx
    .insert(kirtanBookingsTable)
    .values(
      bookings.map((b) => {
        const l = lead(b.who);
        const scheduledStart = b.confirmed
          ? istDate(istDayOffset(b.day), b.time)
          : null;
        return {
          leadId: l.id,
          name: l.name,
          phone: l.phone,
          whatsapp: l.phone,
          eventType: b.eventType,
          subject: b.subject,
          language: "either" as const,
          expectedSangat: b.sangat,
          requirements: b.requirements,
          message: b.message ?? null,
          referralSource: "YouTube",
          eventDate: istDayOffset(b.day),
          startTime: b.time,
          durationHours: b.duration,
          scheduledStart,
          scheduledEnd: scheduledStart
            ? new Date(scheduledStart.getTime() + b.duration * H)
            : null,
          venueType: b.venueType,
          venueName: b.venueName ?? null,
          address: b.address,
          city: l.city ?? "",
          state: b.state,
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
        kind: "kirtan_booking_received" as const,
        message: `Kirtan request #${b.id}: ${b.subject} — ${b.city}`,
        createdAt: b.createdAt,
      },
      ...(b.status !== "new"
        ? [
            {
              leadId: b.leadId as number,
              kind: "kirtan_booking_status" as const,
              message: `Kirtan booking #${b.id} ${b.status}`,
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
      "Gurdwara Guru Nanak Darbar, Ulhasnagar",
      "Spoke to the pardhan ji. Want a repeat of the 43-day Prabhat Pheri with Silent Kirtan headphones. Need sangat count for headphones.",
    ],
    [
      "Simran Kaur",
      "Anand Karaj confirmed. Family will arrange transport; jatha of 4 + sound engineer.",
    ],
    [
      "Gurdwara Singh Sabha Committee",
      "Committee president called. Wants confirmation within a week.",
    ],
    [
      "Harpreet Singh",
      "Bhog kirtan done. Family very happy, shared video on Facebook and tagged our page.",
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
      "Call back about Sukhmani Sahib kirtan",
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
      "Gurdwara Guru Nanak Darbar, Ulhasnagar",
      1,
      11,
      "call",
      "Confirm headphone count & Prabhat Pheri route",
      "pending",
    ],
    [
      "Parminder Singh",
      2,
      17,
      "whatsapp",
      "Send Book Kirtan form link",
      "pending",
    ],
    [
      "Mumbai Sikh Sangat Trust",
      3,
      12,
      "call",
      "Discuss Silent Kirtan arrangements",
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
    ["Harpreet Singh", -10, 12, "call", "Feedback on bhog kirtan", "done"],
    ["Tejinder Pal Singh", -5, 11, "whatsapp", "Sent program schedule", "done"],
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
      name: "Kirtan request follow-up",
      category: "followup",
      body: "Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh {{name}} ji 🙏 Thank you for inviting Bhai Gurpreet Singh Ji for kirtan. When is a good time to call and plan the program?",
    },
    {
      name: "Share new release",
      category: "share",
      body: "Sat Sri Akal {{name}} ji 🙏 Bhai Gurpreet Singh Ji Shimla Wale's new shabad is out now. Please listen and share with sangat:\n{{link}}",
    },
    {
      name: "Program reminder",
      category: "followup",
      body: "Sat Sri Akal {{name}} ji 🙏 A reminder that the jatha will reach your venue tomorrow for kirtan. Please share the exact location pin and a contact person on WhatsApp.",
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
        name: "Kirtan Hosts",
        description: "Families and committees who booked kirtan",
      },
      {
        name: "Gurpurab Updates",
        description: "Committees, sangat and event contacts",
      },
    ])
    .returning();
  const [raagi, hosts, gurpurab] = lists;
  const members: { listId: number; leadId: number }[] = [];
  for (const l of inserted) {
    if (raagi && (l.tags.includes("raagi") || l.tags.includes("kirtani_jatha")))
      members.push({ listId: raagi.id, leadId: l.id });
    if (hosts && l.tags.includes("kirtan"))
      members.push({ listId: hosts.id, leadId: l.id });
    if (gurpurab && (l.tags.includes("event") || l.tags.includes("query")))
      members.push({ listId: gurpurab.id, leadId: l.id });
  }
  if (members.length)
    await tx.insert(waBroadcastListMembersTable).values(members);
}
