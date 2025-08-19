export class SessionExpired extends Error {
  public name = 'SessionExpired';

  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, SessionExpired.prototype);
  }
}
