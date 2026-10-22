import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["player", "club_admin"]);
export const sportEnum = pgEnum("sport", [
  "futbol5",
  "futbol7",
  "padel",
  "tenis",
]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "cancelled_by_player",
  "cancelled_by_club",
]);

// Tabla de usuarios de Better Auth, extendida con `role` para el dominio.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: roleEnum("role").notNull().default("player"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const clubs = pgTable("clubs", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  barrio: text("barrio"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  openHour: integer("open_hour").notNull(),
  closeHour: integer("close_hour").notNull(),
  slotMinutes: integer("slot_minutes").notNull().default(60),
});

export const clubAdmins = pgTable("club_admins", {
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const courts = pgTable("courts", {
  id: text("id").primaryKey(),
  clubId: text("club_id")
    .notNull()
    .references(() => clubs.id),
  name: text("name").notNull(),
  sport: sportEnum("sport").notNull(),
  pricePerSlot: integer("price_per_slot").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    courtId: text("court_id")
      .notNull()
      .references(() => courts.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    price: integer("price").notNull(),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // RN-01: no dos reservas confirmadas en la misma cancha y horario.
    uniqueIndex("bookings_court_slot_confirmed_idx")
      .on(table.courtId, table.startsAt)
      .where(sql`${table.status} = 'confirmed'`),
  ],
);
