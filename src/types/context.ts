/**
 * Extended Telegraf Context types
 */

import { Context as TelegrafContext } from 'telegraf';
import { IUser, IOrganization, Language } from './index';

export interface ExtendedContext extends TelegrafContext {
  user?: IUser;
  organization?: IOrganization;
  language: Language;
  session?: {
    step?: string;
    data?: any;
  };
}

