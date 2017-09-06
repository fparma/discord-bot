import { PBO_STATES } from './pbo/pbo-states-enum';

export const DB_ERROR = 'There was an issue contacting database. Try again later!';
export const DB_USER_NOT_FOUND = 'Sorry, could not find that user';

export const REPLY_PROVIDE_ARGUMENT = 'Please provide an argument';
export const REPLY_USER_STATS = (name: string, date: Date, count: number): string => {
  const event = count === 1 ? 'event' : 'events';
  return `${name} joined on ${date.toISOString().substr(0, 10)} and has registered for ${count} ${event}`;
}

export const NEW_EVENT = (name: string, authors: string, permalink: string) => {
  const url = 'https://fparma.herokuapp.com/events/event/' + permalink;
  return `:joystick: New event! ${name} by ${authors}. ${url} :rocket:`;
}

export const UPLOAD_VALIDATION_LONGER_NAME = 'Please provide a longer name (min 6 chars)';
export const UPLOAD_VALIDATION_PROVIDE_WORLD = 'Invalid wanted filename. Did you include world? (example.tanoa)';
export const UPLOAD_VALIDATION_INVALID_URL = 'Bad URL. Must be a direct link to a .pbo';

export const pboStateToReply = (state: PBO_STATES): string => {
  switch (state) {
    case PBO_STATES.DOWNLOAD_BAD_HEADERS:
    case PBO_STATES.DOWNLOAD_BAD_HOST:
    case PBO_STATES.DOWNLOAD_BAD_STATUS_CODE:
      return `There was an issue with your host. Maybe try a different host site?`;
    case PBO_STATES.DOWNLOAD_OK: 'oke!'
  }

  return 'An unknown error occurred. Try again later';
}
