import { ActivityStatus, Organization } from '@prisma/client';

export interface TCreateActivity {
  org?: Organization;
  title: string;
  category?: string;
  description?: string;
  bannerImage?: string;
  status?: ActivityStatus;
}

export interface TUpdateActivity {
  org?: Organization;
  title?: string;
  category?: string;
  description?: string;
  bannerImage?: string;
  status?: ActivityStatus;
}
