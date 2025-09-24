export interface AdminUserStat {
  userId: string;
  displayName: string;
  email: string | null;
  linksCount: number;
  linksShare: number;
}

export interface AdminActivityPoint {
  date: string;
  linksCount: number;
}

export interface AdminTagStat {
  tagName: string;
  color: string;
  usageCount: number;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalLinks: number;
  averageLinksPerUser: number;
  linksByUser: AdminUserStat[];
  activityByDay: AdminActivityPoint[];
  popularTags: AdminTagStat[];
}
