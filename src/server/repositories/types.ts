export interface Court {
  id: string;
  clubId: string;
  name: string;
  sport: "futbol5" | "futbol7" | "padel" | "tenis";
  pricePerSlot: number;
  active: boolean;
}

export interface Booking {
  id: string;
  courtId: string;
  userId: string;
  startsAt: Date;
  endsAt: Date;
  price: number;
  status: "confirmed" | "cancelled_by_player" | "cancelled_by_club";
  cancelledAt: Date | null;
}

export interface Club {
  id: string;
  slug: string;
  name: string;
  city: string;
  barrio: string | null;
  lat: number;
  lng: number;
  openHour: number;
  closeHour: number;
  slotMinutes: number;
}

export interface CourtRepository {
  findById(id: string): Promise<Court | null>;
  findByClubId(clubId: string): Promise<Court[]>;
  setActive(id: string, active: boolean): Promise<void>;
  setPrice(id: string, pricePerSlot: number): Promise<void>;
  create(input: {
    id: string;
    clubId: string;
    name: string;
    sport: Court["sport"];
    pricePerSlot: number;
  }): Promise<Court>;
}

export interface BookingRepository {
  create(input: {
    id: string;
    courtId: string;
    userId: string;
    startsAt: Date;
    endsAt: Date;
    price: number;
  }): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findFutureConfirmedByCourtId(courtId: string, after: Date): Promise<Booking[]>;
  findConfirmedByCourtIdInRange(
    courtId: string,
    start: Date,
    end: Date,
  ): Promise<Booking[]>;
  cancelFutureByCourtId(
    courtId: string,
    after: Date,
    status: "cancelled_by_club",
  ): Promise<number>;
  cancel(id: string, status: "cancelled_by_player", cancelledAt: Date): Promise<void>;
  findByUserId(userId: string): Promise<Booking[]>;
}

export interface ClubRepository {
  findById(id: string): Promise<Club | null>;
  findBySlug(slug: string): Promise<Club | null>;
}

export interface ClubWithCourts {
  club: Club;
  courts: Court[];
}

export interface SearchRepository {
  findClubsBySportAndCity(
    sport: Court["sport"],
    city: string,
  ): Promise<ClubWithCourts[]>;
}
