export type TRudcTeamPayload = {
  name: string;
  description?: string;
};

export type TAssignTeamMembersPayload = {
  teamId: number;
  userIds: string[];
  role?: string;
};
