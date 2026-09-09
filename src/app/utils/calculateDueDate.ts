/**
 * Calculates due date based on formula: 1 day maximum for every 15 pages (Math.ceil(pages / 15) days, min 1 day)
 * @param pages Total number of pages of the borrowed book
 * @param startDate Starting date of borrow (defaults to current date / approval date)
 * @returns Calculated due Date object
 */
export const calculateDueDate = (pages: number, startDate: Date = new Date()): Date => {
  const safePages = pages && pages > 0 ? pages : 15;
  const daysAllowed = Math.max(1, Math.ceil(safePages / 15));
  const dueDate = new Date(startDate.getTime());
  dueDate.setDate(dueDate.getDate() + daysAllowed);
  return dueDate;
};

export default calculateDueDate;
