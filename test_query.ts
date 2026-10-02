import prisma from './src/lib/db';
import { ActivityService } from './src/app/modules/Activity/activity.service';
import { EventService } from './src/app/modules/Event/event.service';
import { ArticleService } from './src/app/modules/Article/article.service';
import { ReviewService } from './src/app/modules/Review/review.service';

async function test() {
  const evRUDC = await EventService.getAllEventsFromDB({ org: 'RUDC' });
  console.log('EventService RUDC:', evRUDC.meta.total, evRUDC.data.map((d: any) => ({ title: d.title, org: d.org })));

  const evRUIL = await EventService.getAllEventsFromDB({ org: 'RUIL' });
  console.log('EventService RUIL:', evRUIL.meta.total, evRUIL.data.map((d: any) => ({ title: d.title, org: d.org })));

  const artRUDC = await ArticleService.getAllArticlesFromDB({ org: 'RUDC' });
  console.log('ArticleService RUDC:', artRUDC.meta.total, artRUDC.data.map((d: any) => ({ title: d.title, org: d.org })));

  const artRUIL = await ArticleService.getAllArticlesFromDB({ org: 'RUIL' });
  console.log('ArticleService RUIL:', artRUIL.meta.total, artRUIL.data.map((d: any) => ({ title: d.title, org: d.org })));

  const revRUDC = await ReviewService.getServiceReviewsFromDB('RUDC');
  console.log('ReviewService RUDC:', revRUDC.totalReviews, revRUDC.reviews.map((r: any) => ({ id: r.id, org: r.org })));

  const revRUIL = await ReviewService.getServiceReviewsFromDB('RUIL');
  console.log('ReviewService RUIL:', revRUIL.totalReviews, revRUIL.reviews.map((r: any) => ({ id: r.id, org: r.org })));
}
test().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
