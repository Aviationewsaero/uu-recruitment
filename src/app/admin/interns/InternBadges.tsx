export function InternStatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    PENDING_VERIFICATION: "bg-amber-100 text-amber-800",
    ACTIVE: "bg-brand-green/15 text-brand-green-dark",
    INACTIVE: "bg-gray-100 text-gray-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    TERMINATED: "bg-red-100 text-red-800",
  };

  const labels: Record<string, string> = {
    PENDING_VERIFICATION: "Awaiting Approval",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    COMPLETED: "Completed",
    TERMINATED: "Terminated",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {labels[status] || status}
    </span>
  );
}

export function DepartmentBadge({
  department,
}: {
  department: string;
}) {
  const styles: Record<string, string> = {
    DIGITAL_MARKETING: "bg-purple-100 text-purple-800",
    MBA_HR: "bg-indigo-100 text-indigo-800",
    OTHER: "bg-gray-100 text-gray-800",
  };

  const labels: Record<string, string> = {
    DIGITAL_MARKETING: "Digital Marketing",
    MBA_HR: "MBA HR",
    OTHER: "Other",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[department] || "bg-gray-100 text-gray-800"}`}>
      {labels[department] || department}
    </span>
  );
}
