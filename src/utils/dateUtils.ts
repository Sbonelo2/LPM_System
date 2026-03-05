/**
 * Formats a date string or Date object to 'dd Month yyyy' (e.g., 05 March 2026)
 */
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  
  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};

/**
 * Formats a date string or Date object to 'dd Month yyyy HH:mm'
 */
export const formatDateTime = (date: string | Date | undefined | null): string => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  
  const time = d.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  return `${formatDate(d)} ${time}`;
};
