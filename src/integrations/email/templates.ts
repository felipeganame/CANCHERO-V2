export function bookingConfirmedEmail(input: {
  playerName: string;
  clubName: string;
  courtName: string;
  startsAt: Date;
  price: number;
}): { subject: string; html: string } {
  const fecha = input.startsAt.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    dateStyle: "full",
    timeStyle: "short",
  });
  return {
    subject: `Reserva confirmada en ${input.clubName}`,
    html: `<p>Hola ${input.playerName},</p>
<p>Tu reserva en <strong>${input.clubName}</strong> (${input.courtName}) quedó confirmada para el ${fecha}.</p>
<p>Precio: $${input.price}</p>`,
  };
}

export function bookingCancelledByClubEmail(input: {
  playerName: string;
  clubName: string;
  courtName: string;
  startsAt: Date;
}): { subject: string; html: string } {
  const fecha = input.startsAt.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    dateStyle: "full",
    timeStyle: "short",
  });
  return {
    subject: `Tu reserva en ${input.clubName} fue cancelada`,
    html: `<p>Hola ${input.playerName},</p>
<p>El club canceló tu reserva en <strong>${input.clubName}</strong> (${input.courtName}) del ${fecha}.</p>`,
  };
}

export function welcomeEmail(input: { name: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "Bienvenido a Canchero",
    html: `<p>Hola ${input.name}, gracias por registrarte en Canchero.</p>`,
  };
}
