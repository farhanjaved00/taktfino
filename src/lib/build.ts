import { SITE } from '../config/site';
import { parseISO, todayIn } from './dates';
/** "Today" baked into static HTML. Override with BUILD_DATE=YYYY-MM-DD for testing. */
export const BUILD_TODAY = parseISO(process.env.BUILD_DATE) || todayIn(SITE.buildTimeZone);
export const BUILD_NOW = new Date();
