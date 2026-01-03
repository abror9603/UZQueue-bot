/**
 * Extended Telegraf Context types
 */

import { Context as TelegrafContext } from 'telegraf';
import { IUser, IOrganization, Language } from './index';

/**
 * Session data for queue booking
 */
export interface QueueSessionData {
  currentOrganization?: string;
  currentService?: string;
  selectedDate?: string;
  selectedTime?: string;
  [key: string]: any;
}

export interface SessionData {
  step?: string;
  data?: QueueSessionData | any;
}

export interface ExtendedContext extends TelegrafContext {
  user?: IUser;
  organization?: IOrganization;
  language: Language;
  session?: SessionData;
}

