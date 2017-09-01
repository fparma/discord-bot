export const DB_ERROR = 'There was an issue contacting database. Try again later!';
export const DB_USER_NOT_FOUND = 'Sorry, could not find that user';

export const REPLY_PROVIDE_ARGUMENT = 'Please provide an argument';
export const REPLY_USER_STATS = (name: string, date: Date, count: number): string => {
  const event = count === 1 ? 'event' : 'events';
  return `${name} joined on ${date.toISOString().substr(0, 10)} and has registered for ${count} ${event}`;
}