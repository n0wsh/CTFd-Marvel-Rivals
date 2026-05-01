export function formatElapsedSince(
  value: string | null | undefined,
  now = Date.now()
) {
  if (!value) {
    return "No solves yet";
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}m ago`;
  }

  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);

    return minutes > 0 ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
  }

  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function formatTimeAgo(value: string | null | undefined) {
  if (!value) {
    return "No solves yet";
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return "Unknown";
  }

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  if (diffSeconds < 3600) {
    return `${Math.floor(diffSeconds / 60)}m ago`;
  }

  if (diffSeconds < 86400) {
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  }

  return `${Math.floor(diffSeconds / 86400)}d ago`;
}
