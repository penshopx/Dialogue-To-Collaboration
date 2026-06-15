import { useQuery } from "@tanstack/react-query";

export interface AppNotification {
  id: string;
  type: "gate_pending" | "overdue" | "completed";
  title: string;
  message: string;
  href: string;
  urgency: "high" | "low";
}

interface NotificationsResponse {
  notifications: AppNotification[];
  count: number;
}

export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: () => fetch("/api/notifications").then((r) => r.json()),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
