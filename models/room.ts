export interface Room {
  id: number;
  golfClubName: string;
  golfClubImg: string | null;
  planName: string;
  latestDate: string | null;
  unreadCount: number;
}