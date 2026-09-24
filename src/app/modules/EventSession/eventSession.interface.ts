export interface TCreateEventSession {
  eventId: number;
  sessionDate: string | Date;
  chapter?: string;
  summary?: string;
  audioUrl?: string;
}

export interface TUpdateEventSession {
  eventId?: number;
  sessionDate?: string | Date;
  chapter?: string;
  summary?: string;
  audioUrl?: string;
}
