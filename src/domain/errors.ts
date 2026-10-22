export class SlotTakenError extends Error {
  constructor() {
    super("Ese turno se acaba de ocupar");
    this.name = "SlotTakenError";
  }
}

export class CourtDisabledError extends Error {
  constructor() {
    super("La cancha esta deshabilitada");
    this.name = "CourtDisabledError";
  }
}

export class PastSlotError extends Error {
  constructor() {
    super("No se puede reservar un turno que ya empezo");
    this.name = "PastSlotError";
  }
}

export class InvalidSlotError extends Error {
  constructor() {
    super("El turno no esta alineado al horario del club");
    this.name = "InvalidSlotError";
  }
}

export class NotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} no encontrado`);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor() {
    super("No tenes permiso para esta accion");
    this.name = "ForbiddenError";
  }
}
